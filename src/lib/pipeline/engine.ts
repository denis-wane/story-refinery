import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db";
import { GENERATE_STEPS, REFINE_STEPS } from "./steps";
import type {
  PipelineMode,
  PipelineRun,
  PipelineStep,
  Review,
  StepDefinition,
  RefineSource,
} from "@/types";

// In-memory event emitters per run for SSE
type EventCallback = (event: {
  type: string;
  step_id?: string;
  data: Record<string, unknown>;
}) => void;
const listeners = new Map<string, Set<EventCallback>>();

export function subscribe(runId: string, cb: EventCallback) {
  if (!listeners.has(runId)) listeners.set(runId, new Set());
  listeners.get(runId)!.add(cb);
  return () => {
    listeners.get(runId)?.delete(cb);
    if (listeners.get(runId)?.size === 0) listeners.delete(runId);
  };
}

function emit(
  runId: string,
  type: string,
  stepId: string | undefined,
  data: Record<string, unknown>
) {
  listeners.get(runId)?.forEach((cb) => cb({ type, step_id: stepId, data }));
}

export function createRun(
  mode: PipelineMode,
  input: string,
  refineSource?: RefineSource,
  refinePath?: string
): PipelineRun {
  const db = getDb();
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO pipeline_runs (id, mode, status, input, refine_source, refine_path, created_at, updated_at)
     VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`
  ).run(id, mode, input, refineSource ?? null, refinePath ?? null, now, now);

  const steps: StepDefinition[] =
    mode === "generate" ? GENERATE_STEPS : REFINE_STEPS;

  const insertStep = db.prepare(
    `INSERT INTO pipeline_steps (id, run_id, name, agent, order_index, status, review_gate)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`
  );

  for (let i = 0; i < steps.length; i++) {
    insertStep.run(uuid(), id, steps[i].name, steps[i].agent, i, steps[i].review_gate ? 1 : 0);
  }

  return getRun(id)!;
}

export function getRun(id: string): PipelineRun | null {
  const db = getDb();
  return db.prepare("SELECT * FROM pipeline_runs WHERE id = ?").get(id) as PipelineRun | null;
}

export function listRuns(): PipelineRun[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM pipeline_runs ORDER BY created_at DESC")
    .all() as PipelineRun[];
}

export function getSteps(runId: string): PipelineStep[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM pipeline_steps WHERE run_id = ? ORDER BY order_index")
    .all(runId) as PipelineStep[];
}

export function getStep(stepId: string): PipelineStep | null {
  const db = getDb();
  return db.prepare("SELECT * FROM pipeline_steps WHERE id = ?").get(stepId) as PipelineStep | null;
}

export function getReviews(stepId: string): Review[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM reviews WHERE step_id = ? ORDER BY created_at DESC")
    .all(stepId) as Review[];
}

export function addReview(
  stepId: string,
  runId: string,
  comments: string,
  approved: boolean
): Review {
  const db = getDb();
  const id = uuid();

  db.prepare(
    `INSERT INTO reviews (id, step_id, run_id, comments, approved, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).run(id, stepId, runId, comments, approved ? 1 : 0);

  if (approved) {
    db.prepare("UPDATE pipeline_steps SET status = 'completed' WHERE id = ?").run(stepId);
    db.prepare(
      "UPDATE pipeline_runs SET status = 'running', updated_at = datetime('now') WHERE id = ?"
    ).run(runId);
    emit(runId, "review_approved", stepId, { approved: true });
  }

  return db.prepare("SELECT * FROM reviews WHERE id = ?").get(id) as Review;
}

export function updateStepStatus(
  stepId: string,
  status: string,
  output?: string,
  error?: string
) {
  const db = getDb();
  const now = new Date().toISOString();
  if (status === "running") {
    db.prepare("UPDATE pipeline_steps SET status = ?, started_at = ? WHERE id = ?").run(
      status,
      now,
      stepId
    );
  } else if (status === "completed" || status === "failed") {
    db.prepare(
      "UPDATE pipeline_steps SET status = ?, output = ?, error = ?, completed_at = ? WHERE id = ?"
    ).run(status, output ?? null, error ?? null, now, stepId);
  } else {
    db.prepare("UPDATE pipeline_steps SET status = ? WHERE id = ?").run(status, stepId);
  }
}

export function updateRunStatus(runId: string, status: string) {
  const db = getDb();
  db.prepare(
    "UPDATE pipeline_runs SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status, runId);
}

// Execute pipeline from a given step index
export async function executePipeline(
  runId: string,
  fromStepIndex = 0
): Promise<void> {
  const db = getDb();
  const run = getRun(runId);
  if (!run) throw new Error(`Run ${runId} not found`);

  updateRunStatus(runId, "running");
  const steps = getSteps(runId);
  const stepDefs =
    run.mode === "generate" ? GENERATE_STEPS : REFINE_STEPS;

  let previousOutput = run.input;

  // Gather output from completed steps before fromStepIndex
  for (let i = 0; i < fromStepIndex; i++) {
    if (steps[i].output) previousOutput = steps[i].output!;
  }

  for (let i = fromStepIndex; i < steps.length; i++) {
    const step = steps[i];
    const def = stepDefs[i];

    updateStepStatus(step.id, "running");
    emit(runId, "step_started", step.id, { name: def.name, index: i });

    try {
      // Build prompt from template
      const prompt = def.prompt_template
        .replace("{{input}}", previousOutput)
        .replace("{{context}}", "")
        .replace("{{original}}", run.input);

      // Store input for this step
      db.prepare("UPDATE pipeline_steps SET input = ? WHERE id = ?").run(
        previousOutput,
        step.id
      );

      // Call Claude API
      const output = await callAgent(prompt, run);

      updateStepStatus(step.id, "completed", output);
      previousOutput = output;

      emit(runId, "step_completed", step.id, {
        name: def.name,
        output_length: output.length,
      });

      // Check for review gate
      if (def.review_gate) {
        updateStepStatus(step.id, "review_pending");
        updateRunStatus(runId, "paused");
        emit(runId, "review_required", step.id, { name: def.name });
        return; // Pause execution until review is submitted
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      updateStepStatus(step.id, "failed", undefined, message);
      updateRunStatus(runId, "failed");
      emit(runId, "step_failed", step.id, { name: def.name, error: message });
      return;
    }
  }

  updateRunStatus(runId, "completed");
  emit(runId, "run_completed", undefined, {});
}

// Resume pipeline after a review approval
export async function resumeAfterReview(runId: string): Promise<void> {
  const steps = getSteps(runId);
  const reviewedIndex = steps.findIndex((s) => s.status === "review_pending");
  if (reviewedIndex === -1) return;

  // The reviewed step is already marked completed by addReview
  await executePipeline(runId, reviewedIndex + 1);
}

async function callAgent(
  prompt: string,
  run: PipelineRun
): Promise<string> {
  const db = getDb();
  const apiKeyRow = db
    .prepare("SELECT value FROM config WHERE key = 'anthropic_api_key'")
    .get() as { value: string } | undefined;

  if (!apiKeyRow?.value) {
    throw new Error(
      "Anthropic API key not configured. Go to Settings to add it."
    );
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: apiKeyRow.value });

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

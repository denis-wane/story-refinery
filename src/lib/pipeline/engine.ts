import { v4 as uuid } from "uuid";
import {
  getRun as storeGetRun,
  saveRun,
  updateRun,
  listRuns as storeListRuns,
  getSteps as storeGetSteps,
  saveSteps,
  updateStep,
  getReviewsForStep,
  addReview as storeAddReview,
} from "@/lib/store";
import { GENERATE_STEPS, REFINE_STEPS } from "./steps";
import { writeStepOutput, writeRunSummary } from "@/lib/files";
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
  const id = uuid();
  const now = new Date().toISOString();

  const run: PipelineRun = {
    id,
    mode,
    status: "pending",
    input,
    refine_source: refineSource,
    refine_path: refinePath,
    created_at: now,
    updated_at: now,
  };
  saveRun(run);

  const stepDefs: StepDefinition[] =
    mode === "generate" ? GENERATE_STEPS : REFINE_STEPS;

  const steps: PipelineStep[] = stepDefs.map((def, i) => ({
    id: uuid(),
    run_id: id,
    name: def.name,
    agent: def.agent,
    order_index: i,
    status: "pending",
    input: null,
    output: null,
    error: null,
    review_gate: def.review_gate,
    started_at: null,
    completed_at: null,
  }));
  saveSteps(id, steps);

  return getRun(id)!;
}

export function getRun(id: string): PipelineRun | null {
  return storeGetRun(id);
}

export function listRuns(): PipelineRun[] {
  return storeListRuns();
}

export function getSteps(runId: string): PipelineStep[] {
  return storeGetSteps(runId);
}

export function getStep(stepId: string): PipelineStep | null {
  // We need to find the step across runs — check all runs
  // In practice this is only called from contexts where we have the runId nearby,
  // but for backward compat we scan.
  const runs = storeListRuns();
  for (const run of runs) {
    const steps = storeGetSteps(run.id);
    const step = steps.find((s) => s.id === stepId);
    if (step) return step;
  }
  return null;
}

export function getReviews(stepId: string): Review[] {
  // Find the run that contains this step
  const runs = storeListRuns();
  for (const run of runs) {
    const steps = storeGetSteps(run.id);
    if (steps.some((s) => s.id === stepId)) {
      return getReviewsForStep(run.id, stepId);
    }
  }
  return [];
}

export function addReview(
  stepId: string,
  runId: string,
  comments: string,
  approved: boolean
): Review {
  const id = uuid();
  const now = new Date().toISOString();

  const review: Review = {
    id,
    step_id: stepId,
    run_id: runId,
    comments,
    approved,
    created_at: now,
  };
  storeAddReview(runId, review);

  if (approved) {
    updateStep(runId, stepId, { status: "completed" });
    updateRun(runId, { status: "running" });
    emit(runId, "review_approved", stepId, { approved: true });
  }

  return review;
}

export function updateStepStatus(
  runId: string,
  stepId: string,
  status: string,
  output?: string,
  error?: string
) {
  const now = new Date().toISOString();
  if (status === "running") {
    updateStep(runId, stepId, { status: "running", started_at: now });
  } else if (status === "completed" || status === "failed") {
    updateStep(runId, stepId, {
      status: status as "completed" | "failed",
      output: output ?? null,
      error: error ?? null,
      completed_at: now,
    });
  } else {
    updateStep(runId, stepId, { status: status as PipelineStep["status"] });
  }
}

export function updateRunStatus(runId: string, status: string) {
  updateRun(runId, { status: status as PipelineRun["status"] });
}

// Execute pipeline from a given step index
export async function executePipeline(
  runId: string,
  fromStepIndex = 0
): Promise<void> {
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

    updateStepStatus(runId, step.id, "running");
    emit(runId, "step_started", step.id, { name: def.name, index: i });

    try {
      // Build prompt: agent definition + task instructions + input
      const { buildAgentPrompt } = await import("./agents");
      const taskInstructions = def.prompt_template
        .replace("{{input}}", previousOutput)
        .replace("{{context}}", "")
        .replace("{{original}}", run.input);

      const prompt = buildAgentPrompt(
        def.agent,
        taskInstructions,
        previousOutput
      );

      // Store input for this step
      updateStep(runId, step.id, { input: previousOutput });

      // Call the configured AI provider
      const output = await callAgent(prompt, run);

      updateStepStatus(runId, step.id, "completed", output);
      previousOutput = output;

      // Write step output to filesystem
      try {
        writeStepOutput(runId, def.name, def.agent, output, run.mode, i);
      } catch {
        // File output is best-effort — don't fail the pipeline
      }

      emit(runId, "step_completed", step.id, {
        name: def.name,
        output_length: output.length,
      });

      // Check for review gate
      if (def.review_gate) {
        updateStepStatus(runId, step.id, "review_pending");
        updateRunStatus(runId, "paused");
        emit(runId, "review_required", step.id, { name: def.name });
        return; // Pause execution until review is submitted
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      updateStepStatus(runId, step.id, "failed", undefined, message);
      updateRunStatus(runId, "failed");
      emit(runId, "step_failed", step.id, { name: def.name, error: message });
      return;
    }
  }

  updateRunStatus(runId, "completed");

  // Write run summary to filesystem
  try {
    const finalSteps = getSteps(runId);
    writeRunSummary(runId, run.mode, run.input, finalSteps);
  } catch {
    // File output is best-effort
  }

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
  _run: PipelineRun
): Promise<string> {
  const { callProvider } = await import("@/lib/providers");
  return callProvider(prompt);
}

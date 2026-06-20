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
    revision_count: 0,
    max_revisions: 3,
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

  // During a revision, the target step may have pre-populated input
  // containing reviewer feedback. Use it if available.
  if (fromStepIndex > 0 && run.revision_count > 0) {
    const targetStep = steps[fromStepIndex];
    if (targetStep.input) {
      previousOutput = targetStep.input;
    }
  }

  for (let i = fromStepIndex; i < steps.length; i++) {
    const step = steps[i];
    const def = stepDefs[i];

    updateStepStatus(runId, step.id, "running");
    emit(runId, "step_started", step.id, { name: def.name, index: i });

    try {
      // Build prompt: agent definition + task instructions + input
      const { buildAgentPrompt } = await import("./agents");

      // For the test-summarizer, provide AC output as context for cross-referencing
      let stepContext = "";
      if (def.agent === "test-summarizer") {
        const acStep = steps.find((s) => {
          const acDef = stepDefs[steps.indexOf(s)];
          return acDef && acDef.agent === "ac-writer";
        });
        if (acStep?.output) stepContext = acStep.output;
      }

      // Store input for this step
      updateStep(runId, step.id, { input: previousOutput });

      let output: string;

      // AC Writer: process one story at a time to avoid timeout issues
      // with large batches. Split the input into individual stories,
      // call the agent for each, and concatenate the results.
      if (def.agent === "ac-writer") {
        output = await executeAcWriterChunked(
          def,
          previousOutput,
          stepContext,
          run,
          step.id,
          runId
        );
      } else {
        const taskInstructions = def.prompt_template
          .replace("{{input}}", previousOutput)
          .replace("{{context}}", stepContext)
          .replace("{{original}}", run.input);

        const prompt = buildAgentPrompt(
          def.agent,
          taskInstructions,
          previousOutput
        );

        // Call the configured AI provider
        output = await callAgent(prompt, run);
      }

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

      // Quality Review revision loop: if the reviewer scores < 80,
      // automatically route feedback back to the relevant agent(s)
      // and re-run from that point (up to max_revisions times).
      if (def.agent === "story-reviewer") {
        const currentRun = getRun(runId)!;
        const score = parseReviewScore(output);
        const verdict = parseReviewVerdict(output);

        if (
          score !== null &&
          score < 80 &&
          verdict !== "PASS" &&
          currentRun.revision_count < currentRun.max_revisions
        ) {
          const newCount = currentRun.revision_count + 1;
          updateRun(runId, { revision_count: newCount });

          emit(runId, "revision_started", step.id, {
            score,
            verdict,
            revision_number: newCount,
            max_revisions: currentRun.max_revisions,
          });

          // Find which step to loop back to based on reviewer feedback
          const targetIndex = findRevisionTarget(output, stepDefs);

          // Save current outputs before resetting, so we can show diffs
          const currentSteps = getSteps(runId);
          for (let j = targetIndex; j < i; j++) {
            const s = currentSteps[j];
            if (s.output) {
              const prevOutputs = s.previous_outputs || [];
              prevOutputs.push({
                revision: currentRun.revision_count - 1,
                output: s.output,
                completed_at: s.completed_at || new Date().toISOString(),
              });
              updateStep(runId, s.id, { previous_outputs: prevOutputs });
            }
          }

          // Reset steps from targetIndex to current (exclusive) to pending
          for (let j = targetIndex; j < i; j++) {
            updateStep(runId, currentSteps[j].id, {
              status: "pending",
              output: null,
              error: null,
              started_at: null,
              completed_at: null,
            });
          }

          // Inject the reviewer feedback into the input for the target step
          // so the agent knows what to fix
          const revisionInput = [
            previousOutput,
            "",
            "## Reviewer Feedback (Revision " + newCount + "/" + currentRun.max_revisions + ")",
            "The Quality Reviewer scored this package " + score + "/100 (" + verdict + "). Address the following feedback:",
            "",
            output,
          ].join("\n");

          // Update the target step's input with revision context
          updateStep(runId, currentSteps[targetIndex].id, {
            input: revisionInput,
          });

          // Re-run the pipeline from the target step
          await executePipeline(runId, targetIndex);
          return;
        }

        // If score >= 80 or verdict is PASS, or we've hit max revisions, fall through
        if (
          score !== null &&
          score < 80 &&
          currentRun.revision_count >= currentRun.max_revisions
        ) {
          emit(runId, "revision_limit_reached", step.id, {
            score,
            revision_count: currentRun.revision_count,
            max_revisions: currentRun.max_revisions,
          });
          // Fall through to review gate (human review)
        }
      }

      // Check for review gate
      if (def.review_gate) {
        updateStepStatus(runId, step.id, "review_pending");
        updateRunStatus(runId, "paused");
        emit(runId, "review_required", step.id, { name: def.name });
        return; // Pause execution until review is submitted
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // The provider layer handles retries for rate-limit/transient errors.
      // If we still get here, the error is non-retryable or retries were exhausted.
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

/**
 * Parse the reviewer's score from the Quality Review output.
 * Looks for patterns like "Score: 72/100" or "TOTAL | **72** | **100**"
 * Returns the numeric score, or null if unparseable.
 */
function parseReviewScore(reviewOutput: string): number | null {
  // Try "Score: X/100" pattern
  const scoreMatch = reviewOutput.match(/Score:\s*(\d+)\s*\/\s*100/i);
  if (scoreMatch) return parseInt(scoreMatch[1], 10);

  // Try table total row: "| **TOTAL** | **100** | **X/100** |"
  const totalMatch = reviewOutput.match(
    /TOTAL\D+(\d+)\D+\/\s*100/i
  );
  if (totalMatch) return parseInt(totalMatch[1], 10);

  return null;
}

/**
 * Parse the reviewer's verdict from the Quality Review output.
 * Returns "PASS", "NEEDS-REVISION", or "BLOCK".
 */
function parseReviewVerdict(reviewOutput: string): string | null {
  const verdictMatch = reviewOutput.match(
    /\b(PASS|NEEDS-REVISION|BLOCK)\b/
  );
  return verdictMatch ? verdictMatch[1] : null;
}

/**
 * Determine which step index to loop back to based on reviewer feedback.
 * The reviewer includes "Feedback for revision" sections addressed to specific agents.
 * We find the earliest agent mentioned and route back to that step.
 */
function findRevisionTarget(
  reviewOutput: string,
  stepDefs: StepDefinition[]
): number {
  const lowerOutput = reviewOutput.toLowerCase();

  // Map agent feedback mentions to their step indices
  const agentMentions: { agent: string; index: number; position: number }[] = [];

  for (let i = 0; i < stepDefs.length; i++) {
    const def = stepDefs[i];
    // Check for "To Story Analyst:", "To AC Writer:", etc.
    const mentionPatterns = [
      `to ${def.agent.replace(/-/g, " ")}`,
      `to ${def.name.toLowerCase()}`,
      `feedback for ${def.agent.replace(/-/g, " ")}`,
    ];

    for (const pattern of mentionPatterns) {
      const pos = lowerOutput.indexOf(pattern);
      if (pos !== -1) {
        agentMentions.push({ agent: def.agent, index: i, position: pos });
        break;
      }
    }
  }

  if (agentMentions.length > 0) {
    // Return the earliest step that needs revision
    agentMentions.sort((a, b) => a.index - b.index);
    return agentMentions[0].index;
  }

  // Default: go back to the step before Quality Review (the last content-producing step)
  const reviewIndex = stepDefs.findIndex((d) => d.agent === "story-reviewer");
  return Math.max(0, reviewIndex - 2);
}

/**
 * Split decomposed stories input into individual stories.
 * Looks for story headers like "### Story N:" or "## Story N:" or "### STORY-SLUG"
 * and splits the input so each chunk contains exactly one story plus any
 * preceding feature/section headers it belongs to.
 */
function splitStoriesFromInput(input: string): string[] {
  const lines = input.split("\n");
  const storyBoundaries: number[] = [];

  // Find lines that start a new story (### headers within ## feature sections)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match story headers: "### Story", "### SLUG-NNN", or numbered story headers
    if (/^###\s+(?:Story\b|[A-Z]+-\d+)/i.test(line)) {
      storyBoundaries.push(i);
    }
  }

  if (storyBoundaries.length <= 1) {
    // 0 or 1 stories found — return the whole input as a single chunk
    return [input];
  }

  // Extract the preamble (everything before the first story header)
  // This includes feature headers, context, etc.
  const preamble = lines.slice(0, storyBoundaries[0]).join("\n").trim();

  // Also capture any ## feature header that precedes each story
  const stories: string[] = [];
  for (let i = 0; i < storyBoundaries.length; i++) {
    const start = storyBoundaries[i];
    const end =
      i < storyBoundaries.length - 1
        ? storyBoundaries[i + 1]
        : lines.length;

    // Look backwards from the story header to find its parent ## feature header
    let featureHeader = "";
    for (let j = start - 1; j >= 0; j--) {
      if (/^##\s+(?!#)/.test(lines[j])) {
        featureHeader = lines[j];
        break;
      }
    }

    const storyContent = lines.slice(start, end).join("\n").trim();
    const parts = [preamble];
    if (featureHeader) parts.push(featureHeader);
    parts.push(storyContent);
    stories.push(parts.join("\n\n"));
  }

  return stories;
}

/**
 * Execute the AC Writer one story at a time.
 * Splits the stories input, calls the AC writer for each individual story,
 * emits progress events, and concatenates the results.
 */
async function executeAcWriterChunked(
  def: StepDefinition,
  storiesInput: string,
  stepContext: string,
  run: PipelineRun,
  stepId: string,
  runId: string
): Promise<string> {
  const { buildAgentPrompt } = await import("./agents");
  const stories = splitStoriesFromInput(storiesInput);

  // If only one story (or couldn't split), fall back to normal execution
  if (stories.length <= 1) {
    const taskInstructions = def.prompt_template
      .replace("{{input}}", storiesInput)
      .replace("{{context}}", stepContext)
      .replace("{{original}}", run.input);
    const prompt = buildAgentPrompt(def.agent, taskInstructions, storiesInput);
    return callAgent(prompt, run);
  }

  const outputs: string[] = [];

  for (let i = 0; i < stories.length; i++) {
    emit(runId, "step_progress", stepId, {
      message: `Processing story ${i + 1} of ${stories.length}`,
      current: i + 1,
      total: stories.length,
    });

    const taskInstructions = def.prompt_template
      .replace("{{input}}", stories[i])
      .replace("{{context}}", stepContext)
      .replace("{{original}}", run.input);

    const prompt = buildAgentPrompt(def.agent, taskInstructions, stories[i]);
    const output = await callAgent(prompt, run);
    outputs.push(output);
  }

  return outputs.join("\n\n---\n\n");
}

async function callAgent(
  prompt: string,
  _run: PipelineRun
): Promise<string> {
  const { callProvider } = await import("@/lib/providers");
  return callProvider(prompt);
}

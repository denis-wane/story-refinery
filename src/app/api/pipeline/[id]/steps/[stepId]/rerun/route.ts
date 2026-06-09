import { NextRequest, NextResponse } from "next/server";
import { getRun, getSteps, executePipeline } from "@/lib/pipeline/engine";
import { updateStep, updateRun } from "@/lib/store";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { id: runId, stepId } = await params;
  const run = getRun(runId);

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const steps = getSteps(runId);
  const stepIndex = steps.findIndex((s) => s.id === stepId);

  if (stepIndex === -1) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

  // Reset target step and all subsequent steps
  for (let i = stepIndex; i < steps.length; i++) {
    updateStep(runId, steps[i].id, {
      status: "pending",
      output: null,
      error: null,
      started_at: null,
      completed_at: null,
    });
  }

  // Update run status
  updateRun(runId, { status: "running" });

  // Fire and forget - execute pipeline from the target step
  executePipeline(runId, stepIndex).catch((err) => {
    console.error(`Re-run failed for run ${runId} from step ${stepIndex}:`, err);
  });

  // Return updated run data
  const updatedRun = getRun(runId);
  const updatedSteps = getSteps(runId);

  return NextResponse.json({ run: updatedRun, steps: updatedSteps });
}

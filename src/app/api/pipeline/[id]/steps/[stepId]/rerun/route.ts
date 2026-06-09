import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRun, getSteps, executePipeline } from "@/lib/pipeline/engine";

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

  const db = getDb();

  // Reset target step and all subsequent steps
  for (let i = stepIndex; i < steps.length; i++) {
    db.prepare(
      "UPDATE pipeline_steps SET status = 'pending', output = NULL, error = NULL, started_at = NULL, completed_at = NULL WHERE id = ?"
    ).run(steps[i].id);
  }

  // Update run status
  db.prepare(
    "UPDATE pipeline_runs SET status = 'running', updated_at = datetime('now') WHERE id = ?"
  ).run(runId);

  // Fire and forget - execute pipeline from the target step
  executePipeline(runId, stepIndex).catch((err) => {
    console.error(`Re-run failed for run ${runId} from step ${stepIndex}:`, err);
  });

  // Return updated run data
  const updatedRun = getRun(runId);
  const updatedSteps = getSteps(runId);

  return NextResponse.json({ run: updatedRun, steps: updatedSteps });
}

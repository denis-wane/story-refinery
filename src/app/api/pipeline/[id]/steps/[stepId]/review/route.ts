import { NextRequest, NextResponse } from "next/server";
import { addReview, resumeAfterReview } from "@/lib/pipeline/engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { id: runId, stepId } = await params;
  const { comments, approved } = await request.json();

  if (!comments) {
    return NextResponse.json({ error: "comments are required" }, { status: 400 });
  }

  const review = addReview(stepId, runId, comments, !!approved);

  // If approved, resume the pipeline
  if (approved) {
    resumeAfterReview(runId).catch((err) => {
      console.error(`Resume after review failed for run ${runId}:`, err);
    });
  }

  return NextResponse.json(review, { status: 201 });
}

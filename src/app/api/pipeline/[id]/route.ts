import { NextRequest, NextResponse } from "next/server";
import { getRun, getSteps, getReviews } from "@/lib/pipeline/engine";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const run = getRun(id);

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const steps = getSteps(id);
  const reviews: Record<string, ReturnType<typeof getReviews>> = {};
  for (const step of steps) {
    const stepReviews = getReviews(step.id);
    if (stepReviews.length > 0) {
      reviews[step.id] = stepReviews;
    }
  }

  return NextResponse.json({ run, steps, reviews });
}

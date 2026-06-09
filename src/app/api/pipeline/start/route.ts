import { NextRequest, NextResponse } from "next/server";
import { createRun, executePipeline } from "@/lib/pipeline/engine";
import type { PipelineMode, RefineSource } from "@/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mode, input, refine_source, refine_path } = body as {
    mode: PipelineMode;
    input: string;
    refine_source?: RefineSource;
    refine_path?: string;
  };

  if (!mode || !input) {
    return NextResponse.json({ error: "mode and input are required" }, { status: 400 });
  }

  if (mode !== "generate" && mode !== "refine") {
    return NextResponse.json({ error: "mode must be 'generate' or 'refine'" }, { status: 400 });
  }

  const run = createRun(mode, input, refine_source, refine_path);

  // Start pipeline execution in background (don't await)
  executePipeline(run.id).catch((err) => {
    console.error(`Pipeline ${run.id} failed:`, err);
  });

  return NextResponse.json(run, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getRun } from "@/lib/pipeline/engine";
import { listRunOutputFiles } from "@/lib/files";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const run = getRun(id);

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const files = listRunOutputFiles(id);

  if (files === null) {
    return NextResponse.json(
      { error: "No output directory configured or no files found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ files });
}

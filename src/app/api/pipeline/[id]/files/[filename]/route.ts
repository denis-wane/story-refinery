import { NextRequest, NextResponse } from "next/server";
import { getRun } from "@/lib/pipeline/engine";
import { readOutputFile } from "@/lib/files";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params;
  const run = getRun(id);

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const content = readOutputFile(id, filename);

  if (content === null) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json({ filename, content });
}

import { NextResponse } from "next/server";
import { listRuns } from "@/lib/pipeline/engine";

export async function GET() {
  const runs = listRuns();
  return NextResponse.json(runs);
}

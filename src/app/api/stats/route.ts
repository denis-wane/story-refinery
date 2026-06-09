import { NextResponse } from "next/server";
import { listRuns } from "@/lib/store";

export async function GET() {
  const runs = listRuns();

  const total_runs = runs.length;
  const generate_runs = runs.filter((r) => r.mode === "generate").length;
  const refine_runs = runs.filter((r) => r.mode === "refine").length;
  const completed_runs = runs.filter((r) => r.status === "completed").length;
  const active_runs = runs.filter((r) =>
    ["running", "paused", "pending"].includes(r.status)
  ).length;

  const recent_runs = runs.slice(0, 5).map((r) => ({
    id: r.id,
    mode: r.mode,
    status: r.status,
    input: r.input,
    created_at: r.created_at,
  }));

  return NextResponse.json({
    total_runs,
    generate_runs,
    refine_runs,
    completed_runs,
    active_runs,
    recent_runs,
  });
}

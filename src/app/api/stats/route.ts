import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();

  const total_runs = (db.prepare("SELECT COUNT(*) as c FROM pipeline_runs").get() as { c: number }).c;
  const generate_runs = (db.prepare("SELECT COUNT(*) as c FROM pipeline_runs WHERE mode = 'generate'").get() as { c: number }).c;
  const refine_runs = (db.prepare("SELECT COUNT(*) as c FROM pipeline_runs WHERE mode = 'refine'").get() as { c: number }).c;
  const completed_runs = (db.prepare("SELECT COUNT(*) as c FROM pipeline_runs WHERE status = 'completed'").get() as { c: number }).c;
  const active_runs = (db.prepare("SELECT COUNT(*) as c FROM pipeline_runs WHERE status IN ('running', 'paused', 'pending')").get() as { c: number }).c;

  const recent_runs = db
    .prepare("SELECT id, mode, status, input, created_at FROM pipeline_runs ORDER BY created_at DESC LIMIT 5")
    .all();

  return NextResponse.json({
    total_runs,
    generate_runs,
    refine_runs,
    completed_runs,
    active_runs,
    recent_runs,
  });
}

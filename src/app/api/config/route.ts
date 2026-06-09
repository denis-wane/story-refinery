import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const CONFIG_KEYS = [
  "jira_url",
  "jira_email",
  "jira_api_key",
  "jira_project_key",
  "output_directory",
  "anthropic_api_key",
];

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare("SELECT key, value FROM config WHERE key IN (" + CONFIG_KEYS.map(() => "?").join(",") + ")")
    .all(...CONFIG_KEYS) as { key: string; value: string }[];

  const config: Record<string, string> = {};
  for (const key of CONFIG_KEYS) {
    const row = rows.find((r) => r.key === key);
    config[key] = row?.value ?? "";
  }

  // Mask sensitive values
  if (config.jira_api_key) config.jira_api_key = "***" + config.jira_api_key.slice(-4);
  if (config.anthropic_api_key)
    config.anthropic_api_key = "***" + config.anthropic_api_key.slice(-4);

  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const db = getDb();

  const upsert = db.prepare(
    `INSERT INTO config (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  );

  const tx = db.transaction(() => {
    for (const key of CONFIG_KEYS) {
      if (key in body && body[key] !== undefined) {
        // Don't overwrite with masked values
        if (typeof body[key] === "string" && body[key].startsWith("***")) continue;
        upsert.run(key, body[key]);
      }
    }
  });

  tx();

  return NextResponse.json({ ok: true });
}

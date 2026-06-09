import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const CONFIG_KEYS = [
  "provider",
  "anthropic_api_key",
  "model",
  "aws_region",
  "aws_access_key_id",
  "aws_secret_access_key",
  "bedrock_model_id",
  "jira_url",
  "jira_email",
  "jira_api_key",
  "jira_project_key",
  "output_directory",
];

const SENSITIVE_KEYS = new Set([
  "anthropic_api_key",
  "jira_api_key",
  "aws_access_key_id",
  "aws_secret_access_key",
]);

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
  for (const key of SENSITIVE_KEYS) {
    if (config[key]) config[key] = "***" + config[key].slice(-4);
  }

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

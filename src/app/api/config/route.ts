import { NextRequest, NextResponse } from "next/server";
import { getConfig, setConfig } from "@/lib/store";

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
  const stored = getConfig() as Record<string, string>;
  const config: Record<string, string> = {};

  for (const key of CONFIG_KEYS) {
    config[key] = stored[key] ?? "";
  }

  // Mask sensitive values
  for (const key of SENSITIVE_KEYS) {
    if (config[key]) config[key] = "***" + config[key].slice(-4);
  }

  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const updates: Record<string, string> = {};

  for (const key of CONFIG_KEYS) {
    if (key in body && body[key] !== undefined) {
      // Don't overwrite with masked values
      if (typeof body[key] === "string" && body[key].startsWith("***")) continue;
      updates[key] = body[key];
    }
  }

  setConfig(updates);
  return NextResponse.json({ ok: true });
}

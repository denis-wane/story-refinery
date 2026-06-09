import { getDb } from "@/lib/db";

export type ProviderType = "subscription" | "api_key" | "bedrock";

export interface ProviderConfig {
  provider: ProviderType;
  // API key provider
  anthropic_api_key?: string;
  // Bedrock provider
  aws_region?: string;
  aws_access_key_id?: string;
  aws_secret_access_key?: string;
  bedrock_model_id?: string;
  // Common
  model?: string;
}

export function getProviderConfig(): ProviderConfig {
  const db = getDb();
  const get = (key: string): string => {
    const row = db.prepare("SELECT value FROM config WHERE key = ?").get(key) as
      | { value: string }
      | undefined;
    return row?.value ?? "";
  };

  return {
    provider: (get("provider") || "subscription") as ProviderType,
    anthropic_api_key: get("anthropic_api_key"),
    aws_region: get("aws_region"),
    aws_access_key_id: get("aws_access_key_id"),
    aws_secret_access_key: get("aws_secret_access_key"),
    bedrock_model_id: get("bedrock_model_id") || "anthropic.claude-sonnet-4-20250514-v1:0",
    model: get("model") || "claude-sonnet-4-20250514",
  };
}

/**
 * Send a prompt to Claude and return the text response.
 * Routes through the configured provider (subscription CLI, API key, or Bedrock).
 */
export async function callProvider(prompt: string): Promise<string> {
  const config = getProviderConfig();

  switch (config.provider) {
    case "subscription":
      return callViaSubscription(prompt, config);
    case "api_key":
      return callViaApiKey(prompt, config);
    case "bedrock":
      return callViaBedrock(prompt, config);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

/**
 * Subscription auth — invokes `claude` CLI in headless mode.
 * Requires Claude Code to be installed and the user to be logged in.
 */
async function callViaSubscription(
  prompt: string,
  config: ProviderConfig
): Promise<string> {
  const { execFile } = await import("child_process");
  const { promisify } = await import("util");
  const execFileAsync = promisify(execFile);

  try {
    const { stdout } = await execFileAsync(
      "claude",
      [
        "-p", prompt,
        "--output-format", "text",
        "--model", config.model || "claude-sonnet-4-20250514",
        "--max-turns", "1",
      ],
      {
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, CLAUDE_CODE_ENTRYPOINT: "story-refinery" },
      }
    );

    return stdout.trim();
  } catch (err: unknown) {
    if (err && typeof err === "object" && "stderr" in err) {
      const stderr = (err as { stderr: string }).stderr;
      if (stderr.includes("not found") || stderr.includes("command not found")) {
        throw new Error(
          "Claude CLI not found. Install Claude Code (npm install -g @anthropic-ai/claude-code) and log in with `claude login`."
        );
      }
      throw new Error(`Claude CLI error: ${stderr.slice(0, 500)}`);
    }
    throw err;
  }
}

/**
 * API key auth — calls Anthropic API directly via the SDK.
 */
async function callViaApiKey(
  prompt: string,
  config: ProviderConfig
): Promise<string> {
  if (!config.anthropic_api_key) {
    throw new Error(
      "Anthropic API key not configured. Go to Settings to add it."
    );
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: config.anthropic_api_key });

  const message = await client.messages.create({
    model: config.model || "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

/**
 * AWS Bedrock — calls Claude via the Anthropic SDK's Bedrock client.
 */
async function callViaBedrock(
  prompt: string,
  config: ProviderConfig
): Promise<string> {
  if (!config.aws_region) {
    throw new Error("AWS region not configured. Go to Settings to add it.");
  }

  const { AnthropicBedrock } = await import("@anthropic-ai/bedrock-sdk");

  const clientOpts: Record<string, string> = {
    awsRegion: config.aws_region,
  };
  // Explicit credentials override environment/IAM role
  if (config.aws_access_key_id && config.aws_secret_access_key) {
    clientOpts.awsAccessKey = config.aws_access_key_id;
    clientOpts.awsSecretKey = config.aws_secret_access_key;
  }

  const client = new AnthropicBedrock(clientOpts);

  const message = await client.messages.create({
    model: config.bedrock_model_id || "anthropic.claude-sonnet-4-20250514-v1:0",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

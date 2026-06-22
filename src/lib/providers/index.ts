import { getConfigValue } from "@/lib/store";

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

// Retry configuration for rate-limit and transient error handling
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2_000; // 2 seconds
const MAX_DELAY_MS = 120_000; // 2 minutes

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  // Anthropic SDK rate limit / overloaded errors
  if (msg.includes("rate_limit") || msg.includes("rate limit")) return true;
  if (msg.includes("overloaded") || msg.includes("529")) return true;
  if (msg.includes("too many requests") || msg.includes("429")) return true;
  // Transient server errors
  if (msg.includes("500") || msg.includes("502") || msg.includes("503")) return true;
  if (msg.includes("internal server error") || msg.includes("bad gateway")) return true;
  if (msg.includes("service unavailable")) return true;
  // Anthropic SDK typed errors
  if ("status" in err) {
    const status = (err as { status: number }).status;
    if (status === 429 || status === 529 || (status >= 500 && status < 600)) return true;
  }
  // CLI timeout / transient failures
  if (msg.includes("timed out") || msg.includes("timeout")) return true;
  return false;
}

function getRetryDelay(attempt: number, err?: unknown): number {
  // Check for Retry-After header hint from Anthropic SDK errors
  if (err && typeof err === "object" && "headers" in err) {
    const headers = (err as { headers?: Record<string, string> }).headers;
    const retryAfter = headers?.["retry-after"];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds) && seconds > 0) {
        return Math.min(seconds * 1_000, MAX_DELAY_MS);
      }
    }
  }
  // Exponential backoff with jitter: base * 2^attempt + random jitter
  const exponential = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * BASE_DELAY_MS;
  return Math.min(exponential + jitter, MAX_DELAY_MS);
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        const delay = getRetryDelay(attempt, err);
        console.warn(
          `[provider] ${label}: retryable error (attempt ${attempt + 1}/${MAX_RETRIES}), waiting ${Math.round(delay / 1000)}s — ${err instanceof Error ? err.message.slice(0, 120) : err}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export function getProviderConfig(): ProviderConfig {
  const get = (key: string): string => getConfigValue(key) ?? "";

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
      return withRetry(() => callViaSubscription(prompt, config), "subscription");
    case "api_key":
      return withRetry(() => callViaApiKey(prompt, config), "api_key");
    case "bedrock":
      return withRetry(() => callViaBedrock(prompt, config), "bedrock");
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

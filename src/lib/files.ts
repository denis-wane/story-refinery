import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import type { PipelineMode, PipelineStep } from "@/types";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getOutputDirectory(): string | null {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM config WHERE key = ?")
    .get("output_directory") as { value: string } | undefined;
  return row?.value || null;
}

export function getRunOutputDir(runId: string): string | null {
  const outputDir = getOutputDirectory();
  if (!outputDir) return null;
  return path.join(outputDir, runId);
}

export function writeStepOutput(
  runId: string,
  stepName: string,
  agentSlug: string,
  output: string,
  mode: PipelineMode,
  stepIndex: number
): void {
  const runDir = getRunOutputDir(runId);
  if (!runDir) return;

  fs.mkdirSync(runDir, { recursive: true });

  const paddedIndex = String(stepIndex).padStart(2, "0");
  const filename = `${paddedIndex}-${slugify(stepName)}.md`;
  const filePath = path.join(runDir, filename);

  const header = `# ${stepName}\n\n` +
    `> Agent: ${agentSlug} | Mode: ${mode} | Step ${stepIndex}\n\n---\n\n`;

  fs.writeFileSync(filePath, header + output, "utf-8");
}

export function writeRunSummary(
  runId: string,
  mode: PipelineMode,
  input: string,
  steps: Array<Pick<PipelineStep, "name" | "agent" | "order_index" | "status" | "completed_at">>
): void {
  const runDir = getRunOutputDir(runId);
  if (!runDir) return;

  fs.mkdirSync(runDir, { recursive: true });

  const lines = [
    `# Pipeline Run Summary`,
    ``,
    `- **Run ID:** ${runId}`,
    `- **Mode:** ${mode}`,
    `- **Completed:** ${new Date().toISOString()}`,
    ``,
    `## Input`,
    ``,
    input.length > 500 ? input.slice(0, 500) + "..." : input,
    ``,
    `## Steps`,
    ``,
    `| # | Step | Agent | Status | Completed |`,
    `|---|------|-------|--------|-----------|`,
  ];

  for (const step of steps) {
    const idx = String(step.order_index).padStart(2, "0");
    lines.push(
      `| ${idx} | ${step.name} | ${step.agent} | ${step.status} | ${step.completed_at ?? "-"} |`
    );
  }

  lines.push("");
  fs.writeFileSync(path.join(runDir, "summary.md"), lines.join("\n"), "utf-8");
}

export function listRunOutputFiles(
  runId: string
): Array<{ filename: string; size: number; modified: string }> | null {
  const runDir = getRunOutputDir(runId);
  if (!runDir || !fs.existsSync(runDir)) return null;

  const entries = fs.readdirSync(runDir);
  return entries
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((filename) => {
      const stat = fs.statSync(path.join(runDir, filename));
      return {
        filename,
        size: stat.size,
        modified: stat.mtime.toISOString(),
      };
    });
}

export function readOutputFile(
  runId: string,
  filename: string
): string | null {
  const runDir = getRunOutputDir(runId);
  if (!runDir) return null;

  // Prevent directory traversal
  const safe = path.basename(filename);
  const filePath = path.join(runDir, safe);

  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

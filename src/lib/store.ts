import fs from "fs";
import path from "path";
import type {
  PipelineRun,
  PipelineStep,
  Review,
  Config,
} from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "config.json");
const RUNS_DIR = path.join(DATA_DIR, "runs");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Atomic write: write to temp file, then rename
function writeJSON(filePath: string, data: unknown) {
  ensureDir(path.dirname(filePath));
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}

function readJSON<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

// --- Config ---

export function getConfig(): Partial<Config> {
  return readJSON<Partial<Config>>(CONFIG_PATH) ?? {};
}

export function getConfigValue(key: string): string | undefined {
  const config = getConfig();
  return (config as Record<string, string>)[key];
}

export function setConfig(updates: Record<string, string>) {
  const config = getConfig() as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    config[key] = value;
  }
  writeJSON(CONFIG_PATH, config);
}

// --- Pipeline Runs ---

function runDir(runId: string): string {
  return path.join(RUNS_DIR, runId);
}

function runPath(runId: string): string {
  return path.join(runDir(runId), "run.json");
}

function stepsPath(runId: string): string {
  return path.join(runDir(runId), "steps.json");
}

function reviewsPath(runId: string): string {
  return path.join(runDir(runId), "reviews.json");
}

export function saveRun(run: PipelineRun) {
  writeJSON(runPath(run.id), run);
}

export function getRun(id: string): PipelineRun | null {
  return readJSON<PipelineRun>(runPath(id));
}

export function listRuns(): PipelineRun[] {
  ensureDir(RUNS_DIR);
  const dirs = fs.readdirSync(RUNS_DIR).filter((d) => {
    const rp = path.join(RUNS_DIR, d, "run.json");
    return fs.existsSync(rp);
  });

  const runs: PipelineRun[] = [];
  for (const d of dirs) {
    const run = readJSON<PipelineRun>(path.join(RUNS_DIR, d, "run.json"));
    if (run) runs.push(run);
  }

  return runs.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function updateRun(id: string, updates: Partial<PipelineRun>) {
  const run = getRun(id);
  if (!run) return;
  Object.assign(run, updates, { updated_at: new Date().toISOString() });
  saveRun(run);
}

// --- Pipeline Steps ---

export function saveSteps(runId: string, steps: PipelineStep[]) {
  writeJSON(stepsPath(runId), steps);
}

export function getSteps(runId: string): PipelineStep[] {
  return readJSON<PipelineStep[]>(stepsPath(runId)) ?? [];
}

export function getStep(stepId: string, runId: string): PipelineStep | null {
  const steps = getSteps(runId);
  return steps.find((s) => s.id === stepId) ?? null;
}

export function updateStep(
  runId: string,
  stepId: string,
  updates: Partial<PipelineStep>
) {
  const steps = getSteps(runId);
  const idx = steps.findIndex((s) => s.id === stepId);
  if (idx === -1) return;
  Object.assign(steps[idx], updates);
  saveSteps(runId, steps);
}

// --- Reviews ---

export function getReviews(runId: string): Review[] {
  return readJSON<Review[]>(reviewsPath(runId)) ?? [];
}

export function getReviewsForStep(runId: string, stepId: string): Review[] {
  return getReviews(runId).filter((r) => r.step_id === stepId);
}

export function addReview(runId: string, review: Review) {
  const reviews = getReviews(runId);
  reviews.push(review);
  writeJSON(reviewsPath(runId), reviews);
}

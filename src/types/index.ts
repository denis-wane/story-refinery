export type PipelineMode = "generate" | "refine";

export type StepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "review_pending"
  | "skipped";

export type RunStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "failed";

export type RefineSource = "jira" | "local";

export type ProviderType = "subscription" | "api_key" | "bedrock";

export interface Config {
  provider: ProviderType;
  anthropic_api_key: string;
  model: string;
  aws_region: string;
  aws_access_key_id: string;
  aws_secret_access_key: string;
  bedrock_model_id: string;
  jira_url: string;
  jira_email: string;
  jira_api_key: string;
  jira_project_key: string;
  output_directory: string;
}

export interface PipelineRun {
  id: string;
  mode: PipelineMode;
  status: RunStatus;
  input: string;
  refine_source?: RefineSource;
  refine_path?: string;
  revision_count: number;
  max_revisions: number;
  created_at: string;
  updated_at: string;
}

export interface PipelineStep {
  id: string;
  run_id: string;
  name: string;
  agent: string;
  order_index: number;
  status: StepStatus;
  input: string | null;
  output: string | null;
  error: string | null;
  review_gate: boolean;
  started_at: string | null;
  completed_at: string | null;
}

export interface Review {
  id: string;
  step_id: string;
  run_id: string;
  comments: string;
  approved: boolean;
  created_at: string;
}

export interface StepDefinition {
  name: string;
  agent: string;
  description: string;
  review_gate: boolean;
  prompt_template: string;
}

export interface PipelineEvent {
  type: "step_started" | "step_progress" | "step_completed" | "step_failed" | "run_completed" | "review_required" | "revision_started" | "revision_limit_reached";
  run_id: string;
  step_id?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

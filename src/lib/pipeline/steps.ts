import type { StepDefinition } from "@/types";

/**
 * Step definitions for the Generate and Refine pipelines.
 *
 * Each step references an agent by slug (matching a file in agents/).
 * The prompt_template provides task-specific instructions that get combined
 * with the agent's full definition at runtime (see agents.ts).
 *
 * Placeholders:
 *   {{input}}    — output from the previous step (or user input for step 0)
 *   {{context}}  — project context if available
 *   {{original}} — original user input (useful for later steps that need it)
 */

export const GENERATE_STEPS: StepDefinition[] = [
  {
    name: "Analyze Input",
    agent: "story-analyst",
    description:
      "Parse the raw input, identify themes, extract potential features, and flag ambiguities.",
    review_gate: false,
    prompt_template: `Perform a Generate-mode analysis on the following input. Produce the "Output: Generate mode (Analysis)" format from your definition.

## Input
{{input}}

## Project Context
{{context}}`,
  },
  {
    name: "Clarify",
    agent: "clarifier",
    description:
      "Extract ambiguities from the analysis into prioritized clarifying questions for the stakeholder to answer.",
    review_gate: true,
    prompt_template: `Review the analysis below and produce your prioritized list of clarifying questions. Include default assumptions for each question so the pipeline can proceed even with partial answers.

## Analysis
{{input}}

## Original Input
{{original}}`,
  },
  {
    name: "Decompose Features",
    agent: "story-decomposer",
    description:
      "Break identified features into individual user stories with clear scope.",
    review_gate: true,
    prompt_template: `Given the analysis and stakeholder clarifications below, decompose all identified features into well-scoped user stories. Follow your output format exactly. Use the stakeholder's answers to resolve any ambiguities — do not leave questions open that have been answered.

## Analysis & Clarifications
{{input}}`,
  },
  {
    name: "Draft Acceptance Criteria",
    agent: "ac-writer",
    description:
      "Write detailed acceptance criteria for each story covering happy path, edge cases, error states, and NFRs.",
    review_gate: true,
    prompt_template: `Write complete acceptance criteria for each user story below. Follow your output format exactly — every story needs at minimum: one happy-path AC, one edge case, one error/boundary condition, and NFRs.

## Stories
{{input}}`,
  },
  {
    name: "Generate Test Specs",
    agent: "test-generator",
    description:
      "Produce BDD/Gherkin test specifications from the acceptance criteria.",
    review_gate: false,
    prompt_template: `Generate test specifications for the stories and acceptance criteria below. Follow your output format exactly — include coverage matrix, test cases in Gherkin, test data, and preconditions.

## Stories with Acceptance Criteria
{{input}}`,
  },
  {
    name: "Summarize Test Coverage",
    agent: "test-summarizer",
    description:
      "Produce a compact coverage digest from raw test specs for the reviewer. Extracts coverage matrices, scenario counts, gaps, and quality signals.",
    review_gate: false,
    prompt_template: `Produce a compact test coverage digest from the raw test specifications below. Follow your output format exactly. Count scenarios and steps precisely by scanning the actual content.

NOTE: Test specifications below are a coverage digest (not the raw Gherkin). Use the coverage matrices, gap analysis, and statistics to evaluate test coverage and quality.

## Acceptance Criteria (for cross-reference)
{{context}}

## Raw Test Specifications
{{input}}`,
  },
  {
    name: "Quality Review",
    agent: "story-reviewer",
    description:
      "Score the complete package against the quality rubric. Identify issues and suggest improvements.",
    review_gate: true,
    prompt_template: `Perform a quality review of the complete story package below. Score each story against your rubric (80+ to pass). Provide specific, actionable feedback.

NOTE: Test specifications below are a coverage digest (not the raw Gherkin). Use the coverage matrices, gap analysis, and statistics to evaluate test coverage and quality.

## Complete Package
{{input}}`,
  },
];

export const REFINE_STEPS: StepDefinition[] = [
  {
    name: "Import Stories",
    agent: "story-importer",
    description:
      "Pull stories from Jira or read from local filesystem. Normalize into standard format.",
    review_gate: false,
    prompt_template: `Normalize the following story source data into your standard import format. Preserve all content — do not filter or interpret.

## Source
{{input}}`,
  },
  {
    name: "Gap Analysis",
    agent: "story-analyst",
    description:
      "Identify missing context, inconsistencies, weak acceptance criteria, and gaps in the existing stories.",
    review_gate: true,
    prompt_template: `Perform a Refine-mode gap analysis on the following imported stories. Produce the "Output: Refine mode (Gap Analysis)" format from your definition.

## Stories
{{input}}`,
  },
  {
    name: "Rewrite Stories",
    agent: "story-rewriter",
    description:
      "Improve stories and acceptance criteria based on the gap analysis findings.",
    review_gate: true,
    prompt_template: `Rewrite the stories below based on the gap analysis. Address all HIGH and MEDIUM gaps. Follow your output format exactly.

## Original Stories
{{original}}

## Gap Analysis
{{input}}`,
  },
  {
    name: "Generate Test Specs",
    agent: "test-generator",
    description:
      "Produce or update test specifications for the refined stories.",
    review_gate: false,
    prompt_template: `Generate test specifications for the refined stories below. Follow your output format exactly.

## Refined Stories
{{input}}`,
  },
  {
    name: "Summarize Test Coverage",
    agent: "test-summarizer",
    description:
      "Produce a compact coverage digest from raw test specs for the reviewer.",
    review_gate: false,
    prompt_template: `Produce a compact test coverage digest from the raw test specifications below. Follow your output format exactly. Count scenarios and steps precisely by scanning the actual content.

## Raw Test Specifications
{{input}}`,
  },
  {
    name: "Quality Review",
    agent: "story-reviewer",
    description:
      "Score the refined package. Compare against original to show improvement.",
    review_gate: true,
    prompt_template: `Perform a quality review of the refined story package. Score each story against your rubric (80+ to pass). Compare against the original and highlight improvements.

NOTE: Test specifications below are a coverage digest (not the raw Gherkin). Use the coverage matrices, gap analysis, and statistics to evaluate test coverage and quality.

## Refined Package
{{input}}

## Original (for comparison)
{{original}}`,
  },
];

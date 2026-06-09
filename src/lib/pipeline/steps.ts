import type { StepDefinition } from "@/types";

export const GENERATE_STEPS: StepDefinition[] = [
  {
    name: "Analyze Input",
    agent: "story-analyst",
    description:
      "Parse the raw input, identify themes, extract potential features, and flag ambiguities.",
    review_gate: false,
    prompt_template: `You are a Story Analyst. Analyze the following input and produce a structured analysis:

1. Identify distinct features or functional areas
2. Extract key user roles/personas
3. Flag ambiguities or missing context
4. Suggest a feature decomposition

## Input
{{input}}

## Project Context
{{context}}

Respond with a structured markdown document.`,
  },
  {
    name: "Decompose Features",
    agent: "story-decomposer",
    description:
      "Break identified features into individual user stories with clear scope.",
    review_gate: true,
    prompt_template: `You are a Story Decomposer. Given the analysis below, break each feature into well-scoped user stories.

Each story must follow: "As a [role], I want [capability], so that [benefit]"

Stories should be thin vertical slices — end-to-end for a narrow use case.

## Analysis
{{input}}

Produce a markdown document with stories grouped by feature.`,
  },
  {
    name: "Draft Acceptance Criteria",
    agent: "ac-writer",
    description:
      "Write detailed acceptance criteria for each story covering happy path, edge cases, error states, and NFRs.",
    review_gate: true,
    prompt_template: `You are an Acceptance Criteria Writer. For each user story below, write complete acceptance criteria.

Each story must have:
- Happy path scenarios (Given/When/Then)
- At least one edge case
- At least one error/boundary condition
- Non-functional requirements where applicable

## Stories
{{input}}

Output each story with its acceptance criteria in structured markdown.`,
  },
  {
    name: "Generate Test Specs",
    agent: "test-generator",
    description:
      "Produce BDD/Gherkin test specifications from the acceptance criteria.",
    review_gate: false,
    prompt_template: `You are a Test Specification Generator. Given the stories and acceptance criteria below, produce test specifications.

Rules:
- Every AC maps to at least one test
- Every test maps back to at least one AC
- Include negative/boundary tests for every happy path
- Use Gherkin format (Given/When/Then)
- Specify test data and preconditions

## Stories with Acceptance Criteria
{{input}}

Output structured test specifications.`,
  },
  {
    name: "Quality Review",
    agent: "story-reviewer",
    description:
      "Score the complete package against the quality rubric. Identify issues and suggest improvements.",
    review_gate: true,
    prompt_template: `You are a Story Quality Reviewer. Evaluate the complete story package below.

Score each story (0-100) on:
- Story clarity (20pts): clear role, capability, benefit
- AC completeness (25pts): happy path, edge cases, error states, NFRs
- AC testability (20pts): every AC can be verified
- Test coverage (20pts): tests trace to AC, negative paths covered
- Architecture alignment (15pts): stories are implementable given context

## Complete Package
{{input}}

For each story: provide score, pass/fail (80+ passes), and specific actionable feedback.`,
  },
];

export const REFINE_STEPS: StepDefinition[] = [
  {
    name: "Import Stories",
    agent: "story-importer",
    description:
      "Pull stories from Jira or read from local filesystem. Normalize into standard format.",
    review_gate: false,
    prompt_template: `You are a Story Importer. Read the following stories and normalize them into the standard format.

For each story, extract:
- Title and description
- Existing acceptance criteria (if any)
- Dependencies and links
- Jira metadata (key, status, assignee) if from Jira

## Source
{{input}}

Output normalized stories in structured markdown.`,
  },
  {
    name: "Gap Analysis",
    agent: "story-analyst",
    description:
      "Identify missing context, inconsistencies, weak acceptance criteria, and gaps in the existing stories.",
    review_gate: true,
    prompt_template: `You are a Story Analyst performing gap analysis on existing stories.

For each story, identify:
1. Missing or vague acceptance criteria
2. Unstated assumptions
3. Missing dependencies
4. Inconsistencies between stories
5. Testability gaps

## Stories
{{input}}

Produce a gap analysis report with severity ratings (HIGH/MEDIUM/LOW).`,
  },
  {
    name: "Rewrite Stories",
    agent: "story-rewriter",
    description:
      "Improve stories and acceptance criteria based on the gap analysis findings.",
    review_gate: true,
    prompt_template: `You are a Story Rewriter. Given the original stories and gap analysis, produce improved versions.

Rules:
- Preserve the original intent — don't change scope
- Address all HIGH and MEDIUM gaps
- Improve AC to be specific and testable
- Add missing edge cases and error handling
- Flag assumptions explicitly

## Original Stories
{{original}}

## Gap Analysis
{{input}}

Output the complete rewritten stories.`,
  },
  {
    name: "Generate Test Specs",
    agent: "test-generator",
    description:
      "Produce or update test specifications for the refined stories.",
    review_gate: false,
    prompt_template: `You are a Test Specification Generator. Given the refined stories below, produce test specifications.

Rules:
- Every AC maps to at least one test
- Include negative/boundary tests
- Use Gherkin format
- Specify test data and preconditions

## Refined Stories
{{input}}

Output structured test specifications.`,
  },
  {
    name: "Quality Review",
    agent: "story-reviewer",
    description:
      "Score the refined package. Compare against original to show improvement.",
    review_gate: true,
    prompt_template: `You are a Story Quality Reviewer. Evaluate the refined story package.

Score each story (0-100) using the standard rubric. Also note improvement vs. the original.

## Refined Package
{{input}}

## Original (for comparison)
{{original}}

Provide scores, pass/fail, and specific feedback. Highlight what improved and what still needs work.`,
  },
];

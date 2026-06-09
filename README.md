# Story Refinery

AI-powered web application for generating and refining user stories with acceptance criteria. Runs a multi-step agent pipeline with human review gates at each stage.

## What it does

**Generate mode** — Describe a feature, product, or idea in plain text. The pipeline runs five agent steps to produce structured user stories with acceptance criteria and test specifications.

**Refine mode** — Import existing stories from Jira or local markdown files. The pipeline analyzes gaps, rewrites stories with improved AC, generates test specs, and scores quality.

Both modes use a visual step-by-step pipeline where you can review and provide feedback after any step before the pipeline continues.

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **One of the following AI providers:**
  - **Claude Subscription** (recommended) — Claude Pro, Team, or Enterprise subscription with [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed
  - **Anthropic API Key** — from [console.anthropic.com](https://console.anthropic.com)
  - **AWS Bedrock** — AWS account with Claude models enabled in Bedrock

### Optional

- **Jira Cloud account** — only needed for Refine mode with Jira source. Requires an API token from [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/denis-wane/story-refinery.git
cd story-refinery

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and go to **Settings** to configure your AI provider.

## Provider Setup

### Option A: Claude Subscription (simplest)

If you have a Claude Pro, Team, or Enterprise subscription:

```bash
# Install Claude Code CLI (if not already installed)
npm install -g @anthropic-ai/claude-code

# Log in to your subscription
claude login
```

In Story Refinery Settings, select **Claude Subscription** as the provider. That's it — no API key needed.

### Option B: Anthropic API Key

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. In Settings, select **Anthropic API Key** and paste your key

### Option C: AWS Bedrock

1. Enable Claude models in your AWS Bedrock console
2. In Settings, select **AWS Bedrock** and provide:
   - AWS Region (e.g., `us-east-1`)
   - AWS Access Key ID and Secret (or leave blank to use IAM role / environment credentials)
   - Bedrock Model ID (defaults to `anthropic.claude-sonnet-4-20250514-v1:0`)

## Jira Setup (Optional)

Only needed if you want to use Refine mode with Jira as a source.

1. Go to **Settings > Jira Connection**
2. Enter your Jira Cloud URL (e.g., `https://your-org.atlassian.net`)
3. Enter your email and [API token](https://id.atlassian.com/manage-profile/security/api-tokens)
4. Set your default project key
5. Click **Test Connection** to verify

Stories imported from Jira use the Jira issue key as the filename (e.g., `PROJ-123.md`).

## Usage

### Generate Stories

1. Go to **Generate**
2. Describe your feature, product, or idea in the text area
3. Click **Start Generation Pipeline**
4. The pipeline runs through 5 steps:
   - **Analyze Input** — identifies features, personas, ambiguities
   - **Decompose Features** — breaks into individual user stories *(review gate)*
   - **Draft AC** — writes acceptance criteria *(review gate)*
   - **Generate Test Specs** — produces BDD/Gherkin tests
   - **Quality Review** — scores against rubric *(review gate)*
5. At each review gate, review the output and either approve or request changes

### Refine Stories

1. Go to **Refine**
2. Choose a source: **Local Files** (directory path) or **Jira** (issue keys)
3. Click **Start Refinement Pipeline**
4. The pipeline runs through 5 steps:
   - **Import** — normalizes stories from source
   - **Gap Analysis** — identifies weaknesses *(review gate)*
   - **Rewrite** — improves stories and AC *(review gate)*
   - **Generate Test Specs** — creates tests for refined stories
   - **Quality Review** — scores and compares to original *(review gate)*

## Agent Definitions

Agent definitions live in the `agents/` directory as markdown files. Each agent has a defined role, input/output format, and rules. You can modify these to change how the pipeline behaves:

| Agent | File | Used in |
|-------|------|---------|
| Story Analyst | `agents/story-analyst.md` | Generate (analyze), Refine (gap analysis) |
| Story Decomposer | `agents/story-decomposer.md` | Generate (decompose) |
| AC Writer | `agents/ac-writer.md` | Generate (draft AC), Refine (rewrite) |
| Test Generator | `agents/test-generator.md` | Generate + Refine (test specs) |
| Story Reviewer | `agents/story-reviewer.md` | Generate + Refine (quality review) |
| Story Importer | `agents/story-importer.md` | Refine (import) |
| Story Rewriter | `agents/story-rewriter.md` | Refine (rewrite) |

To customize an agent, edit its markdown file. Changes take effect on the next pipeline run — no restart needed.

## Project Structure

```
story-refinery/
  agents/                       # Agent definitions (editable markdown)
  src/
    app/                        # Next.js pages and API routes
      api/                      # REST API endpoints
      generate/                 # Generate mode page
      refine/                   # Refine mode page
      runs/                     # Run history and detail pages
      settings/                 # Configuration page
    components/                 # React components
      layout/                   # Navigation, header
      pipeline/                 # Step timeline, output viewer, review form
    lib/                        # Core logic
      store.ts                  # Filesystem-backed JSON storage
      providers/                # AI provider abstraction (subscription/API/Bedrock)
      pipeline/                 # Pipeline engine, step definitions, agent loader
    types/                      # TypeScript type definitions
  data/                         # JSON data store (gitignored, created on first run)
  DESIGN.md                     # Architecture documentation
```

## Tech Stack

- **Next.js 16** — React framework with API routes
- **React 19** — UI components
- **Tailwind CSS 4** — Styling
- **JSON file storage** — Local state persistence (no native dependencies)
- **Anthropic SDK** — API key and Bedrock providers
- **Claude Code CLI** — Subscription provider

## Development

```bash
npm run dev     # Start dev server with hot reload
npm run build   # Production build
npm run lint    # Run ESLint
```

## License

MIT

# Story Refinery — Design Document

## Overview

Story Refinery is a web application that provides a visual interface for AI-powered user story generation and refinement. It wraps an agent pipeline where each step can be run independently and reviewed by a human at any point.

## Modes

### Generate
Takes a raw description from the user and runs a multi-step agent pipeline to produce refined features and user stories with acceptance criteria.

**Pipeline steps:**
1. **Analyze** — Parse input, identify themes, extract features
2. **Decompose** — Break features into user stories
3. **Draft AC** — Write acceptance criteria for each story
4. **Generate Tests** — Produce test specifications from AC
5. **Review** — Score the complete package against quality rubric

Each step produces output artifacts. A human review can be inserted after any step.

### Refine
Reads existing features/stories from Jira or the local filesystem and runs them through a refinement pipeline.

**Pipeline steps:**
1. **Import** — Pull from Jira (by key/sprint/epic) or read from local directory
2. **Gap Analysis** — Identify missing context, inconsistencies, weak AC
3. **Rewrite** — Improve stories and AC based on gap analysis
4. **Generate Tests** — Produce/update test specifications
5. **Review** — Score the refined package

## Architecture

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **Database:** SQLite (via better-sqlite3) for local state
- **Agent Runtime:** Claude API via Anthropic SDK
- **Real-time:** Server-Sent Events for pipeline progress

### Data Model

```
Config           — Jira connection, output directory, API keys
Pipeline Run     — A single execution (mode, status, input, timestamps)
Pipeline Step    — One step in a run (agent, status, input, output)
Review           — Human review attached to a step (comments, approval)
```

### Directory Structure
```
src/
  app/
    page.tsx                    — Dashboard (mode selection)
    generate/page.tsx           — Generate mode input + pipeline
    refine/page.tsx             — Refine mode source selection + pipeline
    runs/page.tsx               — Run history
    runs/[id]/page.tsx          — Run detail with step visualization
    settings/page.tsx           — Configuration
    api/
      config/route.ts           — Configuration CRUD
      pipeline/
        start/route.ts          — Start a new pipeline run
        [id]/
          route.ts              — Get run status
          events/route.ts       — SSE stream for real-time updates
          steps/
            [stepId]/
              review/route.ts   — Add human review to step
              rerun/route.ts    — Re-run a specific step
      jira/
        test/route.ts           — Test Jira connection
        stories/route.ts        — Fetch stories from Jira
  lib/
    db.ts                       — SQLite connection + schema
    pipeline/
      engine.ts                 — Pipeline execution engine
      steps.ts                  — Step definitions (generate + refine)
      agents.ts                 — Agent prompt templates
    jira.ts                     — Jira MCP client
    files.ts                    — Local file system operations
  components/
    layout/
      nav.tsx                   — Navigation sidebar
      header.tsx                — Page header
    pipeline/
      step-card.tsx             — Visual card for a pipeline step
      step-timeline.tsx         — Vertical timeline of steps
      review-form.tsx           — Human review form
      output-viewer.tsx         — Rendered output display
    forms/
      generate-input.tsx        — Generate mode input form
      refine-source.tsx         — Refine mode source picker
  types/
    index.ts                    — Shared TypeScript types
```

### Output Directory
Stories and artifacts are written to a configurable output directory:
```
<output-dir>/
  <run-id>/
    features/
      <FEATURE-SLUG>/
        feature.md
        stories/
          <STORY-SLUG>.md       — or <JIRA-ID>.md if sourced from Jira
          <STORY-SLUG>/
            analysis.md
            acceptance-criteria.md
            test-spec.md
            review.md
```

Files sourced from Jira use the Jira issue key as the filename (e.g., `PROJ-123.md`).

## Pipeline Engine

The engine is step-based and event-driven:
1. Each step is an async function that receives input and produces output
2. Steps emit events (started, progress, completed, failed) via SSE
3. Between any two steps, the engine checks for a "review gate" — if enabled, it pauses and waits for human review
4. Steps can be re-run individually, feeding their output forward through remaining steps
5. The full pipeline state is persisted to SQLite so runs survive server restarts

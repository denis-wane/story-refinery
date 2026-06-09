import { NextRequest, NextResponse } from "next/server";
import {
  fetchJiraIssues,
  searchJiraIssues,
  formatJiraStoriesForPipeline,
  JiraIssue,
} from "@/lib/jira";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keys, jql } = body as { keys?: string[]; jql?: string };

    if (!keys?.length && !jql) {
      return NextResponse.json(
        { error: "Provide either 'keys' (array of issue keys) or 'jql' (query string)" },
        { status: 400 }
      );
    }

    let issues: JiraIssue[];
    let fetchErrors: string[] | undefined;

    if (keys?.length) {
      const cleaned = keys.map((k) => k.trim().toUpperCase()).filter(Boolean);
      if (cleaned.length === 0) {
        return NextResponse.json(
          { error: "No valid issue keys provided" },
          { status: 400 }
        );
      }

      const result = await fetchJiraIssues(cleaned);
      issues = result.issues;
      fetchErrors = result.errors.length > 0 ? result.errors : undefined;
    } else {
      issues = await searchJiraIssues(jql!);
    }

    const stories = formatJiraStoriesForPipeline(issues, fetchErrors);

    return NextResponse.json({
      stories,
      count: issues.length,
      errors: fetchErrors,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

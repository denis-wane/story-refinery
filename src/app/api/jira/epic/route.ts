import { NextRequest, NextResponse } from "next/server";
import { fetchEpicChildren, formatEpicForPipeline } from "@/lib/jira";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { epicKey, format } = body as { epicKey?: string; format?: "preview" | "pipeline" };

    if (!epicKey?.trim()) {
      return NextResponse.json(
        { error: "Provide an 'epicKey' (e.g. PROJ-100)" },
        { status: 400 }
      );
    }

    const preview = await fetchEpicChildren(epicKey.trim().toUpperCase());

    if (format === "pipeline") {
      // Return formatted markdown ready for the pipeline
      return NextResponse.json({
        stories: formatEpicForPipeline(preview),
        count: preview.totalFound,
        epicKey: preview.epic.key,
        epicSummary: preview.epic.summary,
      });
    }

    // Default: return structured preview data for the UI
    return NextResponse.json({
      epic: {
        key: preview.epic.key,
        summary: preview.epic.summary,
        description: preview.epic.description,
        status: preview.epic.status,
        labels: preview.epic.labels,
      },
      children: preview.children.map((c) => ({
        key: c.key,
        summary: c.summary,
        status: c.status,
        assignee: c.assignee,
        priority: c.priority,
        hasAC: !!c.acceptanceCriteria,
        labels: c.labels,
      })),
      totalFound: preview.totalFound,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

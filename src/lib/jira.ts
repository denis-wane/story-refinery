import { getConfigValue } from "@/lib/store";

// ── Types ──────────────────────────────────────────────────────────────

export interface JiraConfig {
  url: string;
  email: string;
  apiKey: string;
  projectKey: string;
}

export interface JiraIssue {
  key: string;
  summary: string;
  description: string;
  acceptanceCriteria: string;
  status: string;
  assignee: string;
  priority: string;
  labels: string[];
  sprint: string;
  epic: string;
  comments: JiraComment[];
  linkedIssues: JiraLink[];
}

interface JiraComment {
  author: string;
  body: string;
  created: string;
}

interface JiraLink {
  type: string;
  key: string;
  summary: string;
  direction: string;
}

// ── Config ─────────────────────────────────────────────────────────────

export function getJiraConfig(): JiraConfig {
  return {
    url: (getConfigValue("jira_url") ?? "").replace(/\/$/, ""),
    email: getConfigValue("jira_email") ?? "",
    apiKey: getConfigValue("jira_api_key") ?? "",
    projectKey: getConfigValue("jira_project_key") ?? "",
  };
}

function authHeader(config: JiraConfig): Record<string, string> {
  const auth = Buffer.from(`${config.email}:${config.apiKey}`).toString("base64");
  return {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
  };
}

function validateConfig(config: JiraConfig): string | null {
  if (!config.url) return "Jira URL is not configured";
  if (!config.email) return "Jira email is not configured";
  if (!config.apiKey) return "Jira API key is not configured";
  return null;
}

// ── ADF → Markdown ────────────────────────────────────────────────────

function adfToMarkdown(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;

  // Text node
  if (n.type === "text") {
    let text = (n.text as string) || "";
    const marks = (n.marks as Array<{ type: string }>) || [];
    for (const mark of marks) {
      if (mark.type === "strong") text = `**${text}**`;
      else if (mark.type === "em") text = `*${text}*`;
      else if (mark.type === "code") text = `\`${text}\``;
      else if (mark.type === "strike") text = `~~${text}~~`;
    }
    return text;
  }

  const content = (n.content as unknown[]) || [];
  const children = content.map(adfToMarkdown).join("");

  switch (n.type) {
    case "doc":
      return children;
    case "paragraph":
      return children + "\n\n";
    case "heading": {
      const level = (n.attrs as { level: number })?.level || 1;
      return "#".repeat(level) + " " + children + "\n\n";
    }
    case "bulletList":
      return content.map((item) => "- " + adfToMarkdown(item).trim()).join("\n") + "\n\n";
    case "orderedList":
      return content.map((item, i) => `${i + 1}. ` + adfToMarkdown(item).trim()).join("\n") + "\n\n";
    case "listItem":
      return children;
    case "codeBlock":
      return "```\n" + children + "\n```\n\n";
    case "blockquote":
      return children.split("\n").map((line: string) => "> " + line).join("\n") + "\n\n";
    case "table":
      return formatAdfTable(content) + "\n\n";
    case "hardBreak":
      return "\n";
    case "mention":
      return `@${(n.attrs as { text?: string })?.text || "unknown"}`;
    case "inlineCard":
    case "mediaGroup":
    case "mediaSingle":
      return `[attachment]\n`;
    default:
      return children;
  }
}

function formatAdfTable(rows: unknown[]): string {
  const parsed: string[][] = [];
  for (const row of rows) {
    const r = row as { content?: unknown[] };
    const cells = (r.content || []).map((cell) => adfToMarkdown(cell).trim());
    parsed.push(cells);
  }
  if (parsed.length === 0) return "";
  const header = parsed[0];
  const sep = header.map(() => "---");
  const lines = [header.join(" | "), sep.join(" | ")];
  for (let i = 1; i < parsed.length; i++) {
    lines.push(parsed[i].join(" | "));
  }
  return lines.map((l) => "| " + l + " |").join("\n");
}

function descriptionToMarkdown(field: unknown): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  // ADF object
  if (typeof field === "object" && (field as Record<string, unknown>).type === "doc") {
    return adfToMarkdown(field).trim();
  }
  return String(field);
}

// ── API calls ──────────────────────────────────────────────────────────

const FIELDS = [
  "summary",
  "description",
  "comment",
  "status",
  "assignee",
  "labels",
  "priority",
  "issuelinks",
  "parent",
  "customfield_10020", // sprint
].join(",");

export async function fetchJiraIssue(key: string): Promise<JiraIssue> {
  const config = getJiraConfig();
  const err = validateConfig(config);
  if (err) throw new Error(err);

  const url = `${config.url}/rest/api/3/issue/${encodeURIComponent(key)}?fields=${FIELDS}&expand=renderedFields`;
  const res = await fetch(url, { headers: authHeader(config) });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404) throw new Error(`Issue ${key} not found`);
    throw new Error(`Jira API error (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return parseIssue(data);
}

export interface FetchResult {
  issues: JiraIssue[];
  errors: string[];
}

export async function fetchJiraIssues(keys: string[]): Promise<FetchResult> {
  const issues: JiraIssue[] = [];
  const errors: string[] = [];
  const batchSize = 10;

  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map((k) => fetchJiraIssue(k)));
    for (let j = 0; j < settled.length; j++) {
      const result = settled[j];
      if (result.status === "fulfilled") {
        issues.push(result.value);
      } else {
        errors.push(`${batch[j]}: ${result.reason?.message || result.reason}`);
      }
    }
  }

  if (errors.length > 0 && issues.length === 0) {
    throw new Error(`All issues failed to fetch:\n${errors.join("\n")}`);
  }

  return { issues, errors };
}

export async function searchJiraIssues(jql: string): Promise<JiraIssue[]> {
  const config = getJiraConfig();
  const err = validateConfig(config);
  if (err) throw new Error(err);

  const url = `${config.url}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=${FIELDS}&expand=renderedFields&maxResults=50`;
  const res = await fetch(url, { headers: authHeader(config) });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira search failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.issues || []).map(parseIssue);
}

// ── Parse raw API response ─────────────────────────────────────────────

function parseIssue(raw: Record<string, unknown>): JiraIssue {
  const fields = raw.fields as Record<string, unknown>;

  // Description: prefer raw ADF, fall back to renderedFields HTML
  const descriptionRaw = fields.description;
  let description = descriptionToMarkdown(descriptionRaw);

  // If ADF conversion produced nothing, try renderedFields (HTML)
  if (!description) {
    const rendered = (raw.renderedFields as Record<string, unknown>)?.description;
    if (typeof rendered === "string") {
      description = htmlToPlainText(rendered);
    }
  }

  // Extract AC — common patterns: "Acceptance Criteria" heading in description,
  // or a custom field. We'll try to split from the description.
  let acceptanceCriteria = "";
  const acMatch = description.match(/(?:^|\n)#{1,3}\s*Acceptance\s*Criteria\s*\n([\s\S]*?)(?=\n#{1,3}\s|\n---|\Z)/i);
  if (acMatch) {
    acceptanceCriteria = acMatch[1].trim();
  }

  // Comments
  const commentData = fields.comment as { comments?: Array<Record<string, unknown>> } | undefined;
  const comments: JiraComment[] = (commentData?.comments || []).map((c) => ({
    author: (c.author as Record<string, unknown>)?.displayName as string || "Unknown",
    body: descriptionToMarkdown(c.body),
    created: (c.created as string) || "",
  }));

  // Sprint (customfield_10020 is typically an array of sprint objects)
  let sprint = "";
  const sprintField = fields.customfield_10020;
  if (Array.isArray(sprintField) && sprintField.length > 0) {
    const active = sprintField.find((s: Record<string, unknown>) => s.state === "active") || sprintField[sprintField.length - 1];
    sprint = active?.name || "";
  }

  // Epic (parent with type "Epic")
  let epic = "";
  const parent = fields.parent as Record<string, unknown> | undefined;
  if (parent) {
    const parentFields = parent.fields as Record<string, unknown> | undefined;
    const issueType = parentFields?.issuetype as Record<string, unknown> | undefined;
    if (issueType?.name === "Epic") {
      epic = `${parent.key}: ${(parentFields?.summary as string) || ""}`;
    } else {
      epic = (parent.key as string) || "";
    }
  }

  // Linked issues
  const links = fields.issuelinks as Array<Record<string, unknown>> | undefined;
  const linkedIssues: JiraLink[] = (links || []).map((link) => {
    const linkType = link.type as Record<string, unknown>;
    const inward = link.inwardIssue as Record<string, unknown> | undefined;
    const outward = link.outwardIssue as Record<string, unknown> | undefined;
    const target = inward || outward;
    const direction = inward ? "inward" : "outward";
    const typeName = inward
      ? (linkType.inward as string)
      : (linkType.outward as string);
    return {
      type: typeName || "relates to",
      key: (target?.key as string) || "",
      summary: ((target?.fields as Record<string, unknown>)?.summary as string) || "",
      direction,
    };
  }).filter((l) => l.key);

  return {
    key: raw.key as string,
    summary: (fields.summary as string) || "",
    description,
    acceptanceCriteria,
    status: ((fields.status as Record<string, unknown>)?.name as string) || "",
    assignee: ((fields.assignee as Record<string, unknown>)?.displayName as string) || "Unassigned",
    priority: ((fields.priority as Record<string, unknown>)?.name as string) || "",
    labels: (fields.labels as string[]) || [],
    sprint,
    epic,
    comments,
    linkedIssues,
  };
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<h([1-6])[^>]*>/gi, (_, level) => "#".repeat(Number(level)) + " ")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<code>(.*?)<\/code>/gi, "`$1`")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Epic / Feature fetch ──────────────────────────────────────────────

export interface EpicPreview {
  epic: JiraIssue;
  children: JiraIssue[];
  totalFound: number;
}

/**
 * Fetch an epic/feature and all its child stories from Jira Cloud (SaaS).
 * Uses two JQL strategies to catch both "Epic Link" and next-gen "parent" relationships.
 */
export async function fetchEpicChildren(epicKey: string): Promise<EpicPreview> {
  const config = getJiraConfig();
  const err = validateConfig(config);
  if (err) throw new Error(err);

  // 1. Fetch the epic/feature itself
  const epic = await fetchJiraIssue(epicKey);

  // 2. Find child issues — Jira Cloud supports both classic and next-gen hierarchies.
  //    "Epic Link" is the classic custom field; "parent" covers next-gen projects.
  //    We run both JQL queries and deduplicate by key.
  const jqlParent = `parent = ${epicKey} ORDER BY rank ASC, key ASC`;
  const jqlEpicLink = `"Epic Link" = ${epicKey} ORDER BY rank ASC, key ASC`;

  const [parentResults, epicLinkResults] = await Promise.allSettled([
    searchJiraIssues(jqlParent),
    searchJiraIssues(jqlEpicLink),
  ]);

  const seen = new Set<string>();
  const children: JiraIssue[] = [];

  for (const result of [parentResults, epicLinkResults]) {
    if (result.status === "fulfilled") {
      for (const issue of result.value) {
        if (!seen.has(issue.key)) {
          seen.add(issue.key);
          children.push(issue);
        }
      }
    }
    // Silently ignore failures — one strategy may not apply to every project type
  }

  return {
    epic,
    children,
    totalFound: children.length,
  };
}

/**
 * Format an epic + children for the pipeline, including the epic context header.
 */
export function formatEpicForPipeline(preview: EpicPreview): string {
  const now = new Date().toISOString();
  const lines: string[] = [
    "# Imported Stories",
    "",
    "## Source",
    "- **Type:** Jira (Epic Import)",
    `- **Epic:** ${preview.epic.key}: ${preview.epic.summary}`,
    `- **Import date:** ${now}`,
    `- **Stories found:** ${preview.totalFound}`,
    "",
    "## Epic Context",
    "",
    `### ${preview.epic.key}: ${preview.epic.summary}`,
    "",
    "**Description:**",
    preview.epic.description || "_No description provided._",
    "",
  ];

  if (preview.epic.acceptanceCriteria) {
    lines.push("**Acceptance Criteria:**");
    lines.push(preview.epic.acceptanceCriteria);
    lines.push("");
  }

  lines.push("---", "", "## Stories", "");

  // Reuse the per-issue formatting from the existing function
  for (const issue of preview.children) {
    lines.push(`### ${issue.key}: ${issue.summary}`);
    lines.push("");
    lines.push(`**Source ID:** ${issue.key}`);
    lines.push(`**Status:** ${issue.status}`);
    lines.push(`**Assignee:** ${issue.assignee}`);
    lines.push("");
    lines.push("**Description:**");
    lines.push(issue.description || "_No description provided._");
    lines.push("");
    lines.push("**Existing Acceptance Criteria:**");
    lines.push(issue.acceptanceCriteria || "_No acceptance criteria found in source._");
    lines.push("");

    if (issue.comments.length > 0) {
      lines.push("**Comments/Context:**");
      for (const c of issue.comments) {
        const date = c.created ? ` (${c.created.slice(0, 10)})` : "";
        lines.push(`- **${c.author}**${date}: ${c.body}`);
      }
      lines.push("");
    }

    lines.push("**Links & Dependencies:**");
    if (issue.linkedIssues.length > 0 || issue.epic) {
      if (issue.epic) lines.push(`- Epic: ${issue.epic}`);
      for (const link of issue.linkedIssues) {
        lines.push(`- ${link.type}: ${link.key} — ${link.summary}`);
      }
    } else {
      lines.push("_No linked issues._");
    }
    lines.push("");

    lines.push("**Metadata:**");
    lines.push(`- Priority: ${issue.priority || "None"}`);
    lines.push(`- Labels: ${issue.labels.length > 0 ? issue.labels.join(", ") : "None"}`);
    lines.push(`- Sprint: ${issue.sprint || "None"}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

// ── Format for pipeline ────────────────────────────────────────────────

export function formatJiraStoriesForPipeline(
  issues: JiraIssue[],
  errors?: string[]
): string {
  const now = new Date().toISOString();
  const lines: string[] = [
    "# Imported Stories",
    "",
    "## Source",
    "- **Type:** Jira",
    `- **Import date:** ${now}`,
    "",
    "## Stories",
    "",
  ];

  for (const issue of issues) {
    lines.push(`### ${issue.key}: ${issue.summary}`);
    lines.push("");
    lines.push(`**Source ID:** ${issue.key}`);
    lines.push(`**Status:** ${issue.status}`);
    lines.push(`**Assignee:** ${issue.assignee}`);
    lines.push("");

    // Description
    lines.push("**Description:**");
    lines.push(issue.description || "_No description provided._");
    lines.push("");

    // Acceptance Criteria
    lines.push("**Existing Acceptance Criteria:**");
    lines.push(issue.acceptanceCriteria || "_No acceptance criteria found in source._");
    lines.push("");

    // Comments
    if (issue.comments.length > 0) {
      lines.push("**Comments/Context:**");
      for (const c of issue.comments) {
        const date = c.created ? ` (${c.created.slice(0, 10)})` : "";
        lines.push(`- **${c.author}**${date}: ${c.body}`);
      }
      lines.push("");
    } else {
      lines.push("**Comments/Context:**");
      lines.push("_No comments._");
      lines.push("");
    }

    // Links
    lines.push("**Links & Dependencies:**");
    if (issue.linkedIssues.length > 0 || issue.epic) {
      if (issue.epic) {
        lines.push(`- Epic: ${issue.epic}`);
      }
      for (const link of issue.linkedIssues) {
        lines.push(`- ${link.type}: ${link.key} — ${link.summary}`);
      }
    } else {
      lines.push("_No linked issues._");
    }
    lines.push("");

    // Metadata
    lines.push("**Metadata:**");
    lines.push(`- Priority: ${issue.priority || "None"}`);
    lines.push(`- Labels: ${issue.labels.length > 0 ? issue.labels.join(", ") : "None"}`);
    lines.push(`- Sprint: ${issue.sprint || "None"}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Import notes
  if (errors && errors.length > 0) {
    lines.push("## Import Notes");
    for (const e of errors) {
      lines.push(`- **Failed:** ${e}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

import fs from "fs";
import path from "path";

const AGENTS_DIR = path.join(process.cwd(), "agents");

/**
 * Load an agent definition from the agents/ directory.
 * Returns the full markdown content which includes the role, rules, and output format.
 */
export function loadAgentDefinition(agentSlug: string): string {
  const filePath = path.join(AGENTS_DIR, `${agentSlug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Agent definition not found: ${agentSlug}.md — expected at ${filePath}`
    );
  }
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Build a complete prompt by combining the agent definition with the step's
 * task-specific instructions and input data.
 */
export function buildAgentPrompt(
  agentSlug: string,
  taskInstructions: string,
  input: string,
  context?: string
): string {
  const definition = loadAgentDefinition(agentSlug);

  const parts = [
    "# Agent Definition",
    definition,
    "",
    "# Task",
    taskInstructions,
    "",
    "# Input",
    input,
  ];

  if (context) {
    parts.push("", "# Additional Context", context);
  }

  return parts.join("\n");
}

/**
 * List all available agent definitions.
 */
export function listAgents(): { slug: string; name: string }[] {
  if (!fs.existsSync(AGENTS_DIR)) return [];

  return fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const slug = f.replace(".md", "");
      const content = fs.readFileSync(path.join(AGENTS_DIR, f), "utf-8");
      const nameMatch = content.match(/^# Agent: (.+)$/m);
      return {
        slug,
        name: nameMatch ? nameMatch[1] : slug,
      };
    });
}

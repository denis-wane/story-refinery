"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SourceType = "jira" | "local";

export default function RefinePage() {
  const router = useRouter();
  const [source, setSource] = useState<SourceType>("local");
  const [jiraKeys, setJiraKeys] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const rawInput = source === "jira" ? jiraKeys.trim() : localPath.trim();
    if (!rawInput) return;

    setSubmitting(true);
    setError("");
    setStatusMsg("");

    try {
      let pipelineInput = rawInput;

      // For Jira source: fetch stories from Jira first, then feed formatted markdown to the pipeline
      if (source === "jira") {
        setStatusMsg("Fetching stories from Jira...");
        const keys = rawInput
          .split(/[\n,]+/)
          .map((k) => k.trim())
          .filter(Boolean);

        const jiraRes = await fetch("/api/jira/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys }),
        });

        const jiraData = await jiraRes.json();

        if (!jiraRes.ok) {
          setError(jiraData.error || "Failed to fetch stories from Jira");
          return;
        }

        if (jiraData.count === 0) {
          setError("No stories were found for the provided keys");
          return;
        }

        setStatusMsg(`Fetched ${jiraData.count} stories. Starting pipeline...`);
        pipelineInput = jiraData.stories;

        if (jiraData.errors?.length) {
          setStatusMsg(
            `Fetched ${jiraData.count} stories (${jiraData.errors.length} failed). Starting pipeline...`
          );
        }
      }

      const res = await fetch("/api/pipeline/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "refine",
          input: pipelineInput,
          refine_source: source,
          refine_path: source === "local" ? localPath.trim() : undefined,
        }),
      });

      if (res.ok) {
        const run = await res.json();
        router.push(`/runs/${run.id}`);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || `Pipeline failed to start (HTTP ${res.status})`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setSubmitting(false);
      setStatusMsg("");
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Refine Stories</h1>
        <p className="text-gray-400 mt-1">
          Import existing stories from Jira or local files for gap analysis and
          refinement.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Source Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Story Source
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSource("local")}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  source === "local"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-gray-700 bg-gray-900 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-200">
                    Local Files
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Read from a directory on your file system
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSource("jira")}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  source === "jira"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-700 bg-gray-900 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-200">
                    Jira
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Pull stories from Jira by key, sprint, or epic
                </p>
              </button>
            </div>
          </div>

          {/* Source-specific inputs */}
          {source === "jira" ? (
            <div>
              <label
                htmlFor="jira-keys"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Jira Keys or Filter
              </label>
              <textarea
                id="jira-keys"
                value={jiraKeys}
                onChange={(e) => setJiraKeys(e.target.value)}
                rows={4}
                placeholder="Enter Jira issue keys (one per line), a sprint name, or an epic key.

Example:
PROJ-123
PROJ-124
PROJ-125"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Requires Jira connection configured in Settings. Files will be
                named using the Jira issue key.
              </p>
            </div>
          ) : (
            <div>
              <label
                htmlFor="local-path"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Directory Path
              </label>
              <input
                id="local-path"
                type="text"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="/path/to/features or /path/to/stories"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                Point to a directory containing feature.md and story files.
              </p>
            </div>
          )}

          {/* Pipeline Preview */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Refine Pipeline Steps
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Step label="Import" />
              <Arrow />
              <Step label="Gap Analysis" review />
              <Arrow />
              <Step label="Rewrite" review />
              <Arrow />
              <Step label="Test Specs" />
              <Arrow />
              <Step label="Review" review />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Status message */}
          {statusMsg && !error && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-blue-300">{statusMsg}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              (source === "jira" ? !jiraKeys.trim() : !localPath.trim())
            }
            className="w-full py-3 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting
              ? statusMsg || "Starting pipeline..."
              : "Start Refinement Pipeline"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Step({ label, review }: { label: string; review?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 text-gray-400">
      {label}
      {review && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
    </span>
  );
}

function Arrow() {
  return (
    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

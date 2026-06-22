"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SourceType = "jira" | "local" | "epic";

interface EpicChild {
  key: string;
  summary: string;
  status: string;
  assignee: string;
  priority: string;
  hasAC: boolean;
  labels: string[];
}

interface EpicPreviewData {
  epic: {
    key: string;
    summary: string;
    description: string;
    status: string;
    labels: string[];
  };
  children: EpicChild[];
  totalFound: number;
}

export default function RefinePage() {
  const router = useRouter();
  const [source, setSource] = useState<SourceType>("local");
  const [jiraKeys, setJiraKeys] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [epicKey, setEpicKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");

  // Epic preview state
  const [epicPreview, setEpicPreview] = useState<EpicPreviewData | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [loadingPreview, setLoadingPreview] = useState(false);

  async function handleEpicPreview() {
    if (!epicKey.trim() || loadingPreview) return;

    setLoadingPreview(true);
    setError("");
    setEpicPreview(null);

    try {
      const res = await fetch("/api/jira/epic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epicKey: epicKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch epic");
        return;
      }

      if (data.totalFound === 0) {
        setError(`No child stories found under ${data.epic.key}. Is this an Epic or Feature?`);
        return;
      }

      setEpicPreview(data);
      // Select all by default
      setSelectedKeys(new Set(data.children.map((c: EpicChild) => c.key)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingPreview(false);
    }
  }

  function toggleStory(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (!epicPreview) return;
    if (selectedKeys.size === epicPreview.children.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(epicPreview.children.map((c) => c.key)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    // For epic source with preview shown, use selected keys
    if (source === "epic" && epicPreview) {
      if (selectedKeys.size === 0) {
        setError("Select at least one story to refine");
        return;
      }
      await startEpicPipeline();
      return;
    }

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
          refine_source: source === "epic" ? "jira" : source,
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

  async function startEpicPipeline() {
    if (!epicPreview) return;

    setSubmitting(true);
    setError("");
    setStatusMsg("Fetching selected stories from Jira...");

    try {
      // Fetch full story data for selected keys via the stories endpoint
      const keys = Array.from(selectedKeys);
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

      // Prepend epic context to the pipeline input
      const epicContext = [
        "# Epic Context",
        "",
        `## ${epicPreview.epic.key}: ${epicPreview.epic.summary}`,
        "",
        epicPreview.epic.description || "_No description._",
        "",
        "---",
        "",
      ].join("\n");

      const pipelineInput = epicContext + jiraData.stories;

      setStatusMsg(`Starting pipeline with ${keys.length} stories from ${epicPreview.epic.key}...`);

      const res = await fetch("/api/pipeline/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "refine",
          input: pipelineInput,
          refine_source: "jira",
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
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
      setStatusMsg("");
    }
  }

  const canSubmit = (() => {
    if (submitting) return false;
    if (source === "jira") return !!jiraKeys.trim();
    if (source === "local") return !!localPath.trim();
    if (source === "epic") return epicPreview !== null && selectedKeys.size > 0;
    return false;
  })();

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
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => { setSource("local"); setEpicPreview(null); }}
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
                  Read from your file system
                </p>
              </button>
              <button
                type="button"
                onClick={() => { setSource("jira"); setEpicPreview(null); }}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  source === "jira"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-700 bg-gray-900 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm font-medium text-gray-200">
                    Jira Stories
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Pull individual stories by key
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSource("epic")}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  source === "epic"
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-gray-700 bg-gray-900 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-sm font-medium text-gray-200">
                    Epic / Feature
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Import all stories from an epic
                </p>
              </button>
            </div>
          </div>

          {/* Source-specific inputs */}
          {source === "epic" ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="epic-key"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Epic or Feature Key
                </label>
                <div className="flex gap-3">
                  <input
                    id="epic-key"
                    type="text"
                    value={epicKey}
                    onChange={(e) => {
                      setEpicKey(e.target.value);
                      if (epicPreview) {
                        setEpicPreview(null);
                        setSelectedKeys(new Set());
                      }
                    }}
                    placeholder="PROJ-100"
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleEpicPreview();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleEpicPreview}
                    disabled={!epicKey.trim() || loadingPreview}
                    className="px-5 py-3 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {loadingPreview ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Fetching...
                      </span>
                    ) : (
                      "Fetch Stories"
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter an Epic or Feature key. All child stories will be discovered automatically.
                </p>
              </div>

              {/* Epic Preview */}
              {epicPreview && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                  {/* Epic header */}
                  <div className="px-4 py-3 border-b border-gray-800 bg-purple-500/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono text-purple-400">{epicPreview.epic.key}</span>
                        <h3 className="text-sm font-medium text-gray-200 mt-0.5">
                          {epicPreview.epic.summary}
                        </h3>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        epicPreview.epic.status === "Done" ? "bg-green-900/50 text-green-400" :
                        epicPreview.epic.status === "In Progress" ? "bg-blue-900/50 text-blue-400" :
                        "bg-gray-800 text-gray-400"
                      }`}>
                        {epicPreview.epic.status}
                      </span>
                    </div>
                  </div>

                  {/* Select all / count bar */}
                  <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedKeys.size === epicPreview.children.length}
                        onChange={toggleAll}
                        className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                      />
                      <span className="text-xs text-gray-400">Select all</span>
                    </label>
                    <span className="text-xs text-gray-500">
                      {selectedKeys.size} of {epicPreview.totalFound} selected
                    </span>
                  </div>

                  {/* Story list */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/50">
                    {epicPreview.children.map((child) => (
                      <label
                        key={child.key}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          selectedKeys.has(child.key) ? "bg-gray-800/30" : "hover:bg-gray-800/20"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(child.key)}
                          onChange={() => toggleStory(child.key)}
                          className="mt-0.5 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-500">{child.key}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              child.status === "Done" ? "bg-green-900/40 text-green-400" :
                              child.status === "In Progress" ? "bg-blue-900/40 text-blue-400" :
                              "bg-gray-800 text-gray-500"
                            }`}>
                              {child.status}
                            </span>
                            {!child.hasAC && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400">
                                No AC
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mt-0.5 truncate">{child.summary}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                            <span>{child.assignee}</span>
                            {child.priority && <span>{child.priority}</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : source === "jira" ? (
            <div>
              <label
                htmlFor="jira-keys"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Jira Issue Keys
              </label>
              <textarea
                id="jira-keys"
                value={jiraKeys}
                onChange={(e) => setJiraKeys(e.target.value)}
                rows={4}
                placeholder="Enter Jira issue keys, one per line:

PROJ-123
PROJ-124
PROJ-125"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Requires Jira connection configured in Settings.
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
            disabled={!canSubmit}
            className="w-full py-3 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting
              ? statusMsg || "Starting pipeline..."
              : source === "epic" && !epicPreview
              ? "Fetch stories first"
              : `Start Refinement Pipeline${source === "epic" && selectedKeys.size > 0 ? ` (${selectedKeys.size} stories)` : ""}`}
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

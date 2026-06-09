"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PipelineRun } from "@/types";

const statusStyles: Record<string, string> = {
  pending: "bg-gray-700 text-gray-300",
  running: "bg-blue-800/50 text-blue-300",
  paused: "bg-amber-800/50 text-amber-300",
  completed: "bg-green-800/50 text-green-300",
  failed: "bg-red-800/50 text-red-300",
};

const modeLabels: Record<string, string> = {
  generate: "Generate",
  refine: "Refine",
};

export default function RunsPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pipeline/runs")
      .then((r) => r.json())
      .then(setRuns)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Pipeline Runs</h1>
        <p className="text-gray-400 mt-1">
          History of all generation and refinement runs.
        </p>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : runs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No runs yet</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/generate"
              className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-sm hover:bg-blue-600/30 transition-colors"
            >
              Generate Stories
            </Link>
            <Link
              href="/refine"
              className="px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 text-sm hover:bg-emerald-600/30 transition-colors"
            >
              Refine Stories
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/runs/${run.id}`}
              className="block p-4 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      run.mode === "generate"
                        ? "bg-blue-900/30 text-blue-400"
                        : "bg-emerald-900/30 text-emerald-400"
                    }`}
                  >
                    {modeLabels[run.mode]}
                  </span>
                  <span className="text-sm text-gray-300 truncate max-w-md">
                    {run.input.slice(0, 100)}
                    {run.input.length > 100 ? "..." : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${statusStyles[run.status]}`}
                  >
                    {run.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(run.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

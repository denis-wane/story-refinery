"use client";

import { useState } from "react";
import type { PipelineStep, Review } from "@/types";
import DiffViewer from "./diff-viewer";
import InlineFeedback from "./inline-feedback";

interface OutputViewerProps {
  step: PipelineStep | null;
  reviews: Review[];
  runId?: string;
  onRerunComplete?: () => void;
}

export default function OutputViewer({ step, reviews, runId, onRerunComplete }: OutputViewerProps) {
  const [rerunning, setRerunning] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [inlineFeedbackMode, setInlineFeedbackMode] = useState(false);

  const canRerun = step && runId && (step.status === "completed" || step.status === "failed");

  async function handleRerun() {
    if (!step || !runId) return;
    setRerunning(true);
    try {
      const res = await fetch(`/api/pipeline/${runId}/steps/${step.id}/rerun`, {
        method: "POST",
      });
      if (res.ok) {
        onRerunComplete?.();
      }
    } catch (err) {
      console.error("Re-run failed:", err);
    } finally {
      setRerunning(false);
    }
  }
  if (!step) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Select a step to view its output
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">{step.name}</h2>
          <div className="flex items-center gap-2">
            {canRerun && (
              <button
                onClick={handleRerun}
                disabled={rerunning}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rerunning ? (
                  <>
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Re-running...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Re-run from here
                  </>
                )}
              </button>
            )}
            <StatusBadge status={step.status} />
          </div>
        </div>

        {step.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-300 text-sm">
            <strong>Error:</strong> {step.error}
          </div>
        )}

        {step.output && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Output
              </h3>
              <div className="flex items-center gap-2">
                {step.previous_outputs && step.previous_outputs.length > 0 && (
                  <button
                    onClick={() => setShowDiff(!showDiff)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      showDiff
                        ? "bg-purple-600/30 text-purple-300"
                        : "bg-gray-700/50 text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {showDiff ? "Hide diff" : "Show diff"}
                    <span className="text-xs text-gray-500 ml-1">
                      ({step.previous_outputs.length} revision{step.previous_outputs.length !== 1 ? "s" : ""})
                    </span>
                  </button>
                )}
                {step.review_gate && (step.status === "completed" || step.status === "review_pending") && (
                  <button
                    onClick={() => setInlineFeedbackMode(!inlineFeedbackMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      inlineFeedbackMode
                        ? "bg-blue-600/30 text-blue-300"
                        : "bg-gray-700/50 text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    {inlineFeedbackMode ? "Raw view" : "Inline feedback"}
                  </button>
                )}
              </div>
            </div>

            {showDiff && step.previous_outputs && step.previous_outputs.length > 0 && (
              <DiffViewer
                currentOutput={step.output}
                previousOutputs={step.previous_outputs}
              />
            )}

            {inlineFeedbackMode && runId ? (
              <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                <InlineFeedback
                  output={step.output}
                  stepId={step.id}
                  runId={runId}
                  stepName={step.name}
                  onReviewSubmitted={() => onRerunComplete?.()}
                />
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">
                  {step.output}
                </pre>
              </div>
            )}
          </div>
        )}

        {step.status === "running" && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-900/10 border border-blue-800/30">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-blue-400">Agent is working...</span>
          </div>
        )}

        {step.status === "pending" && (
          <div className="text-sm text-gray-500 p-4">
            Waiting for previous steps to complete.
          </div>
        )}

        {reviews.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Reviews
            </h3>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className={`p-3 rounded-lg border text-sm ${
                    review.approved
                      ? "bg-green-900/10 border-green-800/30"
                      : "bg-amber-900/10 border-amber-800/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        review.approved
                          ? "bg-green-800/50 text-green-300"
                          : "bg-amber-800/50 text-amber-300"
                      }`}
                    >
                      {review.approved ? "Approved" : "Changes Requested"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-1">{review.comments}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-gray-700 text-gray-300",
    running: "bg-blue-800/50 text-blue-300",
    completed: "bg-green-800/50 text-green-300",
    failed: "bg-red-800/50 text-red-300",
    review_pending: "bg-amber-800/50 text-amber-300",
    skipped: "bg-gray-700 text-gray-400",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
    review_pending: "Awaiting Review",
    skipped: "Skipped",
  };

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] || ""}`}>
      {labels[status] || status}
    </span>
  );
}

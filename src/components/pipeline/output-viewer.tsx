"use client";

import type { PipelineStep, Review } from "@/types";

interface OutputViewerProps {
  step: PipelineStep | null;
  reviews: Review[];
}

export default function OutputViewer({ step, reviews }: OutputViewerProps) {
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
          <StatusBadge status={step.status} />
        </div>

        {step.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-300 text-sm">
            <strong>Error:</strong> {step.error}
          </div>
        )}

        {step.output && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
              Output
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">
                {step.output}
              </pre>
            </div>
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

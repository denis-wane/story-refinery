"use client";

import type { PipelineStep, Review } from "@/types";

interface StepTimelineProps {
  steps: PipelineStep[];
  reviews: Record<string, Review[]>;
  activeStepId?: string;
  onSelectStep: (stepId: string) => void;
  onAddReview: (stepId: string) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-600",
  running: "bg-blue-500 animate-pulse",
  completed: "bg-green-500",
  failed: "bg-red-500",
  review_pending: "bg-amber-500",
  skipped: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  running: "Running...",
  completed: "Completed",
  failed: "Failed",
  review_pending: "Awaiting Review",
  skipped: "Skipped",
};

export default function StepTimeline({
  steps,
  reviews,
  activeStepId,
  onSelectStep,
  onAddReview,
}: StepTimelineProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 px-1">
        Pipeline Steps
      </h3>
      {steps.map((step, i) => {
        const isActive = step.id === activeStepId;
        const stepReviews = reviews[step.id] || [];
        const hasReview = stepReviews.length > 0;

        return (
          <div key={step.id} className="relative">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gray-700" />
            )}

            <button
              onClick={() => onSelectStep(step.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                isActive
                  ? "bg-gray-800 ring-1 ring-blue-500/50"
                  : "hover:bg-gray-800/50"
              }`}
            >
              {/* Status dot */}
              <div className="mt-0.5 flex-shrink-0">
                <div className={`w-3.5 h-3.5 rounded-full ${statusColors[step.status]}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-200 truncate">
                    {step.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {statusLabels[step.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{step.agent}</p>

                {/* Review badge */}
                {hasReview && (
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-xs bg-blue-900/30 text-blue-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    {stepReviews.length} review{stepReviews.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </button>

            {/* Add review button for completed or review_pending steps */}
            {(step.status === "completed" || step.status === "review_pending") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddReview(step.id);
                }}
                className="absolute right-2 top-2 p-1 rounded text-gray-500 hover:text-blue-400 hover:bg-gray-700 transition-colors"
                title="Add review"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

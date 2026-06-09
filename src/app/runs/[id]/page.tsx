"use client";

import { useEffect, useState, useCallback, use } from "react";
import StepTimeline from "@/components/pipeline/step-timeline";
import OutputViewer from "@/components/pipeline/output-viewer";
import ReviewForm from "@/components/pipeline/review-form";
import type { PipelineRun, PipelineStep, Review } from "@/types";

interface RunData {
  run: PipelineRun;
  steps: PipelineStep[];
  reviews: Record<string, Review[]>;
}

export default function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<RunData | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [reviewStepId, setReviewStepId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/pipeline/${id}`);
      if (res.ok) {
        const d: RunData = await res.json();
        setData(d);
        // Auto-select the active step (first non-completed, or last)
        if (!activeStepId) {
          const active =
            d.steps.find(
              (s) =>
                s.status === "running" ||
                s.status === "review_pending" ||
                s.status === "pending"
            ) || d.steps[d.steps.length - 1];
          if (active) setActiveStepId(active.id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id, activeStepId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // SSE for real-time updates
  useEffect(() => {
    const eventSource = new EventSource(`/api/pipeline/${id}/events`);

    eventSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      // Refresh data on any event
      fetchData();
      // Auto-navigate to the active step
      if (parsed.step_id) {
        setActiveStepId(parsed.step_id);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [id, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Loading run...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Run not found
      </div>
    );
  }

  const { run, steps, reviews } = data;
  const activeStep = steps.find((s) => s.id === activeStepId) || null;
  const activeReviews = activeStepId ? reviews[activeStepId] || [] : [];
  const reviewStep = reviewStepId
    ? steps.find((s) => s.id === reviewStepId)
    : null;

  return (
    <div className="flex h-full">
      {/* Left panel: Pipeline timeline */}
      <div className="w-80 border-r border-gray-800 bg-gray-950 p-4 overflow-y-auto flex-shrink-0">
        {/* Run header */}
        <div className="mb-5 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                run.mode === "generate"
                  ? "bg-blue-900/30 text-blue-400"
                  : "bg-emerald-900/30 text-emerald-400"
              }`}
            >
              {run.mode}
            </span>
            <StatusBadge status={run.status} />
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">{run.input}</p>
          <p className="text-xs text-gray-600 mt-1">
            {new Date(run.created_at).toLocaleString()}
          </p>
        </div>

        <StepTimeline
          steps={steps}
          reviews={reviews}
          activeStepId={activeStepId || undefined}
          onSelectStep={setActiveStepId}
          onAddReview={setReviewStepId}
        />
      </div>

      {/* Right panel: Output viewer */}
      <div className="flex-1 bg-gray-950">
        <OutputViewer step={activeStep} reviews={activeReviews} />
      </div>

      {/* Review modal */}
      {reviewStep && (
        <ReviewForm
          stepId={reviewStep.id}
          runId={run.id}
          stepName={reviewStep.name}
          onSubmit={() => {
            setReviewStepId(null);
            fetchData();
          }}
          onCancel={() => setReviewStepId(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-gray-700 text-gray-300",
    running: "bg-blue-800/50 text-blue-300",
    paused: "bg-amber-800/50 text-amber-300",
    completed: "bg-green-800/50 text-green-300",
    failed: "bg-red-800/50 text-red-300",
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${styles[status] || ""}`}>
      {status}
    </span>
  );
}

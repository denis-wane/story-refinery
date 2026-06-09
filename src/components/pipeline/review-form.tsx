"use client";

import { useState } from "react";

interface ReviewFormProps {
  stepId: string;
  runId: string;
  stepName: string;
  onSubmit: (comments: string, approved: boolean) => void;
  onCancel: () => void;
}

export default function ReviewForm({
  stepId,
  runId,
  stepName,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(approved: boolean) {
    if (!comments.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/pipeline/${runId}/steps/${stepId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments, approved }),
      });

      if (res.ok) {
        onSubmit(comments, approved);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-lg shadow-2xl">
        <div className="p-5 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-200">
            Review: {stepName}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review the output and approve to continue, or request changes.
          </p>
        </div>

        <div className="p-5">
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add your review comments..."
            rows={5}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="p-5 border-t border-gray-700 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting || !comments.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Request Changes
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting || !comments.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Approve & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

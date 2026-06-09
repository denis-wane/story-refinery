"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GeneratePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/pipeline/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "generate", input: input.trim() }),
      });

      if (res.ok) {
        const run = await res.json();
        router.push(`/runs/${run.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Generate Stories</h1>
        <p className="text-gray-400 mt-1">
          Describe your feature, product, or idea. The pipeline will create
          structured user stories with acceptance criteria.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="input"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              What do you want to build?
            </label>
            <textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={12}
              placeholder="Describe your feature or product idea in detail. Include user roles, key capabilities, technical constraints, and anything else that would help generate complete user stories.

Example: We need a dashboard for project managers to track sprint progress. It should show burndown charts, story status distribution, blocked items with reasons, and team velocity trends. The dashboard should update in real-time and support filtering by team member, sprint, and project."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
            />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Pipeline Steps
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Step label="Analyze" />
              <Arrow />
              <Step label="Decompose" review />
              <Arrow />
              <Step label="Draft AC" review />
              <Arrow />
              <Step label="Test Specs" />
              <Arrow />
              <Step label="Review" review />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Steps marked with a dot pause for your review before continuing.
            </p>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || submitting}
            className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Starting pipeline..." : "Start Generation Pipeline"}
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

"use client";

import { useState, useMemo, useCallback } from "react";

interface ContentSection {
  id: string;
  heading: string;
  level: number; // 1 = #, 2 = ##, 3 = ###
  content: string;
  startLine: number;
}

interface InlineComment {
  sectionId: string;
  sectionHeading: string;
  comment: string;
}

interface InlineFeedbackProps {
  output: string;
  stepId: string;
  runId: string;
  stepName: string;
  onReviewSubmitted: () => void;
}

/**
 * Parse markdown output into sections based on headers.
 * Splits on ## and ### headers to create commentable sections.
 */
function parseIntoSections(output: string): ContentSection[] {
  const lines = output.split("\n");
  const sections: ContentSection[] = [];
  let currentSection: ContentSection | null = null;
  let sectionCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(#{1,3})\s+(.+)/);

    if (headerMatch) {
      // Save current section
      if (currentSection) {
        currentSection.content = currentSection.content.trim();
        sections.push(currentSection);
      }

      sectionCounter++;
      const level = headerMatch[1].length;
      currentSection = {
        id: `section-${sectionCounter}`,
        heading: headerMatch[2],
        level,
        content: line,
        startLine: i,
      };
    } else if (currentSection) {
      currentSection.content += "\n" + line;
    } else {
      // Content before any header — create a preamble section
      if (!currentSection) {
        sectionCounter++;
        currentSection = {
          id: `section-${sectionCounter}`,
          heading: "(Preamble)",
          level: 0,
          content: line,
          startLine: i,
        };
      }
    }
  }

  if (currentSection) {
    currentSection.content = currentSection.content.trim();
    sections.push(currentSection);
  }

  return sections;
}

export default function InlineFeedback({
  output,
  stepId,
  runId,
  stepName,
  onReviewSubmitted,
}: InlineFeedbackProps) {
  const sections = useMemo(() => parseIntoSections(output), [output]);
  const [comments, setComments] = useState<Map<string, InlineComment>>(
    new Map()
  );
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddComment = useCallback(
    (section: ContentSection) => {
      if (activeCommentId === section.id) {
        setActiveCommentId(null);
        setCommentText("");
        return;
      }
      setActiveCommentId(section.id);
      // Load existing comment if any
      const existing = comments.get(section.id);
      setCommentText(existing?.comment || "");
    },
    [activeCommentId, comments]
  );

  const handleSaveComment = useCallback(
    (section: ContentSection) => {
      if (!commentText.trim()) {
        // Remove comment if empty
        const updated = new Map(comments);
        updated.delete(section.id);
        setComments(updated);
      } else {
        const updated = new Map(comments);
        updated.set(section.id, {
          sectionId: section.id,
          sectionHeading: section.heading,
          comment: commentText.trim(),
        });
        setComments(updated);
      }
      setActiveCommentId(null);
      setCommentText("");
    },
    [commentText, comments]
  );

  const handleRemoveComment = useCallback(
    (sectionId: string) => {
      const updated = new Map(comments);
      updated.delete(sectionId);
      setComments(updated);
    },
    [comments]
  );

  async function handleSubmitReview(approved: boolean) {
    const commentList = Array.from(comments.values());
    if (commentList.length === 0) return;

    setSubmitting(true);

    // Build structured review from inline comments
    const reviewLines: string[] = [];
    if (!approved) {
      reviewLines.push("# Inline Feedback — Changes Requested", "");
    } else {
      reviewLines.push("# Inline Feedback — Approved with Notes", "");
    }

    for (const c of commentList) {
      reviewLines.push(`## Re: ${c.sectionHeading}`, c.comment, "");
    }

    const reviewText = reviewLines.join("\n");

    try {
      const res = await fetch(`/api/pipeline/${runId}/steps/${stepId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: reviewText, approved }),
      });

      if (res.ok) {
        setComments(new Map());
        onReviewSubmitted();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const commentCount = comments.size;

  return (
    <div>
      {/* Toolbar */}
      {commentCount > 0 && (
        <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {commentCount} inline comment{commentCount !== 1 ? "s" : ""} on{" "}
            {stepName}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleSubmitReview(false)}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 disabled:opacity-50 transition-colors"
            >
              Request Changes
            </button>
            <button
              onClick={() => handleSubmitReview(true)}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-50 transition-colors"
            >
              Approve with Notes
            </button>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="divide-y divide-gray-800/50">
        {sections.map((section) => {
          const hasComment = comments.has(section.id);
          const isActive = activeCommentId === section.id;

          return (
            <div
              key={section.id}
              className={`group relative ${
                hasComment ? "bg-blue-900/5" : ""
              }`}
            >
              {/* Comment indicator */}
              {hasComment && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
              )}

              {/* Content */}
              <div className="px-4 py-2">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">
                  {section.content}
                </pre>
              </div>

              {/* Add comment button (visible on hover) */}
              <button
                onClick={() => handleAddComment(section)}
                className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-600/30 text-blue-400"
                    : hasComment
                    ? "bg-blue-600/20 text-blue-400 opacity-80"
                    : "opacity-0 group-hover:opacity-100 bg-gray-700/50 text-gray-400 hover:text-blue-400"
                }`}
                title={hasComment ? "Edit comment" : "Add comment"}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </button>

              {/* Existing comment display */}
              {hasComment && !isActive && (
                <div className="mx-4 mb-2 p-2 rounded-lg bg-blue-900/20 border border-blue-800/30 flex items-start gap-2">
                  <p className="text-xs text-blue-300 flex-1">
                    {comments.get(section.id)!.comment}
                  </p>
                  <button
                    onClick={() => handleRemoveComment(section.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                    title="Remove comment"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Comment input */}
              {isActive && (
                <div className="mx-4 mb-2 p-3 rounded-lg bg-gray-800 border border-gray-600">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add your feedback on this section..."
                    rows={3}
                    autoFocus
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setActiveCommentId(null);
                        setCommentText("");
                      }}
                      className="px-3 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveComment(section)}
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                    >
                      {commentText.trim() ? "Save" : "Remove"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

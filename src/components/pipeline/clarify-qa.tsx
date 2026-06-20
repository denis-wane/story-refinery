"use client";

import { useState, useMemo } from "react";

interface ParsedQuestion {
  id: string;
  priority: "critical" | "important" | "nice-to-have";
  title: string;
  body: string;
  whyItMatters: string;
  defaultAssumption: string;
  answer: string;
}

interface ClarifyQAProps {
  clarifierOutput: string;
  stepId: string;
  runId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Parse the clarifier agent's markdown output into structured questions.
 */
function parseClarifierOutput(output: string): {
  questions: ParsedQuestion[];
  assumptions: string[];
} {
  const questions: ParsedQuestion[] = [];
  const assumptions: string[] = [];

  const lines = output.split("\n");
  let currentPriority: ParsedQuestion["priority"] | null = null;
  let currentQuestion: Partial<ParsedQuestion> | null = null;
  let inAssumptions = false;
  let questionCounter = 0;

  function finishQuestion() {
    if (currentQuestion?.title) {
      questionCounter++;
      questions.push({
        id: `q-${questionCounter}`,
        priority: currentQuestion.priority || "nice-to-have",
        title: currentQuestion.title,
        body: (currentQuestion.body || "").trim(),
        whyItMatters: (currentQuestion.whyItMatters || "").trim(),
        defaultAssumption: (currentQuestion.defaultAssumption || "").trim(),
        answer: "",
      });
    }
    currentQuestion = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect priority sections
    if (/^##\s+Critical/i.test(trimmed)) {
      finishQuestion();
      currentPriority = "critical";
      inAssumptions = false;
      continue;
    }
    if (/^##\s+Important/i.test(trimmed)) {
      finishQuestion();
      currentPriority = "important";
      inAssumptions = false;
      continue;
    }
    if (/^##\s+Nice to Have/i.test(trimmed)) {
      finishQuestion();
      currentPriority = "nice-to-have";
      inAssumptions = false;
      continue;
    }
    if (/^##\s+Assumptions/i.test(trimmed)) {
      finishQuestion();
      inAssumptions = true;
      currentPriority = null;
      continue;
    }
    if (/^##\s/.test(trimmed)) {
      // Some other section header
      finishQuestion();
      inAssumptions = false;
      continue;
    }

    // Parse assumptions
    if (inAssumptions) {
      const assumptionMatch = trimmed.match(/^\d+\.\s+(.+)/);
      if (assumptionMatch) {
        assumptions.push(assumptionMatch[1]);
      }
      continue;
    }

    // Parse numbered questions
    if (currentPriority) {
      // New question: starts with "N. **Title**"
      const questionMatch = trimmed.match(/^\d+\.\s+\*\*(.+?)\*\*/);
      if (questionMatch) {
        finishQuestion();
        currentQuestion = {
          priority: currentPriority,
          title: questionMatch[1],
          body: "",
          whyItMatters: "",
          defaultAssumption: "",
        };
        // Check if there's text after the bold title on the same line
        const afterTitle = trimmed.replace(/^\d+\.\s+\*\*.+?\*\*\s*/, "");
        if (afterTitle) {
          currentQuestion.body = afterTitle;
        }
        continue;
      }

      // Within a question: parse sub-fields
      if (currentQuestion) {
        if (/why it matters/i.test(trimmed)) {
          const value = trimmed.replace(/^-?\s*_?Why it matters:?_?\s*/i, "");
          currentQuestion.whyItMatters = value;
        } else if (/default assumption/i.test(trimmed)) {
          const value = trimmed.replace(
            /^-?\s*_?Default assumption[^:]*:?_?\s*/i,
            ""
          );
          currentQuestion.defaultAssumption = value;
        } else if (trimmed && !trimmed.startsWith("-")) {
          // Additional body text for the question
          currentQuestion.body =
            (currentQuestion.body || "") + (currentQuestion.body ? " " : "") + trimmed;
        } else if (trimmed.startsWith("-") && !/why it matters/i.test(trimmed) && !/default/i.test(trimmed)) {
          // Other bullet points are part of the body
          currentQuestion.body =
            (currentQuestion.body || "") + "\n" + trimmed;
        }
      }
    }
  }
  finishQuestion();

  return { questions, assumptions };
}

const priorityConfig = {
  critical: {
    label: "Critical",
    bg: "bg-red-900/20",
    border: "border-red-800/40",
    badge: "bg-red-800/50 text-red-300",
    dot: "bg-red-500",
  },
  important: {
    label: "Important",
    bg: "bg-amber-900/20",
    border: "border-amber-800/40",
    badge: "bg-amber-800/50 text-amber-300",
    dot: "bg-amber-500",
  },
  "nice-to-have": {
    label: "Nice to Have",
    bg: "bg-blue-900/20",
    border: "border-blue-800/40",
    badge: "bg-blue-800/50 text-blue-300",
    dot: "bg-blue-500",
  },
};

export default function ClarifyQA({
  clarifierOutput,
  stepId,
  runId,
  onSubmit,
  onCancel,
}: ClarifyQAProps) {
  const { questions: initialQuestions, assumptions } = useMemo(
    () => parseClarifierOutput(clarifierOutput),
    [clarifierOutput]
  );

  const [questions, setQuestions] = useState<ParsedQuestion[]>(initialQuestions);
  const [submitting, setSubmitting] = useState(false);
  const [useDefaultsForEmpty, setUseDefaultsForEmpty] = useState(true);

  function updateAnswer(id: string, answer: string) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, answer } : q))
    );
  }

  function fillAllDefaults() {
    setQuestions((prev) =>
      prev.map((q) =>
        q.answer.trim() ? q : { ...q, answer: q.defaultAssumption }
      )
    );
  }

  async function handleSubmit() {
    setSubmitting(true);

    // Build structured answers as markdown
    const answerLines: string[] = ["# Stakeholder Answers", ""];
    const grouped = {
      critical: questions.filter((q) => q.priority === "critical"),
      important: questions.filter((q) => q.priority === "important"),
      "nice-to-have": questions.filter((q) => q.priority === "nice-to-have"),
    };

    for (const [priority, qs] of Object.entries(grouped)) {
      if (qs.length === 0) continue;
      const label = priorityConfig[priority as keyof typeof priorityConfig].label;
      answerLines.push(`## ${label}`, "");
      for (const q of qs) {
        const answer =
          q.answer.trim() || (useDefaultsForEmpty ? q.defaultAssumption : "");
        const source = q.answer.trim() ? "Stakeholder" : "Default assumption";
        answerLines.push(
          `**Q: ${q.title}**`,
          `**A:** ${answer}`,
          `_(${source})_`,
          ""
        );
      }
    }

    if (assumptions.length > 0) {
      answerLines.push("## Assumptions Confirmed", "");
      for (const a of assumptions) {
        answerLines.push(`- ${a} — **Confirmed**`);
      }
      answerLines.push("");
    }

    const comments = answerLines.join("\n");

    try {
      const res = await fetch(`/api/pipeline/${runId}/steps/${stepId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments, approved: true }),
      });

      if (res.ok) {
        onSubmit();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const answeredCount = questions.filter((q) => q.answer.trim()).length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-200">
            Clarifying Questions
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Answer the questions below to guide story decomposition.
            Unanswered questions will use their default assumptions.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-gray-400">
              {answeredCount}/{questions.length} answered
            </span>
            <button
              onClick={fillAllDefaults}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Fill remaining with defaults
            </button>
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {(["critical", "important", "nice-to-have"] as const).map(
            (priority) => {
              const qs = questions.filter((q) => q.priority === priority);
              if (qs.length === 0) return null;
              const config = priorityConfig[priority];

              return (
                <div key={priority}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                      {config.label}
                    </h3>
                    <span className="text-xs text-gray-500">
                      ({qs.length})
                    </span>
                  </div>

                  <div className="space-y-3">
                    {qs.map((q) => (
                      <div
                        key={q.id}
                        className={`rounded-lg border p-4 ${config.bg} ${config.border}`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${config.badge}`}
                          >
                            {config.label}
                          </span>
                          <h4 className="text-sm font-medium text-gray-200">
                            {q.title}
                          </h4>
                        </div>

                        {q.body && (
                          <p className="text-sm text-gray-400 mb-2 ml-1">
                            {q.body}
                          </p>
                        )}

                        {q.whyItMatters && (
                          <p className="text-xs text-gray-500 mb-2 ml-1 italic">
                            Why it matters: {q.whyItMatters}
                          </p>
                        )}

                        <div className="mt-3">
                          <textarea
                            value={q.answer}
                            onChange={(e) => updateAnswer(q.id, e.target.value)}
                            placeholder={
                              q.defaultAssumption
                                ? `Default: ${q.defaultAssumption}`
                                : "Your answer..."
                            }
                            rows={2}
                            className="w-full bg-gray-800/80 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                          {q.defaultAssumption && !q.answer.trim() && (
                            <button
                              onClick={() =>
                                updateAnswer(q.id, q.defaultAssumption)
                              }
                              className="mt-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            >
                              Use default: {q.defaultAssumption}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          )}

          {/* Assumptions section */}
          {assumptions.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                Assumptions Being Made
              </h3>
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                <p className="text-xs text-gray-500 mb-2">
                  These assumptions will be confirmed unless you flag them.
                </p>
                <ul className="space-y-1">
                  {assumptions.map((a, i) => (
                    <li key={i} className="text-sm text-gray-300">
                      <span className="text-gray-500 mr-2">{i + 1}.</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={useDefaultsForEmpty}
                onChange={(e) => setUseDefaultsForEmpty(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
              />
              Use defaults for unanswered
            </label>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Answers & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

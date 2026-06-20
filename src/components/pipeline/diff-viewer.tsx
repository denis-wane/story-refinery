"use client";

import { useState, useMemo } from "react";
import type { StepRevision } from "@/types";

interface DiffViewerProps {
  currentOutput: string;
  previousOutputs: StepRevision[];
}

interface DiffLine {
  type: "same" | "added" | "removed";
  content: string;
  lineNum?: number;
}

/**
 * Simple line-by-line diff using the LCS (longest common subsequence) approach.
 * Good enough for comparing revision outputs.
 */
function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  // Build LCS table
  const m = oldLines.length;
  const n = newLines.length;

  // For very large outputs, use a simpler heuristic
  if (m * n > 1_000_000) {
    return simpleLineDiff(oldLines, newLines);
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to get the diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  const stack: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: "same", content: newLines[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", content: newLines[j - 1] });
      j--;
    } else {
      stack.push({ type: "removed", content: oldLines[i - 1] });
      i--;
    }
  }

  // Reverse the stack (we built it backwards)
  while (stack.length > 0) {
    result.push(stack.pop()!);
  }

  return result;
}

/**
 * Simpler diff for very large files — just mark removed/added blocks
 */
function simpleLineDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  const result: DiffLine[] = [];

  // Lines only in old
  for (const line of oldLines) {
    if (!newSet.has(line)) {
      result.push({ type: "removed", content: line });
    }
  }

  // All new lines, marking added ones
  for (const line of newLines) {
    if (oldSet.has(line)) {
      result.push({ type: "same", content: line });
    } else {
      result.push({ type: "added", content: line });
    }
  }

  return result;
}

const lineStyles: Record<DiffLine["type"], string> = {
  same: "text-gray-400",
  added: "bg-green-900/30 text-green-300",
  removed: "bg-red-900/30 text-red-400 line-through",
};

const linePrefix: Record<DiffLine["type"], string> = {
  same: "  ",
  added: "+ ",
  removed: "- ",
};

export default function DiffViewer({
  currentOutput,
  previousOutputs,
}: DiffViewerProps) {
  const [selectedRevision, setSelectedRevision] = useState<number>(
    previousOutputs.length > 0
      ? previousOutputs[previousOutputs.length - 1].revision
      : 0
  );
  const [showUnchanged, setShowUnchanged] = useState(false);

  const previousOutput = useMemo(() => {
    const rev = previousOutputs.find((r) => r.revision === selectedRevision);
    return rev?.output || "";
  }, [previousOutputs, selectedRevision]);

  const diffLines = useMemo(
    () => computeDiff(previousOutput, currentOutput),
    [previousOutput, currentOutput]
  );

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const line of diffLines) {
      if (line.type === "added") added++;
      if (line.type === "removed") removed++;
    }
    return { added, removed };
  }, [diffLines]);

  // Filter to only changed lines when not showing unchanged
  const visibleLines = useMemo(() => {
    if (showUnchanged) return diffLines;

    const result: DiffLine[] = [];
    const CONTEXT = 3; // show N lines of context around changes

    for (let i = 0; i < diffLines.length; i++) {
      const line = diffLines[i];
      if (line.type !== "same") {
        // Include context lines before
        for (let j = Math.max(0, i - CONTEXT); j < i; j++) {
          if (!result.includes(diffLines[j])) {
            result.push(diffLines[j]);
          }
        }
        result.push(line);
        // Include context lines after
        for (let j = i + 1; j <= Math.min(diffLines.length - 1, i + CONTEXT); j++) {
          if (!result.includes(diffLines[j])) {
            result.push(diffLines[j]);
          }
        }
      }
    }

    return result;
  }, [diffLines, showUnchanged]);

  if (previousOutputs.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Changes from Previous Revision
        </h3>
        <div className="flex items-center gap-3">
          {previousOutputs.length > 1 && (
            <select
              value={selectedRevision}
              onChange={(e) => setSelectedRevision(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300"
            >
              {previousOutputs.map((r) => (
                <option key={r.revision} value={r.revision}>
                  Revision {r.revision}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowUnchanged(!showUnchanged)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showUnchanged ? "Hide unchanged" : "Show all"}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-2 text-xs">
        <span className="text-green-400">+{stats.added} added</span>
        <span className="text-red-400">-{stats.removed} removed</span>
        <span className="text-gray-500">
          comparing revision {selectedRevision} → current
        </span>
      </div>

      {/* Diff content */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <pre className="text-xs font-mono leading-relaxed overflow-x-auto max-h-96 overflow-y-auto">
          {visibleLines.map((line, i) => (
            <div
              key={i}
              className={`px-3 py-0.5 ${lineStyles[line.type]} ${
                line.type !== "same" ? "border-l-2" : ""
              } ${
                line.type === "added"
                  ? "border-l-green-500"
                  : line.type === "removed"
                  ? "border-l-red-500"
                  : ""
              }`}
            >
              <span className="select-none text-gray-600 mr-2">
                {linePrefix[line.type]}
              </span>
              {line.content || " "}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

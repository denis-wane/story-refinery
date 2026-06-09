"use client";

import { useEffect, useState } from "react";

interface OutputFile {
  filename: string;
  size: number;
  modified: string;
}

interface FileBrowserProps {
  runId: string;
  runStatus: string;
}

export default function FileBrowser({ runId, runStatus }: FileBrowserProps) {
  const [files, setFiles] = useState<OutputFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [runId, runStatus]);

  async function fetchFiles() {
    try {
      const res = await fetch(`/api/pipeline/${runId}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch {
      // Silently ignore — no output directory configured
    }
  }

  async function openFile(filename: string) {
    setSelectedFile(filename);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/pipeline/${runId}/files/${encodeURIComponent(filename)}`
      );
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
      }
    } finally {
      setLoading(false);
    }
  }

  if (files.length === 0) return null;

  return (
    <div className="border-t border-gray-800 mt-6 pt-6">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
        Output Files
      </h3>

      <div className="space-y-1">
        {files.map((file) => (
          <button
            key={file.filename}
            onClick={() => openFile(file.filename)}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
              selectedFile === file.filename
                ? "bg-gray-800 ring-1 ring-blue-500/30"
                : "hover:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <svg
                className="w-4 h-4 text-gray-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm text-gray-300 truncate">
                {file.filename}
              </span>
            </div>
            <span className="text-xs text-gray-600 flex-shrink-0 ml-2">
              {formatSize(file.size)}
            </span>
          </button>
        ))}
      </div>

      {/* File content viewer */}
      {selectedFile && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{selectedFile}</span>
            <button
              onClick={() => {
                setSelectedFile(null);
                setFileContent(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Close
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 max-h-96 overflow-y-auto">
            {loading ? (
              <span className="text-sm text-gray-500">Loading...</span>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">
                {fileContent}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

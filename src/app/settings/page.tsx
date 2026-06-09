"use client";

import { useState, useEffect } from "react";

interface ConfigState {
  jira_url: string;
  jira_email: string;
  jira_api_key: string;
  jira_project_key: string;
  output_directory: string;
  anthropic_api_key: string;
}

const defaultConfig: ConfigState = {
  jira_url: "",
  jira_email: "",
  jira_api_key: "",
  jira_project_key: "",
  output_directory: "",
  anthropic_api_key: "",
};

export default function SettingsPage() {
  const [config, setConfig] = useState<ConfigState>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function testJiraConnection() {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/jira/test", { method: "POST" });
      const data = await res.json();
      setTestResult(data.ok ? "Connection successful" : `Failed: ${data.error}`);
    } catch {
      setTestResult("Connection test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-400 mt-1">
          Configure Jira connection, output directory, and API keys.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Anthropic API */}
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            Claude API
          </h2>
          <div className="space-y-4">
            <Field
              label="Anthropic API Key"
              type="password"
              value={config.anthropic_api_key}
              onChange={(v) => setConfig({ ...config, anthropic_api_key: v })}
              placeholder="sk-ant-..."
              hint="Required. Powers the agent pipeline."
            />
          </div>
        </section>

        {/* Jira Configuration */}
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            Jira Connection
          </h2>
          <div className="space-y-4">
            <Field
              label="Jira URL"
              value={config.jira_url}
              onChange={(v) => setConfig({ ...config, jira_url: v })}
              placeholder="https://your-org.atlassian.net"
            />
            <Field
              label="Email"
              type="email"
              value={config.jira_email}
              onChange={(v) => setConfig({ ...config, jira_email: v })}
              placeholder="you@example.com"
            />
            <Field
              label="API Token"
              type="password"
              value={config.jira_api_key}
              onChange={(v) => setConfig({ ...config, jira_api_key: v })}
              placeholder="Jira API token"
              hint="Generate at id.atlassian.com/manage-profile/security/api-tokens"
            />
            <Field
              label="Default Project Key"
              value={config.jira_project_key}
              onChange={(v) => setConfig({ ...config, jira_project_key: v })}
              placeholder="PROJ"
            />
            <button
              type="button"
              onClick={testJiraConnection}
              disabled={testing || !config.jira_url}
              className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {testing ? "Testing..." : "Test Connection"}
            </button>
            {testResult && (
              <p
                className={`text-sm ${
                  testResult.startsWith("Connection successful")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {testResult}
              </p>
            )}
          </div>
        </section>

        {/* Output Configuration */}
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            Output Directory
          </h2>
          <div className="space-y-4">
            <Field
              label="Output Path"
              value={config.output_directory}
              onChange={(v) => setConfig({ ...config, output_directory: v })}
              placeholder="/path/to/output"
              hint="Where generated stories and artifacts are written. Each run creates a subdirectory."
            />
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && (
            <span className="text-sm text-green-400">Settings saved</span>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

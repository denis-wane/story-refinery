"use client";

import { useState, useEffect } from "react";
import type { ProviderType } from "@/types";

interface ConfigState {
  provider: ProviderType;
  anthropic_api_key: string;
  model: string;
  aws_region: string;
  aws_access_key_id: string;
  aws_secret_access_key: string;
  bedrock_model_id: string;
  jira_url: string;
  jira_email: string;
  jira_api_key: string;
  jira_project_key: string;
  output_directory: string;
}

const defaultConfig: ConfigState = {
  provider: "subscription",
  anthropic_api_key: "",
  model: "claude-sonnet-4-20250514",
  aws_region: "",
  aws_access_key_id: "",
  aws_secret_access_key: "",
  bedrock_model_id: "anthropic.claude-sonnet-4-20250514-v1:0",
  jira_url: "",
  jira_email: "",
  jira_api_key: "",
  jira_project_key: "",
  output_directory: "",
};

const providers: { value: ProviderType; label: string; description: string }[] = [
  {
    value: "subscription",
    label: "Claude Subscription",
    description: "Use your Claude Pro/Team/Enterprise subscription via Claude Code CLI. No API key needed.",
  },
  {
    value: "api_key",
    label: "Anthropic API Key",
    description: "Direct API access with an Anthropic API key. Pay-per-use billing.",
  },
  {
    value: "bedrock",
    label: "AWS Bedrock",
    description: "Route through AWS Bedrock. Requires AWS credentials or IAM role.",
  },
];

export default function SettingsPage() {
  const [config, setConfig] = useState<ConfigState>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => setConfig({ ...defaultConfig, ...data }))
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
      setTestResult(data.ok ? `Connected as ${data.user}` : `Failed: ${data.error}`);
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
          Configure AI provider, Jira connection, and output directory.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Provider Selection */}
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            AI Provider
          </h2>
          <div className="space-y-3">
            {providers.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setConfig({ ...config, provider: p.value })}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  config.provider === p.value
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-700 bg-gray-900 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      config.provider === p.value
                        ? "border-blue-500"
                        : "border-gray-600"
                    }`}
                  >
                    {config.provider === p.value && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-200">
                      {p.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Provider-specific config */}
        {config.provider === "subscription" && (
          <section className="p-4 rounded-lg bg-gray-900 border border-gray-800">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-300">
                  Uses Claude Code CLI with your subscription. Make sure Claude Code is
                  installed and you&apos;re logged in.
                </p>
                <pre className="mt-2 text-xs text-gray-500 bg-gray-950 rounded p-2">
                  npm install -g @anthropic-ai/claude-code{"\n"}claude login
                </pre>
              </div>
            </div>
            <div className="mt-4">
              <Field
                label="Model"
                value={config.model}
                onChange={(v) => setConfig({ ...config, model: v })}
                placeholder="claude-sonnet-4-20250514"
                hint="Claude model to use for agent steps."
              />
            </div>
          </section>
        )}

        {config.provider === "api_key" && (
          <section>
            <div className="space-y-4">
              <Field
                label="Anthropic API Key"
                type="password"
                value={config.anthropic_api_key}
                onChange={(v) => setConfig({ ...config, anthropic_api_key: v })}
                placeholder="sk-ant-..."
                hint="Get one at console.anthropic.com"
              />
              <Field
                label="Model"
                value={config.model}
                onChange={(v) => setConfig({ ...config, model: v })}
                placeholder="claude-sonnet-4-20250514"
              />
            </div>
          </section>
        )}

        {config.provider === "bedrock" && (
          <section>
            <div className="space-y-4">
              <Field
                label="AWS Region"
                value={config.aws_region}
                onChange={(v) => setConfig({ ...config, aws_region: v })}
                placeholder="us-east-1"
                hint="AWS region where Bedrock is enabled."
              />
              <Field
                label="AWS Access Key ID"
                type="password"
                value={config.aws_access_key_id}
                onChange={(v) => setConfig({ ...config, aws_access_key_id: v })}
                placeholder="AKIA..."
                hint="Optional if using IAM role or environment credentials."
              />
              <Field
                label="AWS Secret Access Key"
                type="password"
                value={config.aws_secret_access_key}
                onChange={(v) =>
                  setConfig({ ...config, aws_secret_access_key: v })
                }
                placeholder="Secret key"
              />
              <Field
                label="Bedrock Model ID"
                value={config.bedrock_model_id}
                onChange={(v) => setConfig({ ...config, bedrock_model_id: v })}
                placeholder="anthropic.claude-sonnet-4-20250514-v1:0"
                hint="Full Bedrock model identifier."
              />
            </div>
          </section>
        )}

        {/* Jira Configuration */}
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-1">
            Jira Connection
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Optional. Required only for Refine mode with Jira source.
          </p>
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
                  testResult.startsWith("Connected")
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
              placeholder="./output"
              hint="Where generated stories and artifacts are written. Relative to project root or absolute path."
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

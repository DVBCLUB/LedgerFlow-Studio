import { listSoftwareFactoryConnectors, type SoftwareFactoryConnectorProfile } from "./softwareFactoryConnectorCatalog";

export type SoftwareFactoryConnectorConfigState = "configured" | "missing" | "not_required";

export interface SoftwareFactoryConnectorConfigCheck {
  id: string;
  label: string;
  state: SoftwareFactoryConnectorConfigState;
  envKeys: string[];
  detail: string;
}

const connectorEnvKeys: Record<string, string[]> = {
  "openai-api": ["OPENAI_API_KEY"],
  "google-gemini": ["GOOGLE_AI_API_KEY", "GEMINI_API_KEY"],
  "anthropic-claude": ["ANTHROPIC_API_KEY"],
  mistral: ["MISTRAL_API_KEY"],
  cohere: ["COHERE_API_KEY"],
  perplexity: ["PERPLEXITY_API_KEY"],
  huggingface: ["HUGGINGFACE_TOKEN", "HF_TOKEN"],
  "local-ollama": ["OLLAMA_BASE_URL"],
  "github-copilot": ["GITHUB_TOKEN"],
  codex: ["OPENAI_API_KEY", "GITHUB_TOKEN"],
  "claude-code": ["ANTHROPIC_API_KEY"],
  cursor: ["CURSOR_WORKSPACE_PATH"],
  vscode: ["SOFTWARE_FACTORY_WORKSPACE"],
  antigravity: ["ANTIGRAVITY_WORKSPACE_PATH"],
  windsurf: ["WINDSURF_WORKSPACE_PATH"],
  github: ["GITHUB_TOKEN"],
  "github-actions": ["GITHUB_TOKEN"],
  "local-shell": [],
};

function hasAnyEnv(keys: string[]) {
  return keys.length === 0 || keys.some((key) => Boolean(process.env[key]));
}

function describeConfig(connector: SoftwareFactoryConnectorProfile, envKeys: string[]) {
  if (envKeys.length === 0) return "No private key required for the local allowlisted route.";
  if (hasAnyEnv(envKeys)) return `${connector.label} has at least one configured environment key.`;
  return `${connector.label} needs one of: ${envKeys.join(", ")}.`;
}

export function listSoftwareFactoryConnectorConfigChecks(): SoftwareFactoryConnectorConfigCheck[] {
  return listSoftwareFactoryConnectors().map((connector) => {
    const envKeys = connectorEnvKeys[connector.id] || [];
    const state: SoftwareFactoryConnectorConfigState = envKeys.length === 0 ? "not_required" : hasAnyEnv(envKeys) ? "configured" : "missing";
    return {
      id: connector.id,
      label: connector.label,
      state,
      envKeys,
      detail: describeConfig(connector, envKeys),
    };
  });
}

export function getSoftwareFactoryConnectorConfigStats() {
  const checks = listSoftwareFactoryConnectorConfigChecks();
  return {
    total: checks.length,
    configured: checks.filter((item) => item.state === "configured").length,
    missing: checks.filter((item) => item.state === "missing").length,
    notRequired: checks.filter((item) => item.state === "not_required").length,
  };
}

export function getSoftwareFactoryConnectorEnvTemplate() {
  const uniqueKeys = Array.from(new Set(Object.values(connectorEnvKeys).flat())).sort();
  return uniqueKeys.map((key) => `${key}=`).join("\n");
}

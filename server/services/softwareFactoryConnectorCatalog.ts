export type SoftwareFactoryConnectorCategory = "ai_platform" | "ai_agent" | "ide" | "repo" | "local_runtime";
export type SoftwareFactoryConnectorStatus = "ready" | "needs_config" | "planned";

export interface SoftwareFactoryConnectorProfile {
  id: string;
  label: string;
  category: SoftwareFactoryConnectorCategory;
  status: SoftwareFactoryConnectorStatus;
  officialRoute: string;
  supportedWork: string[];
  reviewRequired: boolean;
  notes: string;
}

const connectors: SoftwareFactoryConnectorProfile[] = [
  { id: "openai-api", label: "OpenAI API", category: "ai_platform", status: "needs_config", officialRoute: "API key / project connector", supportedWork: ["planning", "coding", "qa", "media", "launch"], reviewRequired: false, notes: "Primary structured model route for agent planning and generation." },
  { id: "google-gemini", label: "Google Gemini / AI Studio", category: "ai_platform", status: "needs_config", officialRoute: "Google AI API key", supportedWork: ["planning", "coding", "qa", "media", "launch"], reviewRequired: false, notes: "Model and multimodal route for product, code and content tasks." },
  { id: "anthropic-claude", label: "Anthropic Claude", category: "ai_platform", status: "needs_config", officialRoute: "Anthropic API key", supportedWork: ["planning", "coding", "qa"], reviewRequired: false, notes: "Reasoning, code review and long-context analysis route." },
  { id: "mistral", label: "Mistral AI", category: "ai_platform", status: "planned", officialRoute: "Mistral API key", supportedWork: ["planning", "coding", "qa"], reviewRequired: false, notes: "Secondary text and code generation route." },
  { id: "cohere", label: "Cohere", category: "ai_platform", status: "planned", officialRoute: "Cohere API key", supportedWork: ["planning", "search", "qa"], reviewRequired: false, notes: "Retrieval, classification and enterprise text workflow route." },
  { id: "perplexity", label: "Perplexity", category: "ai_platform", status: "planned", officialRoute: "Perplexity API key", supportedWork: ["research", "planning", "qa"], reviewRequired: true, notes: "Research route with citation-oriented output." },
  { id: "huggingface", label: "Hugging Face", category: "ai_platform", status: "planned", officialRoute: "Hugging Face token", supportedWork: ["media", "model", "qa"], reviewRequired: true, notes: "Open model, dataset and inference route." },
  { id: "local-ollama", label: "Ollama / Local Models", category: "local_runtime", status: "planned", officialRoute: "Local endpoint", supportedWork: ["planning", "coding", "qa"], reviewRequired: false, notes: "Local model route for offline or private workspace tasks." },
  { id: "github-copilot", label: "GitHub Copilot", category: "ai_agent", status: "planned", officialRoute: "GitHub account integration", supportedWork: ["coding", "qa"], reviewRequired: true, notes: "IDE assistant route through approved GitHub workspace use." },
  { id: "codex", label: "Codex", category: "ai_agent", status: "planned", officialRoute: "OpenAI / GitHub workflow", supportedWork: ["coding", "qa", "review"], reviewRequired: true, notes: "Code task agent route for branch, diff and PR workflows." },
  { id: "claude-code", label: "Claude Code", category: "ai_agent", status: "needs_config", officialRoute: "CLI / workspace connector", supportedWork: ["coding", "qa", "review"], reviewRequired: true, notes: "Code agent route for repository tasks and review loops." },
  { id: "cursor", label: "Cursor", category: "ide", status: "needs_config", officialRoute: "IDE workspace", supportedWork: ["coding", "qa", "review"], reviewRequired: true, notes: "IDE route for code generation, edits and local review." },
  { id: "vscode", label: "VS Code", category: "ide", status: "needs_config", officialRoute: "Workspace runner", supportedWork: ["coding", "qa", "build"], reviewRequired: false, notes: "Local workspace route for scripts, tests and builds." },
  { id: "antigravity", label: "Google Antigravity", category: "ide", status: "planned", officialRoute: "IDE workspace", supportedWork: ["coding", "qa", "review"], reviewRequired: true, notes: "Agentic IDE route for repository task execution." },
  { id: "windsurf", label: "Windsurf", category: "ide", status: "planned", officialRoute: "IDE workspace", supportedWork: ["coding", "qa", "review"], reviewRequired: true, notes: "Agentic IDE route for code edits and review." },
  { id: "github", label: "GitHub", category: "repo", status: "ready", officialRoute: "GitHub App connector", supportedWork: ["repo", "branch", "pull_request", "review"], reviewRequired: true, notes: "Repository, branch, PR and code review route." },
  { id: "github-actions", label: "GitHub Actions", category: "repo", status: "planned", officialRoute: "Repository workflow", supportedWork: ["test", "build", "release"], reviewRequired: true, notes: "CI workflow route for checks and build artifacts." },
  { id: "local-shell", label: "Local Command Runner", category: "local_runtime", status: "ready", officialRoute: "Allowlisted local commands", supportedWork: ["typecheck", "lint", "test", "build"], reviewRequired: false, notes: "Local command runner with a fixed command catalog." },
];

export function listSoftwareFactoryConnectors() {
  return connectors;
}

export function getSoftwareFactoryConnectorStats() {
  return {
    total: connectors.length,
    ready: connectors.filter((item) => item.status === "ready").length,
    needsConfig: connectors.filter((item) => item.status === "needs_config").length,
    planned: connectors.filter((item) => item.status === "planned").length,
    aiPlatforms: connectors.filter((item) => item.category === "ai_platform").length,
    aiAgents: connectors.filter((item) => item.category === "ai_agent").length,
    ides: connectors.filter((item) => item.category === "ide").length,
    repo: connectors.filter((item) => item.category === "repo").length,
    localRuntime: connectors.filter((item) => item.category === "local_runtime").length,
  };
}

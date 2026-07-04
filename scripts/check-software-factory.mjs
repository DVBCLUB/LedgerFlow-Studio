import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  '.env.software-factory.example',
  'docs/software-factory-connectors.md',
  'server/software-factory-daemon.ts',
  'server/services/softwareFactoryService.ts',
  'server/services/softwareFactoryRoutes.ts',
  'server/services/softwareFactoryExecutionService.ts',
  'server/services/softwareFactoryProviderRuntime.ts',
  'server/services/softwareFactoryConnectorCatalog.ts',
  'server/services/softwareFactoryConnectorConfig.ts',
  'server/services/softwareFactoryAssetService.ts',
  'server/services/softwareFactoryCommandRunner.ts',
  'server/services/softwareFactoryAuditLogService.ts',
  'server/services/softwareFactoryHealthService.ts',
  'src/modules/ai-nhan-su/FactoryBackendRuntimePanel.tsx',
  'src/modules/ai-nhan-su/FactoryExecutionDecisionPanel.tsx',
  'src/modules/ai-nhan-su/FactoryCommandRunnerPanel.tsx',
  'src/modules/ai-nhan-su/FactoryAuditLogPanel.tsx',
  'src/modules/ai-nhan-su/FactoryHealthSummaryPanel.tsx',
  'src/modules/ai-nhan-su/FactoryConnectorMatrixPanel.tsx',
  'src/modules/ai-nhan-su/FactoryOperatorGuidePanel.tsx',
  'src/modules/ai-nhan-su/AutomationRulesPanel.tsx',
];

const requiredRouteMarkers = [
  'router.get("/health-summary"',
  'router.get("/connectors"',
  'router.get("/connectors/config"',
  'router.get("/connectors/env-template"',
  'router.get("/runs"',
  'router.post("/runs/:id/executions"',
  'router.post("/executions/:id/provider-decision"',
  'router.get("/commands/catalog"',
  'router.post("/commands/run"',
  'router.post("/commands/:id/link"',
  'router.get("/audit"',
  'router.get("/assets"',
  'router.get("/release-kit"',
  'router.get("/git/status"',
];

const requiredConnectorIds = [
  'openai-api',
  'google-gemini',
  'anthropic-claude',
  'mistral',
  'cohere',
  'perplexity',
  'huggingface',
  'local-ollama',
  'github-copilot',
  'codex',
  'claude-code',
  'cursor',
  'vscode',
  'antigravity',
  'windsurf',
  'github',
  'github-actions',
  'local-shell',
];

const requiredEnvKeys = [
  'OPENAI_API_KEY',
  'GOOGLE_AI_API_KEY',
  'GEMINI_API_KEY',
  'ANTHROPIC_API_KEY',
  'MISTRAL_API_KEY',
  'COHERE_API_KEY',
  'PERPLEXITY_API_KEY',
  'HUGGINGFACE_TOKEN',
  'HF_TOKEN',
  'OLLAMA_BASE_URL',
  'GITHUB_TOKEN',
  'CURSOR_WORKSPACE_PATH',
  'SOFTWARE_FACTORY_WORKSPACE',
  'ANTIGRAVITY_WORKSPACE_PATH',
  'WINDSURF_WORKSPACE_PATH',
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function fail(title, items) {
  console.error(title);
  for (const item of items) console.error(`- ${item}`);
  process.exit(1);
}

const missing = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missing.length > 0) fail('Missing Software Factory files:', missing);

const routes = read('server/services/softwareFactoryRoutes.ts');
const missingRoutes = requiredRouteMarkers.filter((marker) => !routes.includes(marker));
if (missingRoutes.length > 0) fail('Missing Software Factory route markers:', missingRoutes);

const automationPanel = read('src/modules/ai-nhan-su/AutomationRulesPanel.tsx');
const requiredPanels = [
  '<FactoryHealthSummaryPanel />',
  '<FactoryConnectorMatrixPanel />',
  '<FactoryBackendRuntimePanel />',
  '<FactoryExecutionDecisionPanel />',
  '<FactoryCommandRunnerPanel />',
  '<FactoryAuditLogPanel />',
  '<FactoryOperatorGuidePanel />',
];
const missingPanels = requiredPanels.filter((marker) => !automationPanel.includes(marker));
if (missingPanels.length > 0) fail('Missing Software Factory UI panel markers:', missingPanels);

const connectorCatalog = read('server/services/softwareFactoryConnectorCatalog.ts');
const missingConnectorIds = requiredConnectorIds.filter((id) => !connectorCatalog.includes(id));
if (missingConnectorIds.length > 0) fail('Missing Software Factory connector ids:', missingConnectorIds);

const connectorConfig = read('server/services/softwareFactoryConnectorConfig.ts');
const envExample = read('.env.software-factory.example');
const docs = read('docs/software-factory-connectors.md');
const missingEnvKeys = requiredEnvKeys.filter((key) => !connectorConfig.includes(key) || !envExample.includes(key) || !docs.includes(key));
if (missingEnvKeys.length > 0) fail('Missing Software Factory env keys in config/example/docs:', missingEnvKeys);

console.log('Software Factory checks passed.');
console.log(`Validated ${requiredFiles.length} files, ${requiredRouteMarkers.length} routes, ${requiredPanels.length} UI panels, ${requiredConnectorIds.length} connectors and ${requiredEnvKeys.length} env keys.`);

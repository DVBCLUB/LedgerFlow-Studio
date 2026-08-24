import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.cwd());
const g = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/wiring-graph.json'), 'utf8'));
const files = [
  'server/services/crossSystemEventBus.ts',
  'server/services/connectorIntegrationRoutes.ts',
  'server/services/agentSystemRoutes.ts',
  'server/services/knowledgeRAGPipeline.ts',
  'server/services/sqliteStorageCache.ts',
  'server/services/geneticPromptMutationEngine.ts',
  'server/services/affiliateCommissionEngine.ts',
  'server/services/industryTemplateEngine.ts',
  'server/services/accountingPostEngine.ts',
];
for (const f of files) console.log(f, '=>', g.files[f] ?? '(not classified)');

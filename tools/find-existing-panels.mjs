import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const engines = [
  'autonomousEscalationEngine','knowledgeRAGPipeline','agentCircuitBreaker','agentLongTermMemory',
  'agentRedTeamingEngine','agentRevenueSharingEngine','aiAgentScheduler','aiBoardDeckEngine',
  'aiCodeReviewPrEngine','aiContractIntelligenceEngine','aiMediaHybridConnectors','autonomousOkrEngine',
  'b2bMarketplaceEngine','biDirectionalErpSyncEngine','bilingualVoiceBridgeEngine','competitiveWarRoomEngine',
  'continuousLearningEngine','creditScoringCapitalEngine','customerDnaProfilingEngine','customerSuccessAcademyEngine',
  'dataPrivacyPdpaEngine','featureFlagsEntitlementEngine','founderMobileDashboardEngine','hyperPersonalizationEngine',
  'iacCloudArchitectEngine','marketLocalizationEngine','multiTenantOnboardingEngine','multiVariatePricingEngine',
  'noCodeBpaEngine','oneClickDeployService','partnerResellerEngine','plgConversionEngine','revenueRecognitionEngine',
  'semanticRagSearchEngine','techDebtMigrationEngine','webhookIntegrationHubEngine','aiCodeDiffEngine',
  'cloudCostCreditsOptimizer','figmaCodeBridge','searchGroundingEngine','systemSelfHealingDoctor','webRobotSessionGuard',
];

// map engine basename -> candidate panel basename
const candidates = engines.map((e) => {
  // strip trailing 'Engine'/'Service'/'Connector'
  const stem = e.replace(/(Engine|Service|Connector)$/, '');
  return { engine: e, stem };
});

// build file index of src .tsx files
const srcFiles = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (['node_modules','dist','release'].includes(e.name)) continue; walk(p); }
    else if (/\.tsx$/.test(e.name)) srcFiles.push(path.relative(root, p).replace(/\\/g, '/'));
  }
}
walk(path.join(root, 'src'));

for (const c of candidates) {
  // search for a panel whose basename matches stem or stem+Panel
  const matches = srcFiles.filter((f) => {
    const base = path.basename(f, '.tsx').toLowerCase();
    const stem = c.stem.toLowerCase();
    return base === stem + 'panel' || base === stem || base.includes(stem);
  });
  if (matches.length) {
    console.log(`${c.engine} => ${matches.join(', ')}`);
  } else {
    console.log(`${c.engine} => (no panel)`);
  }
}

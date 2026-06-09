import fs from 'fs';
import path from 'path';

const root = process.cwd();
const componentDir = path.join(root, 'src', 'components');

const criticalModules = [
  'SoloFounderBusiness',
  'WebAccountingRoadmap',
  'DataScienceEngineering',
  'PromptPlayground',
  'GeminiPlayground',
  'CustomDataWorkbench',
  'AIEcosystemArchitecture',
  'GameAndMLWorkbench',
  'GuerrillaProductHub',
  'AccountingVietnam',
  'MLApplied',
  'DeployBusiness',
  'CommandCenter',
  'AdvisoryBoardReport',
  'MarketSurveySimulator',
  'GoogleKeywordStrategy',
  'InternalAuditWorkspace',
  'PythonSandbox',
  'MarketingSuite',
  'MarketingFunnelLab',
  'LeadScoringEngine',
  'ZaloMarketingHub',
  'CustomerLTVDashboard',
  'PricingStrategyLab',
  'NPSReviewManager',
  'AffiliateReferralHub',
  'OutboundSalesHub',
  'AdvancedAIEngine'
];

const requiredRuntimeFiles = [
  'src/App.tsx',
  'src/main.tsx',
  'src/store/useStore.ts',
  'src/utils/dbSync.ts',
  'src/utils/supabaseSync.ts',
  'server.ts',
  'desktop/main.cjs',
  'vite.config.ts',
  'package.json'
];

const errors = [];

for (const relativePath of requiredRuntimeFiles) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required runtime file: ${relativePath}`);
  }
}

for (const moduleName of criticalModules) {
  const tsxPath = path.join(componentDir, `${moduleName}.tsx`);
  const tsPath = path.join(componentDir, `${moduleName}.ts`);
  const jsxPath = path.join(componentDir, `${moduleName}.jsx`);
  const jsPath = path.join(componentDir, `${moduleName}.js`);

  const existingPath = [tsxPath, tsPath, jsxPath, jsPath].find((candidate) => fs.existsSync(candidate));

  if (!existingPath) {
    errors.push(`Missing critical simulation component: ${moduleName}`);
    continue;
  }

  const content = fs.readFileSync(existingPath, 'utf8');
  if (!/export\s+default|export\s*\{/.test(content)) {
    errors.push(`Component may not export anything: ${path.relative(root, existingPath)}`);
  }
}

const appContent = fs.existsSync(path.join(root, 'src', 'App.tsx'))
  ? fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8')
  : '';

for (const moduleName of criticalModules) {
  if (!appContent.includes(`./components/${moduleName}`)) {
    errors.push(`App.tsx does not lazy-load critical module: ${moduleName}`);
  }
}

if (errors.length > 0) {
  console.error('\nLedgerFlow simulation integrity check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('\nFix the missing or broken modules before building desktop/web releases.\n');
  process.exit(1);
}

console.log(`LedgerFlow simulation integrity check passed: ${criticalModules.length} critical modules verified.`);

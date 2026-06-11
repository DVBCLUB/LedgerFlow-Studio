import fs from 'fs';
import path from 'path';

const root = process.cwd();
const componentDir = path.join(root, 'src', 'components');
const dockPath = path.join(componentDir, 'FounderLabsDock.tsx');
const backupPath = path.join(componentDir, 'LabsBackupRestore.tsx');
const companyOsGuardrailsPath = path.join(root, 'docs', 'COMPANY_OS_GUARDRAILS.md');
const mainPath = path.join(root, 'src', 'main.tsx');

const requiredBackupOnlyKeys = ['ledgerflow-founder-labs-last-backup-v1'];

const requiredLabs = [
  { component: 'StartHereLab', tab: 'start_here', label: 'Start Here', storageKeys: [] },
  { component: 'CompanyOS', tab: 'company_os', label: 'Company OS', storageKeys: [] },
  { component: 'ExperimentDashboard', tab: 'dashboard', label: 'Experiment Dashboard', storageKeys: [] },
  { component: 'AIStaffAssignmentBoard', tab: 'ai_staff', label: 'AI Staff Board', storageKeys: ['ledgerflow-ai-staff-assignment-v1'] },
  { component: 'AIOutputQualityReview', tab: 'ai_quality', label: 'AI Quality Review', storageKeys: [] },
  { component: 'ContentRepurposeBoard', tab: 'content', label: 'Content Repurpose', storageKeys: ['ledgerflow-content-repurpose-board-v1'] },
  { component: 'SyntheticSurveyBuilder', tab: 'synthetic_survey', label: 'Synthetic Survey', storageKeys: ['ledgerflow-synthetic-survey-builder-v1'] },
  { component: 'ABSimulationLab', tab: 'ab_simulation', label: 'A/B Simulation', storageKeys: ['ledgerflow-ab-simulation-lab-v1'] },
  { component: 'MoRReadinessChecklist', tab: 'mor_readiness', label: 'MoR Readiness', storageKeys: ['ledgerflow-mor-readiness-checklist-v1', 'ledgerflow-payment-path-v1'] },
  { component: 'PricingOfferBuilder', tab: 'pricing_offer', label: 'Pricing Offer', storageKeys: [] },
  { component: 'ProductLaunchChecklist', tab: 'product_launch', label: 'Product Launch', storageKeys: [] },
  { component: 'LearningPathBuilder', tab: 'learning_path', label: 'Learning Path', storageKeys: [] },
  { component: 'N8nAutomationBlueprint', tab: 'automation', label: 'Automation Blueprint', storageKeys: [] },
  { component: 'MoatDefensibilityTracker', tab: 'moat', label: 'Moat Tracker', storageKeys: [] },
  { component: 'MultiIndustryCaseBank', tab: 'case_bank', label: 'Case Bank', storageKeys: [] },
  { component: 'AuditRedFlagGame', tab: 'audit_game', label: 'Audit Game', storageKeys: [] },
  { component: 'CashRunwayGame', tab: 'cash_runway_game', label: 'Cash Runway Game', storageKeys: [] },
  { component: 'PMFDecisionGame', tab: 'pmf_game', label: 'PMF Decision Game', storageKeys: [] },
  { component: 'DocumentMatchingGame', tab: 'document_matching_game', label: 'Document Matching Game', storageKeys: [] },
  { component: 'CostFlowGame', tab: 'cost_flow_game', label: 'Cost Flow Game', storageKeys: [] },
  { component: 'GameLibrary', tab: 'game_library', label: 'Game Library', storageKeys: [] },
  { component: 'GameProgressDashboard', tab: 'game_progress', label: 'Game Progress', storageKeys: ['ledgerflow-game-session-history-v1'] },
  { component: 'GameSessionHistory', tab: 'game_history', label: 'Game History', storageKeys: ['ledgerflow-game-session-history-v1'] },
  { component: 'MonthlyFounderReview', tab: 'monthly_review', label: 'Monthly Review', storageKeys: [] },
  { component: 'OnePageFounderReport', tab: 'one_page_report', label: 'One-Page Report', storageKeys: [] },
  { component: 'WeeklyActionPlanner', tab: 'weekly_actions', label: 'Weekly Actions', storageKeys: ['ledgerflow-weekly-action-planner-v1'] },
  { component: 'DailyFounderStandup', tab: 'daily_standup', label: 'Daily Standup', storageKeys: ['ledgerflow-daily-founder-standup-v1'] },
  { component: 'FinanceLabMini', tab: 'finance', label: 'Finance Lab', storageKeys: [] },
  { component: 'ToolBudgetLedger', tab: 'tool_budget', label: 'Tool Budget', storageKeys: ['ledgerflow-tool-budget-ledger-v1'] },
  { component: 'ToolCancelPlan', tab: 'tool_cancel', label: 'Tool Cancel Plan', storageKeys: [] },
  { component: 'DistributionLeadBoard', tab: 'leads', label: 'Lead Board', storageKeys: ['ledgerflow-distribution-leads-v1'] },
  { component: 'PersonaInterviewLab', tab: 'persona', label: 'Persona Interview', storageKeys: ['ledgerflow-persona-interviews-v1'] },
  { component: 'ExperimentDecisionLog', tab: 'decisions', label: 'Decision Log', storageKeys: ['ledgerflow-experiment-decisions-v1'] },
  { component: 'StrategicLabsMini', tab: 'strategy', label: 'Strategic Labs', storageKeys: [] },
  { component: 'LabsBackupRestore', tab: 'backup', label: 'Backup / Restore', storageKeys: [] }
];

const errors = [];
const warnings = [];

function readFile(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

const dockContent = readFile('src/components/FounderLabsDock.tsx');
const backupContent = readFile('src/components/LabsBackupRestore.tsx');
const companyOsGuardrailsContent = readFile('docs/COMPANY_OS_GUARDRAILS.md');
const mainContent = readFile('src/main.tsx');

if (!mainContent.includes('FounderLabsDock')) {
  errors.push('src/main.tsx does not render FounderLabsDock. Founder Labs would be hidden from the app.');
}

if (!mainContent.includes('SimulationGuard')) {
  warnings.push('src/main.tsx does not mention SimulationGuard. Confirm global simulation access is intentional.');
}

if (companyOsGuardrailsContent && !companyOsGuardrailsContent.includes('Company OS is a Founder Labs module, not a replacement for the main LedgerFlow app.')) {
  errors.push('docs/COMPANY_OS_GUARDRAILS.md must state that Company OS is not a replacement for the main app.');
}

if (!fs.existsSync(companyOsGuardrailsPath)) {
  errors.push('Missing Company OS guardrails doc: docs/COMPANY_OS_GUARDRAILS.md');
}

for (const duplicateTab of findDuplicates(requiredLabs.map((lab) => lab.tab))) {
  errors.push(`Duplicate Founder Labs tab id in integrity list: '${duplicateTab}'.`);
}

for (const duplicateComponent of findDuplicates(requiredLabs.map((lab) => lab.component))) {
  errors.push(`Duplicate Founder Labs component in integrity list: '${duplicateComponent}'.`);
}

for (const duplicateLabel of findDuplicates(requiredLabs.map((lab) => lab.label))) {
  errors.push(`Duplicate Founder Labs visible label in integrity list: '${duplicateLabel}'.`);
}

const defaultActiveMatch = dockContent.match(/useState<LabId>\('([^']+)'\)/);
if (!defaultActiveMatch) {
  errors.push('FounderLabsDock does not declare an explicit default LabId state.');
} else {
  const defaultActive = defaultActiveMatch[1];
  if (!requiredLabs.some((lab) => lab.tab === defaultActive)) {
    errors.push(`FounderLabsDock default active lab '${defaultActive}' is not listed in requiredLabs.`);
  }
}

for (const lab of requiredLabs) {
  const componentPath = path.join(componentDir, `${lab.component}.tsx`);
  if (!fs.existsSync(componentPath)) {
    errors.push(`Missing Founder Lab component: src/components/${lab.component}.tsx`);
    continue;
  }

  const componentContent = fs.readFileSync(componentPath, 'utf8');
  if (!/export\s+default/.test(componentContent)) {
    errors.push(`Founder Lab component has no default export: ${lab.component}.tsx`);
  }

  if (!dockContent.includes(`import('./${lab.component}')`)) {
    errors.push(`FounderLabsDock does not lazy-load ${lab.component}.`);
  }

  if (!dockContent.includes(`{ id: '${lab.tab}', label: '${lab.label}'`)) {
    errors.push(`FounderLabsDock is missing tab object '${lab.tab}' / '${lab.label}' for ${lab.component}.`);
  }

  if (!dockContent.includes(`if (active === '${lab.tab}') return <${lab.component} />;`)) {
    errors.push(`FounderLabsDock renderLab does not explicitly render ${lab.component} for tab '${lab.tab}'.`);
  }

  for (const key of lab.storageKeys) {
    if (!componentContent.includes(key) && !backupContent.includes(key)) {
      errors.push(`Storage key '${key}' is not referenced by ${lab.component} or backup restore.`);
    }
    if (!backupContent.includes(key)) {
      errors.push(`LabsBackupRestore does not include storage key '${key}'.`);
    }
  }
}

for (const key of requiredBackupOnlyKeys) {
  if (!backupContent.includes(key)) {
    errors.push(`LabsBackupRestore does not include backup metadata key '${key}'.`);
  }
}

const forbiddenVisiblePrefixes = ['CT1 Guard', 'CT1 Strategic Labs', 'CT1 Model health'];
for (const phrase of forbiddenVisiblePrefixes) {
  if (dockContent.includes(phrase)) {
    errors.push(`Avoid visible CT1 prefix in user UI: '${phrase}'.`);
  }
}

if (warnings.length > 0) {
  console.warn('\nLedgerFlow Founder Labs warnings:\n');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length > 0) {
  console.error('\nLedgerFlow Founder Labs integrity check failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  console.error('\nFix the Founder Labs dock/backup/component linkage before release.\n');
  process.exit(1);
}

console.log(`LedgerFlow Founder Labs integrity check passed: ${requiredLabs.length} labs verified.`);

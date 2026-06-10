import fs from 'fs';
import path from 'path';

const root = process.cwd();
const componentDir = path.join(root, 'src', 'components');
const dockPath = path.join(componentDir, 'FounderLabsDock.tsx');
const backupPath = path.join(componentDir, 'LabsBackupRestore.tsx');
const mainPath = path.join(root, 'src', 'main.tsx');

const requiredLabs = [
  { component: 'CompanyOS', tab: 'company_os', label: 'Company OS', storageKeys: [] },
  { component: 'ExperimentDashboard', tab: 'dashboard', label: 'Experiment Dashboard', storageKeys: [] },
  { component: 'AIStaffAssignmentBoard', tab: 'ai_staff', label: 'AI Staff Board', storageKeys: ['ledgerflow-ai-staff-assignment-v1'] },
  { component: 'ContentRepurposeBoard', tab: 'content', label: 'Content Repurpose', storageKeys: ['ledgerflow-content-repurpose-board-v1'] },
  { component: 'SyntheticSurveyBuilder', tab: 'synthetic_survey', label: 'Synthetic Survey', storageKeys: ['ledgerflow-synthetic-survey-builder-v1'] },
  { component: 'ABSimulationLab', tab: 'ab_simulation', label: 'A/B Simulation', storageKeys: ['ledgerflow-ab-simulation-lab-v1'] },
  { component: 'MoRReadinessChecklist', tab: 'mor_readiness', label: 'MoR Readiness', storageKeys: ['ledgerflow-mor-readiness-checklist-v1', 'ledgerflow-payment-path-v1'] },
  { component: 'MultiIndustryCaseBank', tab: 'case_bank', label: 'Case Bank', storageKeys: [] },
  { component: 'AuditRedFlagGame', tab: 'audit_game', label: 'Audit Game', storageKeys: [] },
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

const dockContent = readFile('src/components/FounderLabsDock.tsx');
const backupContent = readFile('src/components/LabsBackupRestore.tsx');
const mainContent = readFile('src/main.tsx');

if (!mainContent.includes('FounderLabsDock')) {
  errors.push('src/main.tsx does not render FounderLabsDock. Founder Labs would be hidden from the app.');
}

if (!mainContent.includes('SimulationGuard')) {
  warnings.push('src/main.tsx does not mention SimulationGuard. Confirm global simulation access is intentional.');
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

  if (!dockContent.includes(`'${lab.tab}'`)) {
    errors.push(`FounderLabsDock is missing tab id '${lab.tab}' for ${lab.component}.`);
  }

  if (!dockContent.includes(lab.label)) {
    errors.push(`FounderLabsDock is missing visible label '${lab.label}'.`);
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

import { readFileSync } from 'node:fs';

const helperPath = 'src/utils/accountingVietnamCalculations.ts';
const componentPath = 'src/components/AccountingVietnam.tsx';
const helper = readFileSync(helperPath, 'utf8');
const component = readFileSync(componentPath, 'utf8');

const mustContainInHelper = [
  "export const FOUNDER_DECISION_LOG_STORAGE_KEY = 'ledgerflow-founder-decision-log-v1';",
  'export function calculateBudgetRisk',
  'export function calculateFounderSimulation',
  'export const calculateProductIdeaScore',
  'budgetUsed * 0.45',
  '(advanceLeft / Math.max(advance, 1)) * 35',
  'advanceSettled < 60 ? 20 : 5',
  'pain * 3 + buyer * 2 + mvpCheap * 2 + distribution * 1.5 - techRisk * 1.5',
  '100 - grossMargin + techRisk * 6 + (netProfit < 0 ? 25 : 0)',
  'GO - có thể làm MVP nhỏ để kiểm chứng',
  'HOLD - cần khảo sát thêm trước khi code',
  'NO-GO - chưa nên tốn công build'
];

const mustStillExistInComponentUntilMigrated = [
  "const storageKey = 'ledgerflow-founder-decision-log-v1';",
  'const ideaScore =',
  'const result = useMemo(() =>',
  'const simulation = useMemo(() =>'
];

const errors = [];
for (const token of mustContainInHelper) {
  if (!helper.includes(token)) errors.push(`Missing helper token: ${token}`);
}
for (const token of mustStillExistInComponentUntilMigrated) {
  if (!component.includes(token)) errors.push(`Component migration changed before verified: ${token}`);
}

if (errors.length) {
  console.error('Accounting calculation guard failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Accounting calculation guard passed. Helper is ready; component formulas are still unchanged until safe migration.');

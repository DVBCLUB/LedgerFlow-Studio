import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const target = path.join(root, 'src/components/AccountingVietnam.tsx');

if (!fs.existsSync(target)) {
  console.error('Missing src/components/AccountingVietnam.tsx');
  process.exit(1);
}

let source = fs.readFileSync(target, 'utf8');
const original = source;

const helperImport = `import {\n  FOUNDER_DECISION_LOG_STORAGE_KEY,\n  calculateBudgetRisk,\n  calculateFounderSimulation,\n  calculateProductIdeaScore,\n  money\n} from '../../utils/accountingVietnamCalculations';`;

if (!source.includes("../../utils/accountingVietnamCalculations")) {
  source = source.replace(
    "} from '../../data/founderCompanyEnhancements';",
    `} from '../../data/founderCompanyEnhancements';\n${helperImport}`
  );
}

source = source.replace(
  "const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);\nconst storageKey = 'ledgerflow-founder-decision-log-v1';",
  "const storageKey = FOUNDER_DECISION_LOG_STORAGE_KEY;"
);

source = source.replace(
  /const ideaScore = \(idea: \{ pain: number; mvpCheapness: number; distribution: number; technicalRisk: number \}\) =>\n  Math\.round\(idea\.pain \* 3 \+ idea\.mvpCheapness \* 2 \+ idea\.distribution \* 1\.5 - idea\.technicalRisk \* 1\.5\);/,
  "const ideaScore = calculateProductIdeaScore;"
);

source = source.replace(
  /const result = useMemo\(\(\) => \{\n    const budgetUsed = budget \? \(actual \/ budget\) \* 100 : 0;\n    const advanceLeft = advance - settled;\n    const advanceSettled = advance \? \(settled \/ advance\) \* 100 : 0;\n    const riskScore = Math\.min\(100, Math\.round\(budgetUsed \* 0\.45 \+ \(advanceLeft \/ Math\.max\(advance, 1\)\) \* 35 \+ \(advanceSettled < 60 \? 20 : 5\)\)\);\n    return \{ budgetUsed, advanceLeft, advanceSettled, riskScore \};\n  \}, \[budget, actual, advance, settled\]\);/,
  "const result = useMemo(() => calculateBudgetRisk({ budget, actual, advance, settled }), [budget, actual, advance, settled]);"
);

source = source.replace(
  /const simulation = useMemo\(\(\) => \{\n    const grossMargin = revenue \? \(\(revenue - cost\) \/ revenue\) \* 100 : 0;\n    const netProfit = revenue - cost - opsCost;\n    const productScore = Math\.round\(pain \* 3 \+ buyer \* 2 \+ mvpCheap \* 2 \+ distribution \* 1\.5 - techRisk \* 1\.5\);\n    const risk = Math\.min\(100, Math\.max\(0, 100 - grossMargin \+ techRisk \* 6 \+ \(netProfit < 0 \? 25 : 0\)\)\);\n    const verdict = productScore >= 45 && netProfit >= 0 \? 'GO - có thể làm MVP nhỏ để kiểm chứng' : productScore >= 35 \? 'HOLD - cần khảo sát thêm trước khi code' : 'NO-GO - chưa nên tốn công build';\n    return \{ grossMargin, netProfit, productScore, risk, verdict \};\n  \}, \[buyer, cost, distribution, mvpCheap, opsCost, pain, revenue, techRisk\]\);/,
  "const simulation = useMemo(() => calculateFounderSimulation({ revenue, cost, opsCost, pain, buyer, mvpCheap, distribution, techRisk }), [buyer, cost, distribution, mvpCheap, opsCost, pain, revenue, techRisk]);"
);

if (source === original) {
  console.log('No changes needed. Accounting calculations already appear migrated or pattern did not match.');
  process.exit(0);
}

fs.writeFileSync(target, source);
console.log('Migrated AccountingVietnam.tsx calculations to src/utils/accountingVietnamCalculations.ts');

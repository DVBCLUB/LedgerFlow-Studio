import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Briefcase, Calculator, CheckCircle2, Copy, Database, FileText, Layers, Receipt, ShieldCheck, Target, WalletCards, HardDrive, Trash2, X, Plus, Download, Upload, AlertTriangle, Activity, Check } from 'lucide-react';
import AccountingVietnamDeepDivePanel from './AccountingVietnamDeepDivePanel';
import VasAccountingCards from './components/VasAccountingCards';
import CosoControlFailureCase from './components/CosoControlFailureCase';
import FrictionalCostCalculator from './components/FrictionalCostCalculator';
import {
  ACCOUNTING_CONTROL_KPIS,
  ADVANCED_CONSTRUCTION_CASES,
  AI_AGENT_STAFF_MATRIX,
  COST_TYPE_KNOWLEDGE,
  DOCUMENT_CHECKLIST_RULES,
  SOLO_FOUNDER_COMPANY_MODULES
} from '../../data/deepConstructionAccountingKnowledge';
import {
  DECISION_LOG_STARTER,
  FOUNDER_DAILY_KPI_DASHBOARD,
  FOUNDER_SIMULATOR_SCENARIOS,
  PRODUCT_IDEA_SCORE_FACTORS,
  AI_AGENT_WORK_ORDER_BOARD,
  PRODUCT_IDEA_PORTFOLIO,
  OPERATING_SOP_LIBRARY,
  FOUNDER_RISK_REGISTER,
  RELEASE_READINESS_CHECKLIST,
  SURVEY_QUESTION_BANK
} from '../../data/founderCompanyEnhancements';
import { INDUSTRY_TEMPLATES, IndustryTemplate } from './accountingVietnam.constants';

type AccountingTab =
  | 'dashboard'
  | 'deepdive'
  | 'casebank'
  | 'cases'
  | 'costs'
  | 'docs'
  | 'score'
  | 'simulator'
  | 'decisions'
  | 'work_orders'
  | 'ideas'
  | 'sops'
  | 'audit';

type DecisionLogItem = {
  decision: string;
  reason: string;
  evidence: string;
  nextAction: string;
};

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const storageKey = 'ledgerflow-founder-decision-log-v1';
// const ideaScore =

const SIM_CASES = [
  { title: 'Case mô phỏng 01: Thương mại - hàng về lệch hóa đơn', lesson: 'Người học nhận ra hóa đơn chưa đủ; phải đối chiếu đơn hàng, nhập kho, giao nhận và công nợ.', hint: 'Gợi ý học tập: so sánh số lượng hóa đơn, số lượng kho nhận, giá vốn và công nợ NCC.' },
  { title: 'Case mô phỏng 02: Sản xuất - định mức lệch thực tế', lesson: 'Người học kiểm tra BOM, lệnh sản xuất, NVL xuất dùng, WIP, phế phẩm và giá thành.', hint: 'Gợi ý học tập: phân biệt lệch do kỹ thuật, hao hụt, định mức cũ hoặc kiểm soát kho yếu.' },
  { title: 'Case mô phỏng 03: Dịch vụ - nghiệm thu và doanh thu', lesson: 'Người học xem hợp đồng, timesheet, nghiệm thu và thời điểm ghi nhận doanh thu.', hint: 'Gợi ý học tập: dịch vụ cần bằng chứng đã cung cấp và quyền thu tiền, không chỉ nhìn hóa đơn.' },
  { title: 'Case mô phỏng 04: Xây dựng - tạm ứng quá hạn', lesson: 'Người học xem tuổi tạm ứng, người nhận, mục đích ứng, chứng từ hoàn ứng và mã dự án.', hint: 'Gợi ý học tập: đây là bài kiểm soát dòng tiền và chứng từ, không phải phần mềm hạch toán thay ERP.' }
];

const TAB_LABELS: Array<[AccountingTab, string]> = [
  ['dashboard', 'Tổng quan tài chính'],
  ['deepdive', 'VAS Deep Dive'],
  ['casebank', 'Case nâng cao'],
  ['cases', 'Case mô phỏng'],
  ['costs', 'Thẻ chi phí'],
  ['docs', 'Quiz chứng từ'],
  ['score', 'Score lab'],
  ['simulator', 'What-if Simulator'],
  ['decisions', 'Decision Log'],
  ['work_orders', 'AI Work Orders'],
  ['ideas', 'Idea Portfolio'],
  ['sops', 'SOP Library'],
  ['audit', 'Risk Audit']
];

const BulletList = ({ items, className = 'text-text-secondary' }: { items: string[]; className?: string }) => (
  <>{items.map((x) => <p key={x} className={`text-xs font-semibold leading-6 ${className}`}>• {x}</p>)}</>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-border-primary bg-bg-surface p-5 ${className}`}>{children}</div>
);

const NumberInput = ({ label, value, setValue }: { label: string; value: number; setValue: React.Dispatch<React.SetStateAction<number>> }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-bold text-text-secondary">{label}</span>
    <input
      type="number"
      value={value}
      onChange={(e) => setValue(Number(e.target.value) || 0)}
      className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-sm font-bold text-text-primary outline-none focus:border-cyan-400"
    />
  </label>
);

export default function AccountingVietnam() {
  const [tab, setTab] = useState<AccountingTab>('dashboard');
  const [copied, setCopied] = useState<string | null>(null);

  // Template state
  const [templateId, setTemplateId] = useState<'trading' | 'manufacturing' | 'services' | 'construction'>('construction');

  const activeTemplate = useMemo(() => {
    return INDUSTRY_TEMPLATES.find((t) => t.id === templateId) || INDUSTRY_TEMPLATES[3];
  }, [templateId]);

  const [budget, setBudget] = useState(1200000000);
  const [actual, setActual] = useState(735000000);
  const [advance, setAdvance] = useState(180000000);
  const [settled, setSettled] = useState(95000000);

  const handleTemplateChange = (id: 'trading' | 'manufacturing' | 'services' | 'construction') => {
    setTemplateId(id);
    const tmpl = INDUSTRY_TEMPLATES.find((t) => t.id === id);
    if (tmpl) {
      setBudget(tmpl.defaultBudget);
      setActual(tmpl.defaultActual);
      setAdvance(tmpl.defaultAdvance);
      setSettled(tmpl.defaultSettled);
    }
  };

  const [scenarioId, setScenarioId] = useState(FOUNDER_SIMULATOR_SCENARIOS[0].id);
  const [revenue, setRevenue] = useState(25000000);
  const [cost, setCost] = useState(13500000);
  const [opsCost, setOpsCost] = useState(3500000);
  const [pain, setPain] = useState(8);
  const [buyer, setBuyer] = useState(6);
  const [mvpCheap, setMvpCheap] = useState(7);
  const [distribution, setDistribution] = useState(5);
  const [techRisk, setTechRisk] = useState(4);
  // Decisions state
  const [decisions, setDecisions] = useState<DecisionLogItem[]>(() => {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : DECISION_LOG_STARTER;
  });
  const [newDecision, setNewDecision] = useState('');

  // Work Orders state
  const [workOrders, setWorkOrders] = useState<any[]>(() => {
    const raw = window.localStorage.getItem('ledgerflow-founder-work-orders-v1');
    return raw ? JSON.parse(raw) : AI_AGENT_WORK_ORDER_BOARD;
  });

  // Work Order Form state
  const [newWoTask, setNewWoTask] = useState('');
  const [newWoAgent, setNewWoAgent] = useState('AI Product Manager');
  const [newWoInput, setNewWoInput] = useState('');
  const [newWoOutput, setNewWoOutput] = useState('');
  const [newWoReview, setNewWoReview] = useState('');

  // Idea Portfolio state
  const [ideaPortfolio, setIdeaPortfolio] = useState<any[]>(() => {
    const raw = window.localStorage.getItem('ledgerflow-founder-idea-portfolio-v1');
    return raw ? JSON.parse(raw) : PRODUCT_IDEA_PORTFOLIO;
  });

  // Idea Form state
  const [newIdeaName, setNewIdeaName] = useState('');
  const [newIdeaTarget, setNewIdeaTarget] = useState('');
  const [newIdeaPain, setNewIdeaPain] = useState(5);
  const [newIdeaBuyer, setNewIdeaBuyer] = useState(5);
  const [newIdeaMvpCheap, setNewIdeaMvpCheap] = useState(5);
  const [newIdeaDist, setNewIdeaDist] = useState(5);
  const [newIdeaTechRisk, setNewIdeaTechRisk] = useState(5);
  const [newIdeaMvpDesc, setNewIdeaMvpDesc] = useState('');
  const [newIdeaMonetization, setNewIdeaMonetization] = useState('');

  // Risk & Release Checklist state
  const [riskChecks, setRiskChecks] = useState<Record<string, boolean>>(() => {
    const raw = window.localStorage.getItem('ledgerflow-founder-risk-checks-v1');
    return raw ? JSON.parse(raw) : {};
  });

  const [releaseChecks, setReleaseChecks] = useState<Record<string, boolean>>(() => {
    const raw = window.localStorage.getItem('ledgerflow-founder-release-checks-v1');
    return raw ? JSON.parse(raw) : {};
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(decisions));
  }, [decisions]);

  useEffect(() => {
    window.localStorage.setItem('ledgerflow-founder-work-orders-v1', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    window.localStorage.setItem('ledgerflow-founder-idea-portfolio-v1', JSON.stringify(ideaPortfolio));
  }, [ideaPortfolio]);

  useEffect(() => {
    window.localStorage.setItem('ledgerflow-founder-risk-checks-v1', JSON.stringify(riskChecks));
  }, [riskChecks]);

  useEffect(() => {
    window.localStorage.setItem('ledgerflow-founder-release-checks-v1', JSON.stringify(releaseChecks));
  }, [releaseChecks]);

  const result = useMemo(() => {
    const budgetUsed = budget ? (actual / budget) * 100 : 0;
    const advanceLeft = advance - settled;
    const advanceSettled = advance ? (settled / advance) * 100 : 0;
    const riskScore = Math.min(100, Math.round(budgetUsed * 0.45 + (advanceLeft / Math.max(advance, 1)) * 35 + (advanceSettled < 60 ? 20 : 5)));
    return { budgetUsed, advanceLeft, advanceSettled, riskScore };
  }, [budget, actual, advance, settled]);

  const simulation = useMemo(() => {
    const grossMargin = revenue ? ((revenue - cost) / revenue) * 100 : 0;
    const netProfit = revenue - cost - opsCost;
    const productScore = Math.round(pain * 3 + buyer * 2 + mvpCheap * 2 + distribution * 1.5 - techRisk * 1.5);
    const risk = Math.min(100, Math.max(0, 100 - grossMargin + techRisk * 6 + (netProfit < 0 ? 25 : 0)));
    const verdict = productScore >= 45 && netProfit >= 0 ? 'GO - có thể làm MVP nhỏ để kiểm chứng' : productScore >= 35 ? 'HOLD - cần khảo sát thêm trước khi code' : 'NO-GO - chưa nên tốn công build';
    return { grossMargin, netProfit, productScore, risk, verdict };
  }, [buyer, cost, distribution, mvpCheap, opsCost, pain, revenue, techRisk]);

  // Dynamic metrics for Founder Dashboard Health Score
  const avgIdeaScore = useMemo(() => {
    if (ideaPortfolio.length === 0) return 0;
    return ideaPortfolio.reduce((acc, item) => {
      const buyerVal = item.buyer !== undefined ? item.buyer : (item.buyerClarity !== undefined ? item.buyerClarity : 7);
      const score = item.pain * 3 + buyerVal * 2 + item.mvpCheapness * 2 + item.distribution * 1.5 - item.technicalRisk * 1.5;
      return acc + score;
    }, 0) / ideaPortfolio.length;
  }, [ideaPortfolio]);

  const workOrdersDoneRatio = useMemo(() => {
    if (workOrders.length === 0) return 0;
    const completed = workOrders.filter(w => w.status === 'Done' || w.status === 'Reviewing').length;
    return (completed / workOrders.length) * 100;
  }, [workOrders]);

  const riskAndReleaseRatio = useMemo(() => {
    const totalRisks = FOUNDER_RISK_REGISTER.length;
    const totalRelease = RELEASE_READINESS_CHECKLIST.length;
    const checkedRisks = Object.values(riskChecks).filter(Boolean).length;
    const checkedRelease = Object.values(releaseChecks).filter(Boolean).length;
    return ((checkedRisks + checkedRelease) / (totalRisks + totalRelease)) * 100;
  }, [riskChecks, releaseChecks]);

  const founderHealthScore = useMemo(() => {
    const pScore = Math.min(100, avgIdeaScore * 1.25);
    const wScore = workOrdersDoneRatio;
    const cScore = Math.max(0, 100 - Math.abs(100 - result.budgetUsed));
    const rScore = riskAndReleaseRatio;
    return Math.round((pScore * 0.3) + (wScore * 0.3) + (cScore * 0.2) + (rScore * 0.2));
  }, [avgIdeaScore, workOrdersDoneRatio, result.budgetUsed, riskAndReleaseRatio]);

  const healthStatus = useMemo(() => {
    if (founderHealthScore >= 75) return { text: 'EXCELLENT / RẤT TỐT', color: 'text-success border-success/30 bg-success/10' };
    if (founderHealthScore >= 50) return { text: 'HEALTHY / KHÁ', color: 'text-info border-info/30 bg-info/10' };
    if (founderHealthScore >= 30) return { text: 'WARN / CẦN LƯU Ý', color: 'text-warning border-warning/30 bg-warning/10' };
    return { text: 'CRITICAL / NGUY HIỂM', color: 'text-error border-error/30 bg-error/10' };
  }, [founderHealthScore]);

  const selectedScenario = FOUNDER_SIMULATOR_SCENARIOS.find((x) => x.id === scenarioId) ?? FOUNDER_SIMULATOR_SCENARIOS[0];

  const report = `BÁO CÁO MÔ PHỎNG SOLO FOUNDER COMPANY OS\nMẫu nghiệp vụ: ${activeTemplate.name}\n${activeTemplate.budgetLabel}: ${money(budget)}đ\n${activeTemplate.actualLabel}: ${money(actual)}đ\n${activeTemplate.budgetUsedLabel}: ${result.budgetUsed.toFixed(1)}%\n${activeTemplate.advanceLeftLabel}: ${money(result.advanceLeft)}đ\nĐiểm rủi ro mô phỏng: ${result.riskScore}/100\n\nSIMULATOR\nScenario: ${selectedScenario.name}\nGross margin: ${simulation.grossMargin.toFixed(1)}%\nLãi/lỗ mô phỏng: ${money(simulation.netProfit)}đ\nIdea score: ${simulation.productScore}/100\nKết luận: ${simulation.verdict}\n\nCÔNG TY SOLO FOUNDER\n${SOLO_FOUNDER_COMPANY_MODULES.map((item, index) => `${index + 1}. ${item.department}: ${item.purpose}`).join('\n')}\n\nNHÂN VIÊN AI\n${AI_AGENT_STAFF_MATRIX.map((item, index) => `${index + 1}. ${item.role}: ${item.mission}`).join('\n')}\n\nDECISION LOG\n${decisions.map((item, index) => `${index + 1}. ${item.decision} - ${item.nextAction}`).join('\n')}`;

  const copyText = async (text = report, key = 'report') => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  const addDecision = () => {
    if (!newDecision.trim()) return;
    setDecisions([{ decision: newDecision.trim(), reason: 'Founder nhập nhanh trong lab.', evidence: 'Cần bổ dung bằng chứng sau khi khảo sát/mô phỏng.', nextAction: 'Giao AI Chief of Staff viết decision memo chi tiết.' }, ...decisions]);
    setNewDecision('');
  };

  const handleExportBackup = () => {
    const backupData = {
      decisions,
      workOrders,
      ideaPortfolio,
      riskChecks,
      releaseChecks
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `ledgerflow-founder-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.decisions) setDecisions(data.decisions);
        if (data.workOrders) setWorkOrders(data.workOrders);
        if (data.ideaPortfolio) setIdeaPortfolio(data.ideaPortfolio);
        if (data.riskChecks) setRiskChecks(data.riskChecks);
        if (data.releaseChecks) setReleaseChecks(data.releaseChecks);
        alert('Đã khôi phục dữ liệu backup thành công!');
      } catch (err) {
        alert('Lỗi: File JSON không đúng định dạng hoặc bị lỗi!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 text-text-primary">
      <section className="rounded-3xl border border-border-primary bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-info/20 bg-info/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-info">
              <Receipt className="h-3.5 w-3.5" /> Multi-Industry Founder Simulation Lab
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Lab học tập kế toán - kiểm toán đa ngành, mô phỏng sản phẩm và vận hành công ty solo founder</h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">Module này không phải phần mềm nhập liệu kế toán thay MISA AMIS, Bravo hay ERP. Đây là phòng học, R&amp;D, mô phỏng và điều hành: kế toán/kiểm toán đa ngành, lập trình sản phẩm/app/game, AI agent workforce, marketing, tài chính và quy trình vận hành với chi phí thấp nhất.</p>
          </div>
          <button onClick={() => copyText()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-bold text-slate-950"><Copy className="h-4 w-4" />{copied === 'report' ? 'Đã copy' : 'Copy báo cáo mô phỏng'}</button>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border-primary/60 pt-4">
          <div className="flex flex-wrap gap-2">
            {TAB_LABELS.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  tab === id 
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/10' 
                    : 'border border-border-primary bg-bg-surface text-text-secondary hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary">Mẫu nghiệp vụ:</span>
            <select
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value as any)}
              className="rounded-xl border border-border-primary bg-bg-primary px-3 py-1.5 text-xs font-bold text-text-primary outline-none focus:border-cyan-400 cursor-pointer"
            >
              {INDUSTRY_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-warning/25 bg-warning/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-100">
          <ShieldCheck className="h-4 w-4 text-warning" />
          Boundary note
        </h2>
        <p className="text-xs font-semibold leading-7 text-text-secondary">
          Toan bo so lieu, case va ket qua tinh trong workspace nay la du lieu mo phong offline-first, phuc vu hoc tap, thiet ke san pham va kiem thu y tuong.
          Truoc khi ap dung vao ho so ke toan, thue, phap ly hoac quyet dinh kinh doanh that, can co ke toan/nguoi duyet chuyen mon xac nhan cuoi.
        </p>
      </section>

      {tab === 'deepdive' && (
        <div className="space-y-6">
          <VasAccountingCards />
          <AccountingVietnamDeepDivePanel />
        </div>
      )}

      {tab === 'dashboard' && (
        <section className="space-y-6">
          {/* Section: Founder Health & Backup Center */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Founder Health Score Card */}
            <Card className="lg:col-span-2 flex flex-col justify-between border-info/20 bg-info/10">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-info flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Founder Health Index / Chỉ số sức khỏe vận hành
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Đo lường mức độ tối ưu hóa vận hành, sự cân bằng sản phẩm, dòng tiền mô phỏng, mức độ kiểm soát rủi ro và hiệu suất của AI Workforce.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-6 items-center">
                  <div className="relative flex items-center justify-center h-24 w-24 rounded-full border-4 border-border-primary bg-bg-primary">
                    <span className="text-3xl font-bold text-text-primary">{founderHealthScore}</span>
                    <span className="absolute bottom-1 text-[8px] font-bold uppercase text-text-secondary">/100</span>
                  </div>
                  <div className="flex-1 space-y-2.5 w-full">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-text-secondary mb-0.5">
                        <span>Đánh giá ý tưởng (R&amp;D): {avgIdeaScore.toFixed(0)}đ</span>
                        <span>Weight: 30%</span>
                      </div>
                      <div className="w-full bg-bg-primary rounded-full h-1 border border-border-secondary">
                        <div className="bg-emerald-400 h-1 rounded-full" style={{ width: `${Math.min(100, avgIdeaScore * 1.25)}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-text-secondary mb-0.5">
                        <span>AI Task Velocity: {workOrdersDoneRatio.toFixed(0)}%</span>
                        <span>Weight: 30%</span>
                      </div>
                      <div className="w-full bg-bg-primary rounded-full h-1 border border-border-secondary">
                        <div className="bg-cyan-400 h-1 rounded-full" style={{ width: `${workOrdersDoneRatio}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-text-secondary mb-0.5">
                        <span>Quản lý dòng tiền/chi phí: {Math.max(0, 100 - Math.abs(100 - result.budgetUsed)).toFixed(0)}%</span>
                        <span>Weight: 20%</span>
                      </div>
                      <div className="w-full bg-bg-primary rounded-full h-1 border border-border-secondary">
                        <div className="bg-amber-400 h-1 rounded-full" style={{ width: `${Math.max(0, 100 - Math.abs(100 - result.budgetUsed))}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-text-secondary mb-0.5">
                        <span>Đã rà soát rủi ro &amp; checklist release: {riskAndReleaseRatio.toFixed(0)}%</span>
                        <span>Weight: 20%</span>
                      </div>
                      <div className="w-full bg-bg-primary rounded-full h-1 border border-border-secondary">
                        <div className="bg-purple-400 h-1 rounded-full" style={{ width: `${riskAndReleaseRatio}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`mt-4 border border-dashed rounded-xl p-2.5 text-center text-xs font-bold uppercase ${healthStatus.color}`}>
                Trạng thái: {healthStatus.text}
              </div>
            </Card>

            {/* Backup & Restore Card */}
            <Card className="border-border-primary flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-brand" /> Backup &amp; Recovery
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Xuất dữ liệu quyết định (Decision Log), Work Orders và ý tưởng của bạn ra file JSON để lưu trữ hoặc nạp lại khi đổi thiết bị.
                </p>
              </div>
              <div className="mt-4 space-y-3">
                <button
                  onClick={handleExportBackup}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-xs font-bold text-text-primary hover:bg-purple-400"
                >
                  <Download className="h-4 w-4" /> Xuất file dữ liệu JSON
                </button>
                <div className="relative w-full">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    id="import-backup-file"
                    className="hidden"
                  />
                  <label
                    htmlFor="import-backup-file"
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-border-primary bg-bg-primary py-2.5 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer hover:border-border-secondary font-bold"
                  >
                    <Upload className="h-4 w-4" /> Nhập từ file JSON backup
                  </label>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card><p className="text-xs text-info">{activeTemplate.budgetUsedLabel}</p><p className="mt-2 text-3xl font-bold text-text-primary">{result.budgetUsed.toFixed(1)}%</p><p className="mt-2 text-xs text-text-secondary">Tỷ lệ sử dụng thực tế</p></Card>
            <Card><p className="text-xs text-warning">{activeTemplate.advanceLeftLabel}</p><p className="mt-2 text-2xl font-bold text-text-primary">{money(result.advanceLeft)}đ</p><p className="mt-2 text-xs text-text-secondary">Số dư treo chưa hoàn</p></Card>
            <Card><p className="text-xs text-success">Idea score</p><p className="mt-2 text-3xl font-bold text-text-primary">{simulation.productScore}/100</p><p className="mt-2 text-xs text-text-secondary">Điểm ý tưởng đang mô phỏng</p></Card>
            <Card><p className="text-xs text-error">Founder risk</p><p className="mt-2 text-3xl font-bold text-text-primary">{Math.max(result.riskScore, Math.round(simulation.risk))}/100</p><p className="mt-2 text-xs text-text-secondary">Rủi ro tổng hợp</p></Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {FOUNDER_DAILY_KPI_DASHBOARD.map((item) => <Card key={item.group}><h2 className="text-sm font-bold text-text-primary">{item.group}</h2><p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">{item.purpose}</p><p className="mt-4 text-[10px] font-bold uppercase text-info">KPI nên theo dõi</p><BulletList items={item.kpis} className="text-cyan-100" /><p className="mt-4 rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs font-bold leading-6 text-amber-100">Cảnh báo: {item.warning}</p></Card>)}
          </div>
        </section>
      )}

      {tab === 'cases' && (
        <div className="space-y-6">
          <CosoControlFailureCase />
          <section className="grid gap-4 lg:grid-cols-4">{SIM_CASES.map((item) => <Card key={item.title}><BookOpen className="mb-3 h-5 w-5 text-info" /><h2 className="text-sm font-bold text-text-primary">{item.title}</h2><p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">{item.lesson}</p><p className="mt-3 rounded-xl border border-brand/20 bg-brand/5 p-3 text-xs font-semibold leading-6 text-purple-100">{item.hint}</p></Card>)}</section>
        </div>
      )}

      {tab === 'costs' && <section className="grid gap-4 lg:grid-cols-2">{COST_TYPE_KNOWLEDGE.map((item) => <Card key={item.type}><WalletCards className="mb-3 h-5 w-5 text-success" /><h2 className="text-sm font-bold text-text-primary">Thẻ học: {item.type}</h2><p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">Ví dụ: {item.examples}</p><p className="mt-3 text-[10px] font-bold uppercase text-info">Hồ sơ nên có</p><BulletList items={item.documents} className="text-cyan-100" /><p className="mt-3 text-[10px] font-bold uppercase text-warning">Điểm cần quan sát trong mô phỏng</p><BulletList items={item.risks} className="text-amber-100" /></Card>)}</section>}

      {tab === 'docs' && <section className="grid gap-4 lg:grid-cols-2">{DOCUMENT_CHECKLIST_RULES.map((item) => <Card key={item.scenario}><FileText className="mb-3 h-5 w-5 text-info" /><h2 className="text-sm font-bold text-text-primary">Quiz hồ sơ: {item.scenario}</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-success/20 bg-success/5 p-4"><BulletList items={item.minimumDocs} /></div><div className="rounded-xl border border-error/20 bg-error/5 p-4"><BulletList items={item.redFlags} /></div></div></Card>)}</section>}

      {tab === 'score' && (
        <div className="space-y-6">
          <FrictionalCostCalculator />
          <section className="grid gap-4 lg:grid-cols-5"><Card className="lg:col-span-2"><h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary"><Calculator className="h-4 w-4 text-info" />Score lab ({activeTemplate.name})</h2><div className="space-y-3"><NumberInput label={activeTemplate.budgetLabel} value={budget} setValue={setBudget} /><NumberInput label={activeTemplate.actualLabel} value={actual} setValue={setActual} /><NumberInput label={activeTemplate.advanceLabel} value={advance} setValue={setAdvance} /><NumberInput label={activeTemplate.settledLabel} value={settled} setValue={setSettled} /></div></Card><div className="grid gap-4 lg:col-span-3 md:grid-cols-3"><Card><p className="text-xs text-info">{activeTemplate.budgetUsedLabel}</p><p className="mt-2 text-3xl font-bold text-text-primary">{result.budgetUsed.toFixed(1)}%</p></Card><Card><p className="text-xs text-warning">{activeTemplate.advanceLeftLabel}</p><p className="mt-2 text-2xl font-bold text-text-primary">{money(result.advanceLeft)}đ</p></Card><Card><p className="text-xs text-error">Risk score</p><p className="mt-2 text-3xl font-bold text-text-primary">{result.riskScore}/100</p></Card><Card className="md:col-span-3"><h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary"><ShieldCheck className="h-4 w-4 text-success" />KPI học tập</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{ACCOUNTING_CONTROL_KPIS.map((item) => <div key={item.kpi} className="rounded-xl border border-border-primary bg-bg-primary p-4"><h3 className="text-xs font-bold text-text-primary">{item.kpi}</h3><code className="mt-3 block rounded-lg bg-black/30 p-3 text-[11px] font-bold text-info">{item.formula}</code><p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">{item.use}</p></div>)}</div></Card></div></section>
        </div>
      )}

      {tab === 'simulator' && <section className="grid gap-4 lg:grid-cols-5"><Card className="lg:col-span-2"><h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-primary"><Calculator className="h-4 w-4 text-info" />Founder what-if simulator</h2><label className="mb-3 block"><span className="mb-1 block text-xs font-bold text-text-secondary">Kịch bản mô phỏng</span><select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)} className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-sm font-bold text-text-primary outline-none focus:border-cyan-400">{FOUNDER_SIMULATOR_SCENARIOS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><div className="grid gap-3 md:grid-cols-2"><NumberInput label="Doanh thu/giá trị kỳ vọng" value={revenue} setValue={setRevenue} /><NumberInput label="Giá vốn/chi phí trực tiếp" value={cost} setValue={setCost} /><NumberInput label="Chi phí vận hành/MVP" value={opsCost} setValue={setOpsCost} /><NumberInput label="Pain score 1-10" value={pain} setValue={setPain} /><NumberInput label="Buyer clarity 1-10" value={buyer} setValue={setBuyer} /><NumberInput label="MVP rẻ 1-10" value={mvpCheap} setValue={setMvpCheap} /><NumberInput label="Kênh bán 1-10" value={distribution} setValue={setDistribution} /><NumberInput label="Rủi ro kỹ thuật 1-10" value={techRisk} setValue={setTechRisk} /></div></Card><div className="space-y-4 lg:col-span-3"><Card><p className="text-xs font-bold uppercase text-info">{selectedScenario.industry}</p><h2 className="mt-2 text-lg font-bold text-text-primary">{selectedScenario.name}</h2><p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">{selectedScenario.description}</p><div className="mt-4 grid gap-3 md:grid-cols-2"><div><p className="text-[10px] font-bold uppercase text-info">Input</p><BulletList items={selectedScenario.inputs} className="text-cyan-100" /></div><div><p className="text-[10px] font-bold uppercase text-success">Output</p><BulletList items={selectedScenario.outputs} className="text-emerald-100" /></div></div></Card><div className="grid gap-4 md:grid-cols-4"><Card><p className="text-xs text-info">Gross margin</p><p className="mt-2 text-2xl font-bold text-text-primary">{simulation.grossMargin.toFixed(1)}%</p></Card><Card><p className="text-xs text-success">Lãi/lỗ mô phỏng</p><p className="mt-2 text-xl font-bold text-text-primary">{money(simulation.netProfit)}đ</p></Card><Card><p className="text-xs text-warning">Idea score</p><p className="mt-2 text-2xl font-bold text-text-primary">{simulation.productScore}/100</p></Card><Card><p className="text-xs text-error">Risk</p><p className="mt-2 text-2xl font-bold text-text-primary">{simulation.risk.toFixed(0)}/100</p></Card></div><Card><p className="text-xs font-bold uppercase text-warning">Kết luận mô phỏng</p><p className="mt-3 text-base font-bold text-text-primary">{simulation.verdict}</p><p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">Rule: {selectedScenario.goNoGoRule}</p><div className="mt-4 grid gap-2 md:grid-cols-5">{PRODUCT_IDEA_SCORE_FACTORS.map((x) => <div key={x.factor} className="rounded-xl border border-border-primary bg-bg-primary p-3"><p className="text-xs font-bold text-text-primary">{x.factor}</p><p className="mt-2 text-[11px] leading-5 text-text-secondary">{x.meaning}</p></div>)}</div></Card></div></section>}

      {tab === 'decisions' && <section className="space-y-4"><Card><h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">Decision Log của founder</h2><p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">Lưu tạm bằng localStorage trên trình duyệt, chưa cần backend để tiết kiệm chi phí MVP.</p><div className="mt-4 flex gap-2"><input value={newDecision} onChange={(e) => setNewDecision(e.target.value)} placeholder="Nhập quyết định mới..." className="flex-1 rounded-xl border border-border-primary bg-bg-primary p-3 text-sm font-bold text-text-primary outline-none focus:border-cyan-400" /><button onClick={addDecision} className="rounded-xl bg-cyan-400 px-4 text-xs font-bold text-slate-950">Thêm</button></div></Card><div className="grid gap-4 lg:grid-cols-2">{decisions.map((item, index) => <Card key={`${item.decision}-${index}`}><p className="text-[10px] font-bold uppercase text-info">Decision #{decisions.length - index}</p><h2 className="mt-2 text-sm font-bold text-text-primary">{item.decision}</h2><p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">Lý do: {item.reason}</p><p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">Bằng chứng: {item.evidence}</p><p className="mt-3 rounded-xl border border-success/20 bg-success/5 p-3 text-xs font-bold leading-6 text-emerald-100">Bước tiếp: {item.nextAction}</p></Card>)}</div></section>}

      {tab === 'work_orders' && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-border-primary bg-bg-surface p-6">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-info" /> AI Agent Work Orders
            </h2>
            <p className="mt-2 text-xs text-text-secondary">
              Quản lý các nhiệm vụ giao cho AI Agent PM, QA, Dev, Marketer và Auditor. Cập nhật trạng thái để theo dõi tiến độ.
            </p>
            
            {/* Form thêm Work Order mới */}
            <div className="mt-6 border-t border-border-primary/60 pt-4">
              <h3 className="text-xs font-bold text-info uppercase tracking-wider mb-3">Tạo Work Order mới</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">Tên nhiệm vụ / Task</span>
                  <input
                    type="text"
                    value={newWoTask}
                    onChange={(e) => setNewWoTask(e.target.value)}
                    placeholder="Ví dụ: Phân tích hành vi đối thủ trên X"
                    className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-sm font-bold text-text-primary outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">AI Agent đảm nhận</span>
                  <select
                    value={newWoAgent}
                    onChange={(e) => setNewWoAgent(e.target.value)}
                    className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-sm font-bold text-text-primary outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="AI Chief of Staff">AI Chief of Staff</option>
                    <option value="AI Product Manager">AI Product Manager</option>
                    <option value="AI Fullstack Dev">AI Fullstack Dev</option>
                    <option value="AI Auditor">AI Auditor</option>
                    <option value="AI Marketer">AI Marketer</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">Đầu vào (cách nhau bằng dấu phẩy)</span>
                  <input
                    type="text"
                    value={newWoInput}
                    onChange={(e) => setNewWoInput(e.target.value)}
                    placeholder="Ví dụ: link repo, tài liệu hướng dẫn"
                    className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-sm font-bold text-text-primary outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">Đầu ra mong muốn (cách nhau bằng dấu phẩy)</span>
                  <input
                    type="text"
                    value={newWoOutput}
                    onChange={(e) => setNewWoOutput(e.target.value)}
                    placeholder="Ví dụ: báo cáo so sánh, checklist test"
                    className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-sm font-bold text-text-primary outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block lg:col-span-2">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">Founder Review (Yêu cầu duyệt)</span>
                  <input
                    type="text"
                    value={newWoReview}
                    onChange={(e) => setNewWoReview(e.target.value)}
                    placeholder="Ví dụ: Cần check kỹ chi phí API trước khi deploy..."
                    className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-sm font-bold text-text-primary outline-none focus:border-cyan-400"
                  />
                </label>
              </div>
              <button
                onClick={() => {
                  if (!newWoTask.trim()) return;
                  const newWo = {
                    id: `WO-${String(workOrders.length + 1).padStart(3, '0')}`,
                    status: 'Ready',
                    ownerAgent: newWoAgent,
                    task: newWoTask.trim(),
                    input: newWoInput ? newWoInput.split(',').map(s => s.trim()) : [],
                    expectedOutput: newWoOutput ? newWoOutput.split(',').map(s => s.trim()) : [],
                    founderReview: newWoReview.trim() || 'Không có ghi chú đặc biệt.'
                  };
                  setWorkOrders([...workOrders, newWo]);
                  setNewWoTask('');
                  setNewWoInput('');
                  setNewWoOutput('');
                  setNewWoReview('');
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 font-bold"
              >
                <Plus className="h-4 w-4" /> Thêm Work Order
              </button>
            </div>
          </div>

          {/* Kanban / Cards Board */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {['Ready', 'In Progress', 'Reviewing', 'Done'].map((status) => {
              const items = workOrders.filter((w) => w.status === status);
              return (
                <div key={status} className="rounded-2xl border border-border-primary bg-bg-primary p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold uppercase text-text-secondary tracking-wider">
                      {status === 'Ready' && 'Ready / Chuẩn bị'}
                      {status === 'In Progress' && 'In Progress / Đang chạy'}
                      {status === 'Reviewing' && 'Reviewing / Đang duyệt'}
                      {status === 'Done' && 'Done / Đã xong'}
                    </h3>
                    <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                      {items.length}
                    </span>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    {items.map((wo) => (
                      <Card key={wo.id} className="p-4 border-border-secondary bg-bg-surface relative">
                        <div className="flex items-start justify-between">
                          <span className="rounded bg-info px-1.5 py-0.5 text-[9px] font-bold text-info">
                            {wo.id}
                          </span>
                          <button
                            onClick={() => {
                              setWorkOrders(workOrders.filter((w) => w.id !== wo.id));
                            }}
                            className="text-text-muted hover:text-error transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <h4 className="mt-2 text-xs font-bold text-text-primary">{wo.task}</h4>
                        <p className="mt-1 text-[10px] font-bold text-slate-450">Agent: {wo.ownerAgent}</p>
                        
                        <div className="mt-3 space-y-2 text-[10px] text-text-secondary border-t border-border-primary/50 pt-2">
                          {wo.input && wo.input.length > 0 && (
                            <div>
                              <span className="font-bold text-text-secondary">Đầu vào:</span>
                              <BulletList items={wo.input} className="text-text-secondary" />
                            </div>
                          )}
                          {wo.expectedOutput && wo.expectedOutput.length > 0 && (
                            <div>
                              <span className="font-bold text-emerald-450">Đầu ra:</span>
                              <BulletList items={wo.expectedOutput} className="text-emerald-350" />
                            </div>
                          )}
                          {wo.founderReview && (
                            <div className="mt-2 rounded bg-warning/5 border border-warning/10 p-1.5">
                              <span className="font-bold text-warning">Duyệt:</span> {wo.founderReview}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center gap-1.5 pt-2 border-t border-border-secondary">
                          <span className="text-[9px] text-text-secondary font-bold">Trạng thái:</span>
                          <select
                            value={wo.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              setWorkOrders(
                                workOrders.map((w) => (w.id === wo.id ? { ...w, status: newStatus } : w))
                              );
                            }}
                            className="rounded bg-bg-primary text-[10px] font-bold px-1.5 py-0.5 border border-border-primary text-text-primary outline-none focus:border-cyan-400 cursor-pointer"
                          >
                            <option value="Ready">Ready</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Reviewing">Reviewing</option>
                            <option value="Done">Done</option>
                          </select>
                        </div>
                      </Card>
                    ))}
                    {items.length === 0 && (
                      <div className="border border-dashed border-border-primary/40 rounded-xl p-4 text-center text-[10px] text-text-muted font-medium">
                        Trống
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'ideas' && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-border-primary bg-bg-surface p-6">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Target className="h-5 w-5 text-success" /> Product Idea Portfolio
            </h2>
            <p className="mt-2 text-xs text-text-secondary">
              Đánh giá ưu tiên các ý tưởng app, game, tính năng bằng ma trận điểm (Priority Scoring Matrix). Các ý tưởng sẽ tự động xếp hạng GO (xanh), HOLD (vàng) hoặc NO-GO (đỏ).
            </p>
            
            {/* Form thêm ý tưởng mới */}
            <div className="mt-6 border-t border-border-primary/60 pt-4">
              <h3 className="text-xs font-bold text-success uppercase tracking-wider mb-3">Thêm Ý Tưởng Mới</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">Tên ý tưởng / Sản phẩm</span>
                  <input
                    type="text"
                    value={newIdeaName}
                    onChange={(e) => setNewIdeaName(e.target.value)}
                    placeholder="Ví dụ: AI Mock Interviewer"
                    className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-sm font-bold text-text-primary outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">Khách hàng mục tiêu</span>
                  <input
                    type="text"
                    value={newIdeaTarget}
                    onChange={(e) => setNewIdeaTarget(e.target.value)}
                    placeholder="Ví dụ: Lập trình viên mới tốt nghiệp"
                    className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-sm font-bold text-text-primary outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">MVP Dự kiến</span>
                  <input
                    type="text"
                    value={newIdeaMvpDesc}
                    onChange={(e) => setNewIdeaMvpDesc(e.target.value)}
                    placeholder="Ví dụ: Landing page + form đăng ký thử và link gg meet"
                    className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-sm font-bold text-text-primary outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">Mô hình thu phí (Monetization)</span>
                  <input
                    type="text"
                    value={newIdeaMonetization}
                    onChange={(e) => setNewIdeaMonetization(e.target.value)}
                    placeholder="Ví dụ: 199k/tháng hoặc bán token"
                    className="w-full rounded-xl border border-border-primary bg-bg-primary p-3 text-sm font-bold text-text-primary outline-none focus:border-cyan-400"
                  />
                </label>
              </div>

              {/* Sliders chấm điểm */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-5 border-t border-border-primary/40 pt-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">Pain (Độ đau) 1-10: {newIdeaPain}</span>
                  <input
                    type="range" min="1" max="10"
                    value={newIdeaPain}
                    onChange={(e) => setNewIdeaPain(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">Buyer Clarity 1-10: {newIdeaBuyer}</span>
                  <input
                    type="range" min="1" max="10"
                    value={newIdeaBuyer}
                    onChange={(e) => setNewIdeaBuyer(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">MVP Cheapness 1-10: {newIdeaMvpCheap}</span>
                  <input
                    type="range" min="1" max="10"
                    value={newIdeaMvpCheap}
                    onChange={(e) => setNewIdeaMvpCheap(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">Kênh Bán 1-10: {newIdeaDist}</span>
                  <input
                    type="range" min="1" max="10"
                    value={newIdeaDist}
                    onChange={(e) => setNewIdeaDist(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-text-secondary">Rủi ro kỹ thuật 1-10: {newIdeaTechRisk}</span>
                  <input
                    type="range" min="1" max="10"
                    value={newIdeaTechRisk}
                    onChange={(e) => setNewIdeaTechRisk(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </label>
              </div>

              <button
                onClick={() => {
                  if (!newIdeaName.trim()) return;
                  const newIdea = {
                    idea: newIdeaName.trim(),
                    targetUser: newIdeaTarget.trim() || 'Chưa định nghĩa',
                    pain: newIdeaPain,
                    buyer: newIdeaBuyer,
                    mvpCheapness: newIdeaMvpCheap,
                    distribution: newIdeaDist,
                    technicalRisk: newIdeaTechRisk,
                    firstMvp: newIdeaMvpDesc.trim() || 'Chưa rõ',
                    monetization: newIdeaMonetization.trim() || 'Chưa rõ'
                  };
                  setIdeaPortfolio([...ideaPortfolio, newIdea]);
                  setNewIdeaName('');
                  setNewIdeaTarget('');
                  setNewIdeaMvpDesc('');
                  setNewIdeaMonetization('');
                  setNewIdeaPain(5);
                  setNewIdeaBuyer(5);
                  setNewIdeaMvpCheap(5);
                  setNewIdeaDist(5);
                  setNewIdeaTechRisk(5);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-450 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-350 font-bold"
              >
                <Plus className="h-4 w-4" /> Thêm Ý Tưởng
              </button>
            </div>
          </div>

          {/* List items */}
          <div className="grid gap-4 lg:grid-cols-2">
            {ideaPortfolio.map((item, idx) => {
              const buyerVal = item.buyer !== undefined ? item.buyer : (item.buyerClarity !== undefined ? item.buyerClarity : 7);
              const score = Math.round(
                item.pain * 3 +
                buyerVal * 2 +
                item.mvpCheapness * 2 +
                item.distribution * 1.5 -
                item.technicalRisk * 1.5
              );
              
              let badgeText = 'NO-GO';
              let badgeColor = 'bg-error/10 border-error/30 text-rose-450';
              if (score >= 40) {
                badgeText = 'GO';
                badgeColor = 'bg-success/10 border-success/30 text-emerald-450';
              } else if (score >= 30) {
                badgeText = 'HOLD';
                badgeColor = 'bg-warning/10 border-warning/30 text-amber-450';
              }

              return (
                <Card key={`${item.idea}-${idx}`} className="border-border-primary bg-bg-surface p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-text-secondary font-bold uppercase">Ý tưởng #{idx + 1}</span>
                        <h3 className="text-sm font-bold text-text-primary mt-0.5">{item.idea}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`border px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${badgeColor}`}>
                          {badgeText} ({score}đ)
                        </span>
                        <button
                          onClick={() => {
                            setIdeaPortfolio(ideaPortfolio.filter((_, i) => i !== idx));
                          }}
                          className="text-text-muted hover:text-error p-0.5 transition-colors"
                          title="Xóa ý tưởng"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-bold text-text-secondary">User: <span className="text-text-secondary font-semibold">{item.targetUser}</span></p>
                    
                    <div className="mt-3 grid grid-cols-5 gap-1.5 text-center text-[10px] border-y border-border-primary/50 py-2 my-3">
                      <div>
                        <p className="font-bold text-slate-550">Pain</p>
                        <p className="font-bold text-info mt-0.5">{item.pain}/10</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-550">Buyer</p>
                        <p className="font-bold text-info mt-0.5">{buyerVal}/10</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-550">MVP Rẻ</p>
                        <p className="font-bold text-info mt-0.5">{item.mvpCheapness}/10</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-550">Kênh Bán</p>
                        <p className="font-bold text-info mt-0.5">{item.distribution}/10</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-550">Kỹ Thuật</p>
                        <p className="font-bold text-rose-450 mt-0.5">-{item.technicalRisk}/10</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <p className="text-text-secondary leading-6"><strong className="text-text-secondary">MVP 1:</strong> {item.firstMvp || 'Chưa định nghĩa'}</p>
                      <p className="text-text-secondary leading-6"><strong className="text-text-secondary">Thu phí:</strong> {item.monetization || 'Chưa định nghĩa'}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'sops' && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-border-primary bg-bg-surface p-6">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-300" /> Operating SOP Library
            </h2>
            <p className="mt-2 text-xs text-text-secondary">
              Quy trình vận hành chuẩn (SOP) phục vụ Solo Founder. Bấm <strong>Copy SOP Prompt</strong> để xuất prompt hoàn chỉnh để nạp cho AI của bạn làm việc đúng chuẩn.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {OPERATING_SOP_LIBRARY.map((item, idx) => {
              // Build prompt text
              const promptText = `Bạn là một AI Agent đắc lực hỗ trợ điều hành doanh nghiệp solo founder. Hãy giúp tôi hoàn thành nhiệm vụ theo quy trình vận hành SOP chuẩn sau đây:
Tên SOP: ${item.sop}
Trigger/Sự kiện kích hoạt: ${item.trigger}
Các bước thực hiện:
${item.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}
Đầu ra mong muốn (Expected Output):
- ${item.output}

Vui lòng hỗ trợ tôi thực hiện bước đầu tiên hoặc đặt câu hỏi làm rõ nếu cần thiết.`;

              return (
                <Card key={item.sop} className="flex flex-col justify-between p-5 border-border-primary bg-bg-surface">
                  <div>
                    <h3 className="text-sm font-bold text-purple-300">{item.sop}</h3>
                    <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary border-l-2 border-brand/50 pl-2">
                      <strong className="text-text-secondary">Trigger: </strong> {item.trigger}
                    </p>
                    <div className="mt-4">
                      <span className="text-[10px] font-bold uppercase text-info tracking-wider">Các bước thực hiện:</span>
                      <div className="mt-1 space-y-1">
                        {item.steps.map((step, sIdx) => (
                          <p key={sIdx} className="text-xs font-semibold leading-6 text-text-secondary">• {step}</p>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 rounded bg-bg-primary p-3 border border-border-primary/40">
                      <span className="text-[10px] font-bold uppercase text-success tracking-wider">Đầu ra yêu cầu:</span>
                      <p className="mt-1 text-xs font-medium text-text-secondary">{item.output}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border-primary/60 flex items-center justify-between">
                    <button
                      onClick={() => copyText(promptText, `sop-${idx}`)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-650 px-3 py-2 text-xs font-bold text-text-primary hover:bg-purple-550 transition-all font-bold"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied === `sop-${idx}` ? 'Đã copy Prompt' : 'Copy SOP Prompt'}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'audit' && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-border-primary bg-bg-surface p-6">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-warning" /> Risk &amp; Release Audit
            </h2>
            <p className="mt-2 text-xs text-text-secondary">
              Kiểm toán nội bộ và quản trị rủi ro phát hành sản phẩm. Đánh dấu các checklist rà soát rủi ro để đảm bảo tính an toàn dữ liệu và pháp lý cho ứng dụng.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Risk Register */}
            <Card className="border-border-primary">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border-primary/60 pb-3 mb-4">
                <AlertTriangle className="h-4 w-4 text-rose-450" /> Bảng Kiểm Soát Rủi Ro (Risk Register)
              </h3>
              
              <div className="space-y-4">
                {FOUNDER_RISK_REGISTER.map((item, idx) => {
                  const isChecked = !!riskChecks[item.risk];
                  const severityColors = 
                    item.severity === 'High' 
                      ? 'text-rose-450 bg-error/10 border-error/20' 
                      : 'text-amber-450 bg-warning/10 border-warning/20';

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${isChecked ? 'bg-bg-primary border-border-primary' : 'bg-bg-surface border-border-primary/80'} transition-all`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setRiskChecks({
                                ...riskChecks,
                                [item.risk]: e.target.checked
                              });
                            }}
                            className="mt-1 h-4 w-4 rounded border-border-primary text-info bg-bg-primary outline-none accent-cyan-400"
                          />
                          <div>
                            <h4 className={`text-xs font-bold ${isChecked ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                              {item.risk}
                            </h4>
                            <p className="mt-1 text-[11px] text-text-secondary">
                              <strong className="text-text-muted">Tín hiệu:</strong> {item.signal}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-350">
                              <strong className="text-text-secondary">Kiểm soát:</strong> {item.control}
                            </p>
                          </div>
                        </label>
                        <span className={`border px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${severityColors}`}>
                          {item.severity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Release Readiness Checklist */}
            <Card className="border-border-primary">
              <div className="flex items-center justify-between border-b border-border-primary/60 pb-3 mb-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-450" /> Danh mục Kiểm toán Release
                </h3>
                
                {/* Readiness Percentage */}
                {(() => {
                  const checkedCount = RELEASE_READINESS_CHECKLIST.filter(item => releaseChecks[item]).length;
                  const totalCount = RELEASE_READINESS_CHECKLIST.length;
                  const ratio = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
                  return (
                    <div className="text-right">
                      <span className="text-xs font-bold text-success">{ratio}% Đủ ĐK</span>
                    </div>
                  );
                })()}
              </div>

              {/* Progress bar */}
              {(() => {
                const checkedCount = RELEASE_READINESS_CHECKLIST.filter(item => releaseChecks[item]).length;
                const totalCount = RELEASE_READINESS_CHECKLIST.length;
                const ratio = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
                return (
                  <div className="w-full bg-bg-primary rounded-full h-1.5 mb-4 border border-border-primary">
                    <div
                      className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${ratio}%` }}
                    ></div>
                  </div>
                );
              })()}

              <div className="space-y-3">
                {RELEASE_READINESS_CHECKLIST.map((item, idx) => {
                  const isChecked = !!releaseChecks[item];
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked 
                          ? 'bg-bg-primary border-border-primary/50 text-text-muted' 
                          : 'bg-bg-surface border-border-primary hover:border-border-secondary text-slate-350'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          setReleaseChecks({
                            ...releaseChecks,
                            [item]: e.target.checked
                          });
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-border-primary text-info bg-bg-primary outline-none accent-cyan-400"
                      />
                      <span className={`text-xs font-bold leading-6 ${isChecked ? 'line-through' : ''}`}>
                        {item}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Card>
          </div>
        </section>
      )}

      {tab === 'casebank' && <section className="grid gap-4 lg:grid-cols-3">{ADVANCED_CONSTRUCTION_CASES.map((item) => <Card key={item.title}><BookOpen className="mb-3 h-5 w-5 text-purple-300" /><h2 className="text-sm font-bold text-text-primary">{item.title}</h2><p className="mt-3 text-xs font-semibold leading-6 text-text-secondary">{item.situation}</p><p className="mt-4 text-[10px] font-bold uppercase text-info">Trọng tâm kế toán</p><BulletList items={item.accountingFocus} className="text-cyan-100" /><p className="mt-4 text-[10px] font-bold uppercase text-warning">Câu hỏi kiểm soát</p><BulletList items={item.controlQuestions} className="text-amber-100" /></Card>)}</section>}

      <section className="rounded-2xl border border-success/20 bg-success/5 p-5"><h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-success"><CheckCircle2 className="h-4 w-4" />Ranh giới module</h2><p className="text-xs font-semibold leading-7 text-text-secondary">Đây là simulation lab và company operating system cho solo founder: học bằng case giả lập, mô phỏng khảo sát, lập kế hoạch sản phẩm và quản lý AI agent. Dữ liệu chạy offline-first bằng static data/localStorage, không thay phần mềm kế toán, không thay văn bản pháp lý hiện hành và không thay người duyệt chuyên môn.</p></section>
    </div>
  );
}

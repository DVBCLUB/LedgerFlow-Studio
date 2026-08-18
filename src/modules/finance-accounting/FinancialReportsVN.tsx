import React, { useState, useMemo, useEffect } from 'react';
import { BarChart2, FileText, Download, RefreshCw, TrendingUp, TrendingDown, DollarSign, Package, Users, Building2, ChevronDown, ChevronRight, Info, AlertTriangle, CheckCircle2, Scale, Layers, ArrowRightLeft } from 'lucide-react';
import { listBusinessEntities } from '../../utils/businessApi';

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportTab = 'b01' | 'b02' | 'b03' | 'analysis';

interface AccountBalance {
  code: string;
  name: string;
  debit: number;
  credit: number;
  group: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtVND(n: number) {
  if (n === 0) return '—';
  const abs = Math.abs(n);
  const s = abs >= 1_000_000_000
    ? `${(abs/1_000_000_000).toFixed(1)} tỷ`
    : abs >= 1_000_000
    ? `${(abs/1_000_000).toFixed(1)} triệu`
    : abs.toLocaleString('vi-VN');
  return (n < 0 ? '-' : '') + s + ' ₫';
}
function pct(a: number, b: number) { return b === 0 ? 0 : ((a / b) * 100); }

// ─── Mock account data ────────────────────────────────────────────────────────
// In production, this would be loaded from CustomDataWorkbench localStorage
const STORAGE_KEY_JOURNAL = 'lf_journal_entries';
const STORAGE_KEY_ACCOUNTS = 'lf_accounts';

function loadBalances(): AccountBalance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default demo data (Thông tư 200 account codes)
  return [
    // Current assets
    { code: '111', name: 'Tiền mặt', debit: 85_000_000, credit: 0, group: 'current_asset' },
    { code: '112', name: 'Tiền gửi ngân hàng', debit: 320_000_000, credit: 0, group: 'current_asset' },
    { code: '131', name: 'Phải thu khách hàng', debit: 180_000_000, credit: 0, group: 'current_asset' },
    { code: '133', name: 'Thuế GTGT được khấu trừ', debit: 15_000_000, credit: 0, group: 'current_asset' },
    { code: '141', name: 'Tạm ứng', debit: 25_000_000, credit: 0, group: 'current_asset' },
    { code: '154', name: 'Chi phí SXKD dở dang', debit: 40_000_000, credit: 0, group: 'current_asset' },
    { code: '156', name: 'Hàng hóa', debit: 90_000_000, credit: 0, group: 'current_asset' },
    // Fixed assets
    { code: '211', name: 'Tài sản cố định hữu hình', debit: 500_000_000, credit: 0, group: 'fixed_asset' },
    { code: '214', name: 'Hao mòn TSCĐ', debit: 0, credit: 120_000_000, group: 'fixed_asset' },
    // Current liabilities
    { code: '331', name: 'Phải trả nhà cung cấp', debit: 0, credit: 95_000_000, group: 'current_liability' },
    { code: '333', name: 'Thuế và các khoản nộp NN', debit: 0, credit: 28_000_000, group: 'current_liability' },
    { code: '334', name: 'Phải trả người lao động', debit: 0, credit: 45_000_000, group: 'current_liability' },
    { code: '338', name: 'Phải trả phải nộp khác', debit: 0, credit: 12_000_000, group: 'current_liability' },
    // Long-term liabilities
    { code: '341', name: 'Vay và nợ thuê tài chính dài hạn', debit: 0, credit: 200_000_000, group: 'lt_liability' },
    // Equity
    { code: '411', name: 'Vốn điều lệ', debit: 0, credit: 500_000_000, group: 'equity' },
    { code: '421', name: 'Lợi nhuận sau thuế chưa phân phối', debit: 0, credit: 255_000_000, group: 'equity' },
    // Revenue
    { code: '511', name: 'Doanh thu bán hàng và cung cấp DV', debit: 0, credit: 1_200_000_000, group: 'revenue' },
    { code: '515', name: 'Doanh thu hoạt động tài chính', debit: 0, credit: 18_000_000, group: 'revenue' },
    // COGS
    { code: '632', name: 'Giá vốn hàng bán', debit: 720_000_000, credit: 0, group: 'cogs' },
    // Expenses
    { code: '641', name: 'Chi phí bán hàng', debit: 85_000_000, credit: 0, group: 'expense' },
    { code: '642', name: 'Chi phí QLDN', debit: 120_000_000, credit: 0, group: 'expense' },
    { code: '635', name: 'Chi phí tài chính', debit: 22_000_000, credit: 0, group: 'expense' },
    // Tax
    { code: '821', name: 'Chi phí thuế TNDN', debit: 14_000_000, credit: 0, group: 'tax' },
  ];
}

// ─── B01 Balance Sheet ────────────────────────────────────────────────────────
function B01Report({ balances }: { balances: AccountBalance[] }) {
  const get = (group: string) => balances.filter(b => b.group === group).reduce((s,b) => s + b.debit - b.credit, 0);

  const cash         = balances.filter(b => ['111','112'].includes(b.code)).reduce((s,b) => s+b.debit,0);
  const receivables  = balances.filter(b => ['131'].includes(b.code)).reduce((s,b) => s+b.debit,0);
  const vat          = balances.filter(b => ['133'].includes(b.code)).reduce((s,b) => s+b.debit,0);
  const advances     = balances.filter(b => ['141'].includes(b.code)).reduce((s,b) => s+b.debit,0);
  const inventory    = balances.filter(b => ['154','156'].includes(b.code)).reduce((s,b) => s+b.debit,0);
  const currentAssets= cash + receivables + vat + advances + inventory;

  const fixedGross   = balances.find(b=>b.code==='211')?.debit ?? 0;
  const depreciation = balances.find(b=>b.code==='214')?.credit ?? 0;
  const fixedNet     = fixedGross - depreciation;
  const totalAssets  = currentAssets + fixedNet;

  const payables     = balances.filter(b => ['331','338'].includes(b.code)).reduce((s,b) => s+b.credit,0);
  const taxPayable   = balances.find(b=>b.code==='333')?.credit ?? 0;
  const salaryPayable= balances.find(b=>b.code==='334')?.credit ?? 0;
  const curLiab      = payables + taxPayable + salaryPayable;
  const ltLiab       = balances.find(b=>b.code==='341')?.credit ?? 0;
  const totalLiab    = curLiab + ltLiab;

  const capital      = balances.find(b=>b.code==='411')?.credit ?? 0;
  const retained     = balances.find(b=>b.code==='421')?.credit ?? 0;
  const equity       = capital + retained;
  const totalLiabEquity = totalLiab + equity;

  const balanced = Math.abs(totalAssets - totalLiabEquity) < 1000;

  const Section = ({ title, color, items, total }: { title: string; color: string; items: {label:string;value:number;sub?:boolean;highlight?:boolean}[]; total: number }) => {
    const [open, setOpen] = useState(true);
    return (
      <div className="border border-border-primary/50 rounded-xl overflow-hidden">
        <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold uppercase tracking-wide cursor-pointer ${color} bg-bg-surface`}>
          <span>{title}</span>
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        {open && (
          <div className="bg-bg-primary">
            {items.map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-1.5 border-b border-border-primary/40 last:border-0 ${item.sub ? 'pl-8 text-text-muted' : item.highlight ? 'bg-bg-surface font-bold text-text-primary' : 'text-text-secondary'}`}>
                <span className={`text-xs ${item.sub ? 'text-[11px]' : ''}`}>{item.label}</span>
                <span className={`text-xs font-mono ${item.value < 0 ? 'text-error' : item.highlight ? 'text-text-primary font-bold' : ''}`}>{fmtVND(item.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2 bg-bg-surface border-t border-border-primary/50">
              <span className={`text-xs font-bold uppercase ${color}`}>TỔNG {title}</span>
              <span className={`text-sm font-bold font-mono ${color}`}>{fmtVND(total)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold ${balanced ? 'bg-success/20 border-emerald-900/30 text-success' : 'bg-error/20 border-rose-900/30 text-error'}`}>
        {balanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        {balanced ? 'Bảng cân đối tự cân (Tổng TS = Tổng NV)' : `Lệch cân: ${fmtVND(Math.abs(totalAssets - totalLiabEquity))}`}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Assets side */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">A. TÀI SẢN</h4>
          <Section title="Tài sản ngắn hạn" color="text-blue-400" total={currentAssets} items={[
            { label: 'Tiền và tương đương tiền (TK 111, 112)', value: cash },
            { label: 'Phải thu khách hàng (TK 131)', value: receivables },
            { label: 'Thuế GTGT được khấu trừ (TK 133)', value: vat, sub: true },
            { label: 'Tạm ứng (TK 141)', value: advances, sub: true },
            { label: 'Hàng tồn kho (TK 154, 156)', value: inventory },
          ]} />
          <Section title="Tài sản dài hạn" color="text-accent-tertiary" total={fixedNet} items={[
            { label: 'Nguyên giá TSCĐ (TK 211)', value: fixedGross },
            { label: 'Hao mòn lũy kế (TK 214)', value: -depreciation, sub: true },
            { label: 'Giá trị còn lại', value: fixedNet, highlight: true },
          ]} />
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase">TỔNG TÀI SẢN</span>
            <span className="text-lg font-bold text-blue-300 font-mono">{fmtVND(totalAssets)}</span>
          </div>
        </div>

        {/* Liabilities + Equity side */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">B. NGUỒN VỐN</h4>
          <Section title="Nợ ngắn hạn" color="text-warning" total={curLiab} items={[
            { label: 'Phải trả nhà cung cấp (TK 331, 338)', value: payables },
            { label: 'Thuế & khoản nộp nhà nước (TK 333)', value: taxPayable, sub: true },
            { label: 'Phải trả người lao động (TK 334)', value: salaryPayable, sub: true },
          ]} />
          <Section title="Nợ dài hạn" color="text-orange-400" total={ltLiab} items={[
            { label: 'Vay và nợ thuê TC dài hạn (TK 341)', value: ltLiab },
          ]} />
          <Section title="Vốn chủ sở hữu" color="text-success" total={equity} items={[
            { label: 'Vốn điều lệ (TK 411)', value: capital, highlight: true },
            { label: 'LNST chưa phân phối (TK 421)', value: retained },
          ]} />
          <div className="bg-success/20 border border-emerald-900/30 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs font-bold text-success uppercase">TỔNG NGUỒN VỐN</span>
            <span className="text-lg font-bold text-success font-mono">{fmtVND(totalLiabEquity)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── B02 P&L Statement ────────────────────────────────────────────────────────
function B02Report({ balances }: { balances: AccountBalance[] }) {
  const revenue    = balances.find(b=>b.code==='511')?.credit ?? 0;
  const finIncome  = balances.find(b=>b.code==='515')?.credit ?? 0;
  const cogs       = balances.find(b=>b.code==='632')?.debit ?? 0;
  const selling    = balances.find(b=>b.code==='641')?.debit ?? 0;
  const admin      = balances.find(b=>b.code==='642')?.debit ?? 0;
  const finExpense = balances.find(b=>b.code==='635')?.debit ?? 0;
  const tax        = balances.find(b=>b.code==='821')?.debit ?? 0;

  const grossProfit  = revenue - cogs;
  const operIncome   = grossProfit - selling - admin;
  const ebt          = operIncome + finIncome - finExpense;
  const netProfit    = ebt - tax;
  const grossMargin  = pct(grossProfit, revenue);
  const netMargin    = pct(netProfit, revenue);

  const Row = ({ label, value, indent=false, bold=false, positive=true }: { label:string;value:number;indent?:boolean;bold?:boolean;positive?:boolean }) => (
    <div className={`flex items-center justify-between py-1.5 px-3 border-b border-border-primary/30 last:border-0 ${bold ? 'bg-bg-surface' : ''}`}>
      <span className={`text-xs ${indent ? 'pl-4 text-text-muted' : bold ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>{label}</span>
      <span className={`text-xs font-mono font-bold ${value < 0 || (!positive && value > 0) ? 'text-error' : bold ? 'text-text-primary font-bold' : ''}`}>{fmtVND(value)}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Doanh thu thuần', value: revenue, color: 'text-success', icon: TrendingUp },
          { label: 'Lợi nhuận gộp', value: grossProfit, color: 'text-blue-400', icon: BarChart2, sub: `Biên: ${grossMargin.toFixed(1)}%` },
          { label: 'Lợi nhuận sau thuế', value: netProfit, color: netProfit >= 0 ? 'text-accent-secondary' : 'text-error', icon: netProfit >= 0 ? TrendingUp : TrendingDown, sub: `Biên: ${netMargin.toFixed(1)}%` },
        ].map(({label, value, color, icon: Icon, sub}) => (
          <div key={label} className="bg-bg-surface border border-border-primary/50 rounded-xl p-3.5">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className={`text-base font-bold font-mono ${color}`}>{fmtVND(value)}</p>
            <p className="text-[10px] text-text-muted font-bold mt-1">{label}</p>
            {sub && <p className="text-[9px] text-text-muted">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="border border-border-primary/50 rounded-xl overflow-hidden">
        <div className="px-3 py-2 bg-bg-surface text-[10px] font-bold text-text-secondary uppercase tracking-widest font-mono">
          BÁO CÁO KẾT QUẢ KINH DOANH (B02-DN) — Theo Thông tư 200/2014/TT-BTC
        </div>
        <Row label="1. Doanh thu bán hàng và cung cấp DV (TK 511)" value={revenue} bold />
        <Row label="2. Giá vốn hàng bán (TK 632)" value={-cogs} indent positive={false} />
        <Row label="10. LỢI NHUẬN GỘP" value={grossProfit} bold />
        <Row label="21. Doanh thu hoạt động tài chính (TK 515)" value={finIncome} indent />
        <Row label="22. Chi phí tài chính (TK 635)" value={-finExpense} indent positive={false} />
        <Row label="24. Chi phí bán hàng (TK 641)" value={-selling} indent positive={false} />
        <Row label="25. Chi phí QLDN (TK 642)" value={-admin} indent positive={false} />
        <Row label="30. LỢI NHUẬN TRƯỚC THUẾ" value={ebt} bold />
        <Row label="51. Chi phí thuế TNDN (TK 821)" value={-tax} indent positive={false} />
        <Row label="60. LỢI NHUẬN SAU THUẾ TNDN" value={netProfit} bold />
      </div>
    </div>
  );
}

// ─── B03 Cash Flow ────────────────────────────────────────────────────────────
function B03Report({ balances }: { balances: AccountBalance[] }) {
  const revenue   = balances.find(b=>b.code==='511')?.credit ?? 0;
  const cogs      = balances.find(b=>b.code==='632')?.debit ?? 0;
  const selling   = balances.find(b=>b.code==='641')?.debit ?? 0;
  const admin     = balances.find(b=>b.code==='642')?.debit ?? 0;
  const tax       = balances.find(b=>b.code==='821')?.debit ?? 0;
  const depr      = balances.find(b=>b.code==='214')?.credit ?? 0;

  // Simplified indirect method
  const netProfit    = revenue - cogs - selling - admin - tax;
  const operCF       = netProfit + depr; // simplified: add back non-cash
  const investCF     = -(balances.find(b=>b.code==='211')?.debit ?? 0) * 0.2; // mock capex
  const ltLoan       = balances.find(b=>b.code==='341')?.credit ?? 0;
  const financingCF  = ltLoan * 0.3; // mock new borrowings less repayments
  const netCF        = operCF + investCF + financingCF;
  const openCash     = (balances.find(b=>b.code==='111')?.debit ?? 0) + (balances.find(b=>b.code==='112')?.debit ?? 0) - netCF;
  const closeCash    = openCash + netCF;

  const CashSection = ({ title, color, items, total }: { title:string;color:string;items:{label:string;value:number;sub?:boolean}[];total:number }) => (
    <div className="border border-border-primary/50 rounded-xl overflow-hidden">
      <div className={`px-4 py-2.5 bg-bg-surface text-xs font-bold uppercase tracking-wide ${color}`}>{title}</div>
      {items.map((item,i) => (
        <div key={i} className={`flex justify-between px-4 py-1.5 border-b border-border-primary/30 ${item.sub ? 'pl-8 text-text-muted text-[11px]' : 'text-text-secondary text-xs'}`}>
          <span>{item.label}</span>
          <span className={`font-mono text-xs ${item.value < 0 ? 'text-error' : ''}`}>{fmtVND(item.value)}</span>
        </div>
      ))}
      <div className={`flex justify-between px-4 py-2 bg-bg-surface border-t border-border-primary/50`}>
        <span className={`text-xs font-bold ${color}`}>Lưu chuyển {title.toLowerCase()}</span>
        <span className={`text-sm font-bold font-mono ${total >= 0 ? color : 'text-error'}`}>{fmtVND(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-bg-surface border border-border-primary/50 rounded-xl p-3 text-[10px] text-text-muted font-mono">
        ⚠️ Phương pháp gián tiếp (Indirect Method) — Ước tính từ dữ liệu tài khoản hiện có. Để báo cáo chính xác, nhập đầy đủ giao dịch tiền mặt vào Nhật Ký.
      </div>

      <CashSection title="Hoạt Động Kinh Doanh (SXKD)" color="text-success" total={operCF} items={[
        { label: 'Lợi nhuận trước thuế' , value: netProfit + tax },
        { label: 'Khấu hao TSCĐ (cộng lại)', value: depr, sub: true },
        { label: 'Thuế TNDN đã nộp', value: -tax, sub: true },
      ]} />

      <CashSection title="Hoạt Động Đầu Tư" color="text-blue-400" total={investCF} items={[
        { label: 'Mua sắm TSCĐ (ước tính)', value: investCF },
      ]} />

      <CashSection title="Hoạt Động Tài Chính" color="text-accent-secondary" total={financingCF} items={[
        { label: 'Vay mới trong kỳ (ước tính)', value: financingCF },
      ]} />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tiền đầu kỳ', value: openCash, color: 'text-text-secondary' },
          { label: 'Lưu chuyển thuần', value: netCF, color: netCF >= 0 ? 'text-success' : 'text-error' },
          { label: 'Tiền cuối kỳ', value: closeCash, color: 'text-text-primary' },
        ].map(({label, value, color}) => (
          <div key={label} className="bg-bg-surface border border-border-primary/50 rounded-xl p-3.5 text-center">
            <p className={`text-base font-bold font-mono ${color}`}>{fmtVND(value)}</p>
            <p className="text-[10px] text-text-muted font-bold mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Analysis Tab ─────────────────────────────────────────────────────────────
function AnalysisTab({ balances }: { balances: AccountBalance[] }) {
  const revenue  = balances.find(b=>b.code==='511')?.credit ?? 0;
  const cogs     = balances.find(b=>b.code==='632')?.debit ?? 0;
  const selling  = balances.find(b=>b.code==='641')?.debit ?? 0;
  const admin    = balances.find(b=>b.code==='642')?.debit ?? 0;
  const tax      = balances.find(b=>b.code==='821')?.debit ?? 0;
  const netProfit= revenue - cogs - selling - admin - tax;
  const totalAssets = balances.filter(b=>b.group==='current_asset').reduce((s,b)=>s+b.debit,0)
                    + (balances.find(b=>b.code==='211')?.debit ?? 0)
                    - (balances.find(b=>b.code==='214')?.credit ?? 0);
  const equity  = (balances.find(b=>b.code==='411')?.credit ?? 0) + (balances.find(b=>b.code==='421')?.credit ?? 0);
  const curLiab = balances.filter(b=>b.group==='current_liability').reduce((s,b)=>s+b.credit,0);
  const curAsset= balances.filter(b=>b.group==='current_asset').reduce((s,b)=>s+b.debit,0);

  const ratios = [
    { label: 'Biên lợi nhuận gộp',     value: `${pct(revenue-cogs, revenue).toFixed(1)}%`,    good: revenue-cogs>0, desc: 'Gross Margin = (Doanh thu - Giá vốn) / Doanh thu' },
    { label: 'Biên lợi nhuận ròng',     value: `${pct(netProfit, revenue).toFixed(1)}%`,         good: netProfit>0,    desc: 'Net Margin = Lợi nhuận sau thuế / Doanh thu' },
    { label: 'ROA (Return on Assets)',   value: `${pct(netProfit, totalAssets).toFixed(1)}%`,    good: netProfit>0,    desc: 'ROA = Lợi nhuận sau thuế / Tổng tài sản' },
    { label: 'ROE (Return on Equity)',   value: `${pct(netProfit, equity).toFixed(1)}%`,         good: netProfit>0,    desc: 'ROE = Lợi nhuận sau thuế / Vốn chủ sở hữu' },
    { label: 'Tỷ số thanh toán ngắn hạn', value: `${(curAsset/Math.max(curLiab,1)).toFixed(2)}x`, good: curAsset/Math.max(curLiab,1)>=1.5, desc: 'Current Ratio = Tài sản ngắn hạn / Nợ ngắn hạn (tốt ≥ 1.5)' },
    { label: 'Tỷ lệ nợ / Vốn CSH',     value: `${pct(totalAssets-equity, equity).toFixed(1)}%`, good: (totalAssets-equity)/Math.max(equity,1)<2, desc: 'D/E = Tổng nợ / Vốn CSH (tốt < 200%)' },
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">Chỉ Số Tài Chính Cốt Lõi</h4>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ratios.map(r => (
          <div key={r.label} className="bg-bg-surface border border-border-primary/50 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-text-muted font-bold uppercase">{r.label}</p>
              {r.good ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
            </div>
            <p className={`text-xl font-bold font-mono ${r.good ? 'text-success' : 'text-warning'}`}>{r.value}</p>
            <p className="text-[10px] text-text-muted leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FinancialReportsVN() {
  const [tab, setTab] = useState<ReportTab>('b01');
  const [balances, setBalances] = useState<AccountBalance[]>(loadBalances);
  const [apiReceivables, setApiReceivables] = useState<number | null>(null);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `Kỳ kế toán: Năm ${now.getFullYear()} (tính đến ${now.toLocaleDateString('vi-VN')})`;
  });

  // Công nợ phải thu TK 131 thật, đọc từ Business API (Sales ghi invoice khi "Nhắc nợ").
  useEffect(() => {
    let cancelled = false;
    listBusinessEntities('invoice', 500)
      .then((entities) => {
        if (cancelled) return;
        const total = entities.reduce((sum, e) => {
          const d = e.data as Record<string, unknown>;
          const account = String(d.accountCode ?? '');
          const amount = Number(d.amountVnd ?? 0);
          return account === '131' ? sum + amount : sum;
        }, 0);
        setApiReceivables(total);
      })
      .catch(() => {
        if (!cancelled) setApiReceivables(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ưu tiên số công nợ thật từ Business API; nếu chưa có thì giữ số demo Sổ Cái.
  const effectiveBalances = useMemo(() => {
    if (apiReceivables === null) return balances;
    return balances.map((b) => (b.code === '131' ? { ...b, debit: apiReceivables } : b));
  }, [balances, apiReceivables]);

  const handleRefresh = () => {
    setBalances(loadBalances());
  };

  const handleExportPDF = () => {
    window.print();
  };

  const TABS = [
    { key: 'b01', label: 'B01-DN', sublabel: 'Bảng CĐKT', icon: Scale },
    { key: 'b02', label: 'B02-DN', sublabel: 'Kết quả KD', icon: TrendingUp },
    { key: 'b03', label: 'B03-DN', sublabel: 'Lưu chuyển tiền', icon: ArrowRightLeft },
    { key: 'analysis', label: 'Phân Tích', sublabel: 'Chỉ số', icon: BarChart2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/30 to-teal-950/20 border border-emerald-900/30 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-bold text-success uppercase tracking-widest font-mono">Theo Thông tư 200/2014/TT-BTC & TT 133/2016/TT-BTC</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary">Báo Cáo Tài Chính Doanh Nghiệp</h2>
            <p className="text-text-secondary text-xs mt-1">{period}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated hover:bg-bg-surface-hover border border-border-secondary rounded-xl text-xs font-bold text-text-secondary cursor-pointer transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Làm mới
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated hover:bg-bg-surface-hover border border-border-secondary rounded-xl text-xs font-bold text-text-secondary cursor-pointer transition-all">
              <Download className="w-3.5 h-3.5" /> Xuất PDF
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-5 flex-wrap">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key as ReportTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${tab === t.key ? 'bg-emerald-700 border-emerald-600 text-text-primary shadow-lg shadow-emerald-500/20' : 'bg-bg-surface border-border-primary text-text-secondary hover:border-border-secondary'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <div className="text-left">
                  <div>{t.label}</div>
                  <div className={`text-[9px] font-bold ${tab === t.key ? 'text-success' : 'text-text-muted'}`}>{t.sublabel}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report notice */}
      <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
        <p>Dữ liệu được đọc từ Sổ Cái (TK) đã lưu. Khoản <strong>Phải thu khách hàng (TK 131)</strong> được tự động thay bằng công nợ thật từ <strong>Business API</strong> (Sales ghi khi "Nhắc nợ"). Nhấn <strong>"Làm mới"</strong> để cập nhật Sổ Cái.</p>
      </div>

      {/* Report content */}
      {tab === 'b01' && <B01Report balances={effectiveBalances} />}
      {tab === 'b02' && <B02Report balances={effectiveBalances} />}
      {tab === 'b03' && <B03Report balances={effectiveBalances} />}
      {tab === 'analysis' && <AnalysisTab balances={effectiveBalances} />}
    </div>
  );
}

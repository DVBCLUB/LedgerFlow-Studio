import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calculator,
  CheckCircle2,
  Copy,
  FileText,
  Receipt,
  ShieldCheck,
  WalletCards
} from 'lucide-react';
import {
  ACCOUNTING_CONTROL_KPIS,
  BOSS_REPORT_TEMPLATE,
  CONSTRUCTION_ACCOUNTING_DOMAINS,
  COST_TYPE_KNOWLEDGE,
  DOCUMENT_CHECKLIST_RULES
} from '../data/deepConstructionAccountingKnowledge';

type AccountingTab = 'domains' | 'costs' | 'documents' | 'journal' | 'kpis';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

const JOURNAL_CASES = [
  {
    title: 'Mua vật tư nhập kho công trình, có VAT',
    context: 'Mua thép/cát/xi măng có hóa đơn và phiếu nhập kho.',
    entry: ['Nợ TK 152/154/621: Giá chưa thuế', 'Nợ TK 1331: Thuế GTGT được khấu trừ nếu đủ điều kiện', 'Có TK 111/112/331: Tổng thanh toán'],
    docs: ['Hóa đơn', 'Phiếu nhập kho', 'Báo giá/đơn hàng', 'Biên bản giao nhận'],
    risk: 'Nếu thiếu phiếu nhập hoặc hàng không phục vụ công trình thì khó chứng minh chi phí.'
  },
  {
    title: 'Tạm ứng cho chỉ huy trưởng/thủ kho',
    context: 'Ứng tiền mua vật tư nhỏ, dầu, chi phí công trường.',
    entry: ['Nợ TK 141: Số tiền tạm ứng', 'Có TK 111/112: Số tiền đã chi'],
    docs: ['Đề nghị tạm ứng', 'Phê duyệt', 'Mục đích ứng', 'Hạn hoàn ứng'],
    risk: 'Tạm ứng treo lâu phải cảnh báo theo tuổi nợ và người chịu trách nhiệm.'
  },
  {
    title: 'Hoàn ứng bằng chứng từ hợp lệ',
    context: 'Người nhận ứng nộp hóa đơn/chứng từ để quyết toán tạm ứng.',
    entry: ['Nợ TK chi phí/kho tương ứng: Giá trị được duyệt', 'Nợ TK 1331 nếu có VAT đủ điều kiện', 'Có TK 141: Giảm tạm ứng'],
    docs: ['Bảng kê hoàn ứng', 'Hóa đơn/chứng từ', 'Phiếu nhập nếu là vật tư', 'Xác nhận công trình'],
    risk: 'Chi không đúng mục đích ứng hoặc thiếu mã công trình sẽ làm sai báo cáo dự án.'
  },
  {
    title: 'Thanh toán thầu phụ theo nghiệm thu',
    context: 'Thầu phụ hoàn thành khối lượng và xuất hóa đơn.',
    entry: ['Nợ TK 154/627/623/622 tùy bản chất chi phí', 'Nợ TK 1331 nếu có VAT đủ điều kiện', 'Có TK 331/112: Phải trả hoặc đã trả thầu phụ'],
    docs: ['Hợp đồng', 'Biên bản nghiệm thu', 'Bảng xác nhận khối lượng', 'Hóa đơn', 'Đề nghị thanh toán'],
    risk: 'Không thanh toán vượt nghiệm thu hoặc vượt điều khoản hợp đồng.'
  },
  {
    title: 'Cấp dầu cho xe/máy công trình',
    context: 'Theo dõi quỹ dầu và định mức sử dụng.',
    entry: ['Nợ TK 623/627/154 hoặc chi phí liên quan', 'Có TK 152/156/quỹ dầu nội bộ tùy cách quản trị'],
    docs: ['Phiếu cấp dầu', 'Xe/máy nhận', 'Người nhận', 'Nhật trình', 'Định mức'],
    risk: 'Cấp vượt định mức phải yêu cầu giải trình trước khi chốt chi phí.'
  }
];

export default function AccountingVietnam() {
  const [tab, setTab] = useState<AccountingTab>('domains');
  const [copied, setCopied] = useState<string | null>(null);
  const [budget, setBudget] = useState(1200000000);
  const [actual, setActual] = useState(735000000);
  const [advance, setAdvance] = useState(180000000);
  const [settled, setSettled] = useState(95000000);

  const calc = useMemo(() => {
    const budgetUsed = budget ? actual / budget * 100 : 0;
    const advanceLeft = advance - settled;
    const advanceSettled = advance ? settled / advance * 100 : 0;
    return { budgetUsed, advanceLeft, advanceSettled };
  }, [budget, actual, advance, settled]);

  const bossReport = `BÁO CÁO NHANH CÔNG TRÌNH\n\nNgân sách: ${money(budget)}đ\nChi phí thực tế: ${money(actual)}đ\nTỷ lệ dùng ngân sách: ${calc.budgetUsed.toFixed(1)}%\nTạm ứng còn treo: ${money(calc.advanceLeft)}đ\nTỷ lệ hoàn ứng: ${calc.advanceSettled.toFixed(1)}%\n\nViệc cần xử lý: kiểm tra hồ sơ thiếu, tạm ứng quá hạn, hóa đơn VAT và quỹ dầu bất thường.`;

  const copyText = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const tabs: { id: AccountingTab; label: string }[] = [
    { id: 'domains', label: 'Nghiệp vụ' },
    { id: 'costs', label: 'Loại chi phí' },
    { id: 'documents', label: 'Chứng từ' },
    { id: 'journal', label: 'Bút toán' },
    { id: 'kpis', label: 'KPI' }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-300">
              <Receipt className="h-3.5 w-3.5" />
              Accounting Vietnam · Construction Focus
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Kế toán thực chiến cho công trình: chi phí, hồ sơ, tạm ứng, kho, dầu, VAT
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Module này dùng làm lớp kiến thức nghiệp vụ lõi. Không chỉ học tài khoản/bút toán, mà phải biết
              khoản chi cần chứng từ gì, rủi ro ở đâu, KPI nào cảnh báo và báo cáo sếp cần nói gì.
            </p>
          </div>
          <button
            onClick={() => copyText('boss', bossReport)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'boss' ? 'Đã copy' : 'Copy báo cáo sếp'}
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${tab === item.id ? 'bg-cyan-400 text-slate-950' : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'domains' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CONSTRUCTION_ACCOUNTING_DOMAINS.map((item) => (
            <div key={item.domain} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <BookOpen className="mb-3 h-5 w-5 text-cyan-300" />
              <h2 className="text-sm font-black text-white">{item.domain}</h2>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.scope}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.mustHave.map((field) => (
                  <span key={field} className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-cyan-300">{field}</span>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'costs' && (
        <section className="space-y-4">
          {COST_TYPE_KNOWLEDGE.map((item) => (
            <div key={item.type} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="grid gap-4 lg:grid-cols-4">
                <div>
                  <WalletCards className="mb-3 h-5 w-5 text-emerald-300" />
                  <h2 className="text-sm font-black text-white">{item.type}</h2>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Ví dụ: {item.examples}</p>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-slate-500">Hồ sơ nên có</p>
                  {item.documents.map((doc) => <p key={doc} className="text-xs font-semibold leading-6 text-slate-300">• {doc}</p>)}
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-amber-300">Rủi ro</p>
                  {item.risks.map((risk) => <p key={risk} className="text-xs font-semibold leading-6 text-amber-100">• {risk}</p>)}
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-cyan-300">KPI</p>
                  {item.kpis.map((kpi) => <p key={kpi} className="text-xs font-semibold leading-6 text-cyan-100">• {kpi}</p>)}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'documents' && (
        <section className="grid gap-4 lg:grid-cols-2">
          {DOCUMENT_CHECKLIST_RULES.map((item) => (
            <div key={item.scenario} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <FileText className="mb-3 h-5 w-5 text-cyan-300" />
              <h2 className="text-sm font-black text-white">{item.scenario}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="mb-2 text-[10px] font-black uppercase text-emerald-200">Hồ sơ tối thiểu</p>
                  {item.minimumDocs.map((doc) => <p key={doc} className="text-xs font-semibold leading-6 text-slate-300">• {doc}</p>)}
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                  <p className="mb-2 text-[10px] font-black uppercase text-rose-200">Cờ đỏ</p>
                  {item.redFlags.map((flag) => <p key={flag} className="text-xs font-semibold leading-6 text-slate-300">• {flag}</p>)}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'journal' && (
        <section className="space-y-4">
          {JOURNAL_CASES.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="grid gap-4 lg:grid-cols-4">
                <div>
                  <Calculator className="mb-3 h-5 w-5 text-purple-300" />
                  <h2 className="text-sm font-black text-white">{item.title}</h2>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.context}</p>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-purple-300">Định khoản tham khảo</p>
                  {item.entry.map((line) => <p key={line} className="text-xs font-semibold leading-6 text-slate-300">• {line}</p>)}
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-emerald-300">Chứng từ</p>
                  {item.docs.map((doc) => <p key={doc} className="text-xs font-semibold leading-6 text-slate-300">• {doc}</p>)}
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs font-semibold leading-6 text-amber-100">
                  <AlertTriangle className="mb-2 h-4 w-4" />
                  {item.risk}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'kpis' && (
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Calculator className="h-4 w-4 text-cyan-300" />
              Mini calculator
            </h2>
            <div className="space-y-4">
              {[
                ['Ngân sách', budget, setBudget],
                ['Chi phí thực tế', actual, setActual],
                ['Tạm ứng', advance, setAdvance],
                ['Đã hoàn ứng', settled, setSettled]
              ].map(([label, value, setter]) => (
                <label key={label as string} className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">{label as string}</span>
                  <input
                    type="number"
                    value={value as number}
                    onChange={(e) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-cyan-400"
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5"><p className="text-xs text-cyan-200">Budget Used</p><p className="mt-2 text-3xl font-black text-white">{calc.budgetUsed.toFixed(1)}%</p></div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"><p className="text-xs text-amber-200">Tạm ứng còn treo</p><p className="mt-2 text-2xl font-black text-white">{money(calc.advanceLeft)}đ</p></div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><p className="text-xs text-emerald-200">Tỷ lệ hoàn ứng</p><p className="mt-2 text-3xl font-black text-white">{calc.advanceSettled.toFixed(1)}%</p></div>
            <div className="md:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><ShieldCheck className="h-4 w-4 text-emerald-300" />KPI kiểm soát</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {ACCOUNTING_CONTROL_KPIS.map((item) => (
                  <div key={item.kpi} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <h3 className="text-xs font-black text-white">{item.kpi}</h3>
                    <code className="mt-3 block rounded-lg bg-black/30 p-3 text-[11px] font-bold text-cyan-300">{item.formula}</code>
                    <p className="mt-3 text-xs font-semibold leading-6 text-slate-400">{item.use}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-200"><CheckCircle2 className="h-4 w-4" />Khung báo cáo sếp</h2>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {BOSS_REPORT_TEMPLATE.map((line) => <div key={line} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs font-semibold leading-6 text-slate-300">{line}</div>)}
        </div>
        <p className="mt-4 text-xs font-semibold leading-7 text-slate-400">
          Nội dung tài khoản, thuế, chứng từ trong module này là khung tham khảo để kiểm soát. Khi áp dụng thật phải kiểm tra văn bản hiện hành và chứng từ gốc.
        </p>
      </section>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { Factory, Database, Boxes, Briefcase, HardHat, Star, Calculator, Plus, Trash2 } from 'lucide-react';
import {
  listIndustryTemplates,
  calculateBOMCost,
  calculateProgressBilling,
  type IndustryTemplateConfig,
  type IndustryTemplateId,
  type BOMItem,
  type BOMCostResult,
  type ProgressBillingResult,
} from '../../utils/industryTemplateApi';

const TEMPLATE_ICONS: Record<IndustryTemplateId, React.ElementType> = {
  saas_software: Database,
  trading_ecommerce: Boxes,
  manufacturing: Factory,
  services: Briefcase,
  construction: HardHat,
};

const CATEGORY_COLOR: Record<string, string> = {
  Asset: 'text-emerald-300',
  Liability: 'text-rose-300',
  Equity: 'text-violet-300',
  Revenue: 'text-cyan-300',
  Expense: 'text-amber-300',
};

function fmtVND(n: number) {
  return n.toLocaleString('vi-VN') + ' ₫';
}

export default function IndustryTemplatePanel() {
  const [templates, setTemplates] = useState<IndustryTemplateConfig[]>([]);
  const [selectedId, setSelectedId] = useState<IndustryTemplateId | null>(null);
  const [error, setError] = useState('');
  const [bomItems, setBomItems] = useState<BOMItem[]>([
    { itemId: 'm1', itemName: 'Xi măng PCB40', quantityRequired: 10, unitCostVnd: 90000 },
    { itemId: 'm2', itemName: 'Thép D16', quantityRequired: 5, unitCostVnd: 185000 },
  ]);
  const [bomResult, setBomResult] = useState<BOMCostResult | null>(null);
  const [contractValue, setContractValue] = useState('1000000000');
  const [completedPct, setCompletedPct] = useState('35');
  const [billingResult, setBillingResult] = useState<ProgressBillingResult | null>(null);

  useEffect(() => {
    listIndustryTemplates()
      .then((t) => {
        setTemplates(t);
        if (t.length) setSelectedId(t[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const selected = useMemo(() => templates.find((t) => t.id === selectedId) ?? null, [templates, selectedId]);

  const runBOM = async () => {
    try {
      setBomResult(await calculateBOMCost(bomItems.filter((b) => b.itemName.trim())));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const runBilling = async () => {
    try {
      setBillingResult(await calculateProgressBilling(Number(contractValue) || 0, Number(completedPct) || 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="space-y-5 text-left text-white">
      {error && <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 p-3 text-xs text-rose-300">{error}</div>}

      {/* Template selector */}
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => {
          const Icon = TEMPLATE_ICONS[t.id] ?? Database;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                selectedId === t.id
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.name.split('(')[0].trim()}
              {t.isDefault && <Star className="w-3 h-3 text-amber-400" />}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-black">{selected.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{selected.description}</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Tài khoản chủ đạo</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {selected.primaryAccounts.map((a) => (
                <div key={a.code} className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-300">{a.code}</span>
                    <span className={`text-[10px] font-bold ${CATEGORY_COLOR[a.category] ?? 'text-slate-400'}`}>{a.category}</span>
                  </div>
                  <p className="text-xs font-semibold mt-0.5">{a.name}</p>
                  <p className="text-[10px] text-slate-500">{a.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {selected.keyMetrics.map((m) => (
              <span key={m} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* BOM calculator */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-sm font-black flex items-center gap-2"><Calculator className="w-4 h-4 text-cyan-400" /> Tính giá thành BOM</h3>
        <div className="space-y-2">
          {bomItems.map((b, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={b.itemName}
                onChange={(e) => setBomItems((p) => p.map((x, j) => (j === i ? { ...x, itemName: e.target.value } : x)))}
                placeholder="Tên vật tư"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-cyan-500"
              />
              <input
                type="number"
                value={b.quantityRequired}
                onChange={(e) => setBomItems((p) => p.map((x, j) => (j === i ? { ...x, quantityRequired: Number(e.target.value) } : x)))}
                className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none"
              />
              <input
                type="number"
                value={b.unitCostVnd}
                onChange={(e) => setBomItems((p) => p.map((x, j) => (j === i ? { ...x, unitCostVnd: Number(e.target.value) } : x)))}
                className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none"
              />
              <button onClick={() => setBomItems((p) => p.filter((_, j) => j !== i))} className="p-1.5 text-slate-600 hover:text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setBomItems((p) => [...p, { itemId: `m${p.length + 1}`, itemName: '', quantityRequired: 1, unitCostVnd: 0 }])}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm vật tư
          </button>
          <button onClick={runBOM} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-black cursor-pointer">Tính BOM</button>
        </div>
        {bomResult && (
          <div className="rounded-lg border border-cyan-800/40 bg-cyan-950/20 p-3 text-xs">
            <p className="font-black text-cyan-300">Tổng chi phí vật liệu: {fmtVND(bomResult.totalMaterialCostVnd)}</p>
            {bomResult.breakdown.slice(0, 6).map((b) => (
              <p key={b.itemId} className="text-slate-400 mt-1">{b.itemName} × {b.quantityRequired} = {fmtVND(b.subtotalVnd)}</p>
            ))}
          </div>
        )}
      </div>

      {/* Progress billing */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-sm font-black">Lập hóa đơn theo tiến độ (Progress Billing)</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <input value={contractValue} onChange={(e) => setContractValue(e.target.value)} placeholder="Giá trị hợp đồng" className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs w-44 outline-none" />
          <input value={completedPct} onChange={(e) => setCompletedPct(e.target.value)} placeholder="% hoàn thành" className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs w-28 outline-none" />
          <button onClick={runBilling} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-black cursor-pointer">Tính</button>
        </div>
        {billingResult && (
          <div className="text-xs space-y-1 text-slate-300">
            <p>Đã hoàn thành: <span className="font-bold">{billingResult.completedPercent}%</span></p>
            <p>Lũy kế lập hóa đơn: <span className="font-bold text-cyan-300">{fmtVND(billingResult.progressBilledVnd)}</span></p>
            <p>Còn lại: <span className="font-bold">{fmtVND(billingResult.remainingVnd)}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}

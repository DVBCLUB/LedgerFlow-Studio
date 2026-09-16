import React, { useState } from 'react';
import { ShieldCheck, Cpu, CheckCircle2, AlertTriangle, Play, Sparkles } from 'lucide-react';

export interface FactoryExecutionDecisionProps {
  executionId?: string;
  onDecisionSubmit?: (decision: { provider: string; approved: boolean; reasoning: string }) => void;
}

export function FactoryExecutionDecisionPanel({ executionId = 'exec-live-01', onDecisionSubmit }: FactoryExecutionDecisionProps) {
  const [selectedProvider, setSelectedProvider] = useState<'claude-code' | 'cursor' | 'antigravity' | 'gemini-pro'>('claude-code');
  const [reasoning, setReasoning] = useState('Phê duyệt thực thi tác vụ lập trình tự động với kiểm thử sandbox an toàn.');
  const [approved, setApproved] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onDecisionSubmit) {
      onDecisionSubmit({ provider: selectedProvider, approved, reasoning });
    }
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="rounded-2xl border border-border-primary bg-slate-950/80 p-5 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between border-b border-border-secondary/60 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Quyết Định Điều Phối Software Factory</h3>
            <p className="text-xs text-text-tertiary">Mã thực thi: <span className="font-mono text-cyan-400">{executionId}</span></p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="h-3.5 w-3.5" />
          AI Safety Verified
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            Chọn Mô Hình / Connector Thực Thi
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'claude-code', label: 'Claude Code', desc: 'Lập trình chuyên sâu' },
              { id: 'antigravity', label: 'Antigravity IDE', desc: 'Đa tác vụ Studio' },
              { id: 'cursor', label: 'Cursor Rules', desc: 'Refactor nhanh' },
              { id: 'gemini-pro', label: 'Gemini 2.5 Pro', desc: 'Phân tích đa phương thức' },
            ].map((prov) => (
              <button
                key={prov.id}
                type="button"
                onClick={() => setSelectedProvider(prov.id as any)}
                className={`rounded-xl p-3 text-left border transition-all ${
                  selectedProvider === prov.id
                    ? 'border-cyan-500/80 bg-cyan-950/40 text-cyan-200 shadow-md shadow-cyan-500/10'
                    : 'border-border-secondary bg-slate-900/40 text-text-tertiary hover:border-border-primary'
                }`}
              >
                <div className="font-bold text-xs text-text-primary">{prov.label}</div>
                <div className="text-[11px] text-text-tertiary mt-0.5">{prov.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
            Ghi Chú & Lý Do Phê Duyệt
          </label>
          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-border-secondary bg-slate-900/80 px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 text-xs font-medium text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
              className="rounded border-border-secondary bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
            />
            <span>Xác nhận không có xung đột mã nguồn trước khi release</span>
          </label>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500 transition-all"
          >
            {submitted ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {submitted ? 'Đã Chấp Thuận' : 'Xác Nhận & Điều Phối'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FactoryExecutionDecisionPanel;

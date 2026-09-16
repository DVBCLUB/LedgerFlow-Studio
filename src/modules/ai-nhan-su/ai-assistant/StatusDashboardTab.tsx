import React from 'react';
import { Shield, Terminal, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { type AssistantHealth } from '../../../utils/assistantApi';

interface StatusDashboardTabProps {
  health: AssistantHealth | null;
  onRefresh: () => void;
}

export default function StatusDashboardTab({ health, onRefresh }: StatusDashboardTabProps) {
  return (
    <div className="p-4 space-y-4">
      {health && (
        <>
          <div className="bg-bg-primary/60 border border-border-primary rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
              <Shield className="h-4 w-4" /> Daemon Status
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] text-text-tertiary font-semibold mb-0.5">Service</div>
                <div className="text-slate-200 font-bold">{health.service}</div>
              </div>
              <div>
                <div className="text-[10px] text-text-tertiary font-semibold mb-0.5">Version</div>
                <div className="text-slate-200 font-bold">v{health.version}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] text-text-tertiary font-semibold mb-0.5">Workspace Root</div>
                <div className="text-text-secondary font-mono text-[10px] break-all">{health.workspaceRoot}</div>
              </div>
            </div>
          </div>

          <div className="bg-bg-primary/60 border border-border-primary rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-text-secondary">
              <Terminal className="h-4 w-4" /> Quick Commands
            </div>
            {[
              { cmd: 'npm run assistant:start', desc: 'Khởi động daemon' },
              { cmd: 'npm run assistant:cli -- status', desc: 'CLI status' },
              { cmd: 'npm run assistant:cli -- chat', desc: 'Interactive REPL' },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-center justify-between gap-2 bg-slate-950 border border-border-primary rounded-lg px-3 py-2">
                <code className="text-[10px] text-emerald-400 font-mono">{cmd}</code>
                <span className="text-[10px] text-text-tertiary shrink-0">{desc}</span>
              </div>
            ))}
          </div>

          <div className="bg-bg-primary/60 border border-border-primary rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-text-secondary">
              <Zap className="h-4 w-4" /> Cấu hình AI Keys
            </div>
            <p className="text-[11px] text-text-tertiary leading-relaxed">
              AI keys được quản lý tập trung tại <strong className="text-text-secondary">LedgerFlow AI Settings</strong>.
              Daemon dùng chung Key Vault và Multi-LLM Router với app chính.
            </p>
            <a
              href="/#/ai_settings"
              className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 font-bold transition-colors"
            >
              Mở AI Settings <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </>
      )}
      <button
        onClick={onRefresh}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-bg-surface hover:bg-bg-surface-hover text-text-secondary text-xs font-bold rounded-xl transition-colors border border-border-secondary"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Làm mới trạng thái
      </button>
    </div>
  );
}

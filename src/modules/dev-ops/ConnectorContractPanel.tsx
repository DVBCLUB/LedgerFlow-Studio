import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Code2, Copy, ExternalLink, Github, Loader2, Monitor, PlayCircle, RefreshCw, Shield, Terminal, XCircle } from 'lucide-react';
import {
  fetchContracts, fetchIDECheck, openIDEFromBridge, generateIDEHandoff,
  type ConnectorContract, type IDECheckResult, type IDEHandoffPrompt,
} from '../../utils/integrationHubApi';

const ideIcons: Record<string, typeof Code2> = {
  vscode: Code2,
  cursor: Code2,
  github: Github,
  terminal: Terminal,
  windsurf: Code2,
  copilot: Monitor,
};

const riskBadge: Record<string, { color: string; bg: string }> = {
  LOW: { color: 'text-emerald-300', bg: 'bg-emerald-950/40 border-emerald-500/30' },
  MEDIUM: { color: 'text-amber-300', bg: 'bg-amber-950/40 border-amber-500/30' },
  HIGH: { color: 'text-rose-300', bg: 'bg-rose-950/40 border-rose-500/30' },
  BLOCKED: { color: 'text-red-400', bg: 'bg-red-950/50 border-red-600/40' },
};

const authLabel: Record<string, string> = {
  none: 'Không auth',
  local_token: 'Token local',
  env_var: 'Env var',
  oauth_app: 'OAuth App',
  oauth_user: 'OAuth User',
  api_key: 'API Key',
  browser_session: 'Session trình duyệt',
};

export default function ConnectorContractPanel({ onChanged }: { onChanged?: () => void }) {
  const [contracts, setContracts] = useState<ConnectorContract[]>([]);
  const [ideStatuses, setIdeStatuses] = useState<IDECheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<ConnectorContract | null>(null);
  const [busyTarget, setBusyTarget] = useState<string | null>(null);

  // Handoff form state
  const [handoffTarget, setHandoffTarget] = useState('vscode');
  const [handoffTask, setHandoffTask] = useState('');
  const [handoffFiles, setHandoffFiles] = useState('');
  const [handoffResult, setHandoffResult] = useState<IDEHandoffPrompt | null>(null);
  const [handoffLoading, setHandoffLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [contractList, ideResults] = await Promise.all([
        fetchContracts(),
        fetchIDECheck().catch(() => [] as IDECheckResult[]),
      ]);
      setContracts(contractList);
      setIdeStatuses(ideResults);
    } catch (err: any) {
      setError(err.message || 'Không tải được contracts.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleOpenIDE(target: string) {
    setBusyTarget(target);
    setError(null);
    setMessage(null);
    try {
      const result = await openIDEFromBridge(target);
      setMessage(result.message);
      onChanged?.();
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyTarget(null);
    }
  }

  async function handleGenerateHandoff() {
    if (!handoffTask.trim()) { setError('Vui lòng nhập mô tả tác vụ.'); return; }
    setHandoffLoading(true);
    setError(null);
    setHandoffResult(null);
    try {
      const files = handoffFiles.split('\n').map(f => f.trim()).filter(Boolean);
      const prompt = await generateIDEHandoff(handoffTarget, handoffTask.trim(), files.length > 0 ? files : undefined);
      setHandoffResult(prompt);
      setMessage(`Handoff prompt đã sẵn sàng cho ${prompt.target}.`);
      onChanged?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setHandoffLoading(false);
    }
  }

  async function copyHandoff() {
    if (!handoffResult) return;
    await navigator.clipboard.writeText(handoffResult.promptMarkdown);
    setMessage('Đã copy handoff prompt vào clipboard.');
  }

  // Group contracts by category
  const byCategory = React.useMemo(() => {
    const groups: Record<string, ConnectorContract[]> = {};
    for (const c of contracts) {
      (groups[c.category] ??= []).push(c);
    }
    return groups;
  }, [contracts]);

  const categoryLabel: Record<string, string> = {
    ai: 'AI', devops: 'DevOps', workspace: 'Workspace',
    accounting: 'Kế toán', documents: 'Chứng từ', automation: 'Tự động hóa', data: 'Dữ liệu',
  };

  return (
    <section className="rounded-3xl border border-border-primary bg-slate-950/80 p-5 shadow-2xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
            <Shield className="h-4 w-4" /> Connector Contracts + IDE Bridge
          </div>
          <h2 className="mt-3 text-xl font-black text-text-primary">Hợp đồng connector & Handoff sang IDE</h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-text-secondary">
            Mỗi connector trong LedgerFlow đều có hợp đồng chuẩn gồm capabilities, auth mode, risk profile.
            IDE Bridge cho phép mở VS Code/Cursor/GitHub trực tiếp hoặc sinh handoff prompt để copy/dán vào IDE.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-900/30 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Tải trạng thái
        </button>
      </div>

      {error && <div className="mt-4 flex gap-2 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs font-bold text-rose-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</div>}
      {message && <div className="mt-4 flex gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-100"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {message}</div>}

      {/* IDE Status Bar */}
      <div className="mt-5 flex flex-wrap gap-2">
        {ideStatuses.map(ide => {
          const Icon = ideIcons[ide.target] || Code2;
          return (
            <div key={ide.target} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black ${ide.available ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200' : 'border-border-secondary bg-bg-primary text-text-tertiary'}`}>
              <Icon className="h-3.5 w-3.5" />
              <span>{ide.target.toUpperCase()}</span>
              {ide.available ? <CheckCircle2 className="h-3 w-3 text-emerald-300" /> : <XCircle className="h-3 w-3 text-slate-600" />}
            </div>
          );
        })}
      </div>

      {/* Two-column layout: Contracts + IDE Handoff */}
      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        {/* Left: Contract list */}
        <div className="space-y-4">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat} className="rounded-2xl border border-border-primary bg-bg-primary/40 p-4">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-text-secondary">{categoryLabel[cat] || cat}</div>
              <div className="space-y-2">
                {items.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContract(selectedContract?.id === c.id ? null : c)}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${selectedContract?.id === c.id ? 'border-cyan-500/40 bg-cyan-950/20' : 'border-border-primary bg-slate-950/50 hover:border-border-secondary'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-text-primary">{c.title}</div>
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${c.health.ok ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200' : 'border-rose-500/30 bg-rose-950/30 text-rose-200'}`}>
                          {c.health.ok ? 'OK' : '!OK'}
                        </span>
                        <span className="rounded-full border border-border-secondary bg-bg-primary px-2 py-0.5 text-[9px] font-bold text-text-secondary">{authLabel[c.authMode] || c.authMode}</span>
                      </div>
                    </div>
                    <div className="mt-1 text-[10px] text-text-tertiary">{c.subtitle}</div>
                    {selectedContract?.id === c.id && (
                      <div className="mt-3 space-y-2 border-t border-border-primary pt-3">
                        <div className="flex flex-wrap gap-1">
                          {c.capabilities.slice(0, 5).map(cap => (
                            <span key={cap.id} className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${riskBadge[cap.risk]?.color} ${riskBadge[cap.risk]?.bg}`}>
                              {cap.label.length > 28 ? cap.label.slice(0, 28) + '...' : cap.label}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.quickActions.map(qa => (
                            <a
                              key={qa.label}
                              href={qa.href || '#'}
                              target={qa.href ? '_blank' : undefined}
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-border-secondary bg-bg-primary px-2 py-1 text-[10px] font-bold text-cyan-300 hover:border-cyan-500"
                              onClick={e => { if (!qa.href) e.preventDefault(); }}
                            >
                              <ExternalLink className="h-3 w-3" /> {qa.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: IDE Handoff + Open */}
        <div className="space-y-4">
          {/* Open IDE buttons */}
          <div className="rounded-2xl border border-border-primary bg-bg-primary/40 p-4">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-text-secondary flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-emerald-300" /> Mở IDE / Tool
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ideStatuses.filter(ide => ide.available).map(ide => {
                const Icon = ideIcons[ide.target] || Code2;
                return (
                  <button
                    key={ide.target}
                    onClick={() => handleOpenIDE(ide.target)}
                    disabled={busyTarget === ide.target}
                    className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-950/20 px-3 py-2 text-xs font-black text-violet-100 hover:bg-violet-900/30 disabled:opacity-60 transition-all"
                  >
                    {busyTarget === ide.target ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                    {ide.target === 'vscode' ? 'VS Code' : ide.target === 'cursor' ? 'Cursor' : ide.target === 'github' ? 'GitHub' : ide.target === 'terminal' ? 'Terminal' : ide.target}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Handoff prompt generator */}
          <div className="rounded-2xl border border-border-primary bg-bg-primary/40 p-4">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-text-secondary flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-amber-300" /> Sinh Handoff Prompt
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-text-tertiary">Target IDE</label>
                <select value={handoffTarget} onChange={e => setHandoffTarget(e.target.value)} className="mt-1 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs font-bold text-text-primary outline-none focus:border-cyan-500">
                  <option value="vscode">VS Code</option>
                  <option value="cursor">Cursor</option>
                  <option value="github">GitHub</option>
                  <option value="terminal">Terminal</option>
                  <option value="windsurf">Windsurf</option>
                  <option value="copilot">Copilot</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-text-tertiary">Mô tả tác vụ</label>
                <textarea
                  value={handoffTask}
                  onChange={e => setHandoffTask(e.target.value)}
                  placeholder="VD: Sửa lỗi CI trong workflow build, thêm Google Sheets Connector v1..."
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs font-semibold leading-5 text-slate-200 outline-none focus:border-cyan-500 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-text-tertiary">File liên quan (mỗi dòng 1 file)</label>
                <textarea
                  value={handoffFiles}
                  onChange={e => setHandoffFiles(e.target.value)}
                  placeholder="server/services/aiClient.ts&#10;src/utils/integrationHubApi.ts"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2 text-xs font-semibold leading-5 text-slate-200 outline-none focus:border-cyan-500 placeholder:text-slate-600"
                />
              </div>

              <button
                onClick={handleGenerateHandoff}
                disabled={handoffLoading || !handoffTask.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 px-4 py-2.5 text-xs font-black text-text-primary transition-colors"
              >
                {handoffLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                Sinh Handoff Prompt
              </button>
            </div>

            {/* Handoff result */}
            {handoffResult && (
              <div className="mt-4 rounded-xl border border-border-primary bg-slate-950/70 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-black text-text-primary">{handoffResult.title}</div>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${riskBadge[handoffResult.risk]?.color} ${riskBadge[handoffResult.risk]?.bg}`}>
                    Rủi ro: {handoffResult.risk}
                  </span>
                </div>

                <pre className="max-h-60 overflow-auto rounded-xl bg-black/40 p-3 text-[11px] font-semibold leading-5 text-slate-200 whitespace-pre-wrap">
                  {handoffResult.promptMarkdown}
                </pre>

                {handoffResult.safeCommands.length > 0 && (
                  <div>
                    <div className="text-[10px] font-black uppercase text-text-tertiary mb-1">Lệnh an toàn</div>
                    <div className="flex flex-wrap gap-1.5">
                      {handoffResult.safeCommands.map(cmd => (
                        <code key={cmd} className="rounded-lg bg-bg-primary border border-border-primary px-2 py-1 text-[10px] font-mono font-bold text-cyan-200">{cmd}</code>
                      ))}
                    </div>
                  </div>
                )}

                {handoffResult.testChecklist.length > 0 && (
                  <div>
                    <div className="text-[10px] font-black uppercase text-text-tertiary mb-1">Checklist kiểm tra</div>
                    {handoffResult.testChecklist.map((item, i) => (
                      <div key={i} className="text-[10px] text-text-secondary font-semibold leading-5 flex gap-1.5">
                        <span className="text-cyan-400">{i + 1}.</span> {item}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={copyHandoff}
                  className="flex items-center gap-1.5 rounded-lg border border-border-secondary bg-bg-primary px-3 py-1.5 text-[10px] font-bold text-text-secondary hover:border-cyan-500 transition-colors"
                >
                  <Copy className="h-3 w-3" /> Copy toàn bộ prompt
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

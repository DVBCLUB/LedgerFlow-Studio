import { useEffect, useState } from 'react';
import { CheckCircle2, Clipboard, Code2, ExternalLink, Github, Loader2, RefreshCw, Terminal, XCircle } from 'lucide-react';
import { fetchLocalToolSummary, openLocalTool, type LocalToolId, type LocalToolSummary, type LocalToolStatus } from '../../utils/integrationHubApi';

const toolIcons: Record<LocalToolId, typeof Code2> = {
  vscode: Code2,
  cursor: Code2,
  github: Github,
  actions: ExternalLink,
  terminal: Terminal,
};

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function LocalToolsPanel({ onChanged }: { onChanged?: () => void }) {
  const [summary, setSummary] = useState<LocalToolSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [busyTool, setBusyTool] = useState<LocalToolId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setSummary(await fetchLocalToolSummary());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được Local Tools Connector.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOpen(tool: Exclude<LocalToolId, 'terminal'>) {
    setBusyTool(tool);
    setError(null);
    setMessage(null);
    try {
      const result = await openLocalTool(tool);
      setMessage(result.message);
      onChanged?.();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không mở được tool local.');
    } finally {
      setBusyTool(null);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="rounded-3xl border border-border-primary bg-slate-950/80 p-5 shadow-2xl shadow-slate-950/40">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/30 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-200">
            <Terminal className="h-4 w-4" /> Local Tools Connector
          </div>
          <h2 className="mt-3 text-xl font-black text-text-primary">Mở nhanh VS Code / Cursor / GitHub từ LedgerFlow</h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-text-secondary">
            Connector này biến LedgerFlow thành đầu mối điều phối: app phát hiện tool local, mở đúng repo, sinh lệnh terminal an toàn để bạn copy/chạy thủ công. Không tự chạy lệnh build, delete, push nếu bạn chưa duyệt.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-secondary bg-bg-primary px-4 py-2 text-xs font-black text-slate-200 hover:border-violet-500"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Tải trạng thái
        </button>
      </div>

      {error && <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs font-bold text-rose-100">{error}</div>}
      {message && <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-100">{message}</div>}

      {summary && (
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-border-primary bg-bg-primary/50 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-text-tertiary">Project root</div>
              <div className="mt-1 break-all font-mono text-xs font-bold text-slate-200">{summary.projectRoot}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-text-secondary">
                <span>Repo: {summary.repo}</span>
                <span>Checked: {new Date(summary.checkedAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {summary.tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} busy={busyTool === tool.id} onOpen={handleOpen} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border-primary bg-bg-primary/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-text-primary">
              <Clipboard className="h-4 w-4 text-amber-300" /> Lệnh terminal an toàn
            </div>
            <div className="space-y-2">
              {summary.safeCommands.map((item) => (
                <div key={item.command} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black text-text-primary">{item.label}</div>
                      <p className="mt-1 text-[11px] font-semibold leading-5 text-text-secondary">{item.purpose}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyText(item.command).then(() => setMessage(`Đã copy: ${item.command}`))}
                      className="rounded-lg border border-border-secondary bg-bg-primary px-2 py-1 text-[10px] font-black text-slate-200 hover:border-amber-400"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="mt-2 overflow-auto rounded-xl bg-black/40 p-2 text-[11px] font-bold text-cyan-100">{item.command}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ToolCard({
  tool,
  busy,
  onOpen,
}: {
  tool: LocalToolStatus;
  busy: boolean;
  onOpen: (tool: Exclude<LocalToolId, 'terminal'>) => Promise<void>;
}) {
  const Icon = toolIcons[tool.id] ?? Code2;
  const canOpen = tool.id !== 'terminal' && tool.available;

  return (
    <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-950/30">
            <Icon className="h-5 w-5 text-violet-200" />
          </div>
          <div>
            <div className="text-sm font-black text-text-primary">{tool.label}</div>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-text-secondary">{tool.message}</p>
          </div>
        </div>
        {tool.available ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" /> : <XCircle className="h-5 w-5 shrink-0 text-rose-300" />}
      </div>
      {tool.command && <div className="mt-3 break-all rounded-xl border border-border-primary bg-bg-surface/70 p-2 font-mono text-[11px] font-bold text-cyan-100">{tool.command}</div>}
      {canOpen && (
        <button
          type="button"
          onClick={() => void onOpen(tool.id as Exclude<LocalToolId, 'terminal'>)}
          disabled={busy}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-950/30 px-3 py-2 text-xs font-black text-violet-100 hover:bg-violet-900/40 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
          Mở
        </button>
      )}
    </div>
  );
}

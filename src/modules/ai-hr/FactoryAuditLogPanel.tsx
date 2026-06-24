import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw } from 'lucide-react';

interface AuditEvent {
  id: string;
  area: string;
  level: string;
  title: string;
  detail: string;
  entityId?: string;
  createdAt: string;
}

const API_BASE = 'http://localhost:3011/api/software-factory';

function LevelIcon({ level }: { level: string }) {
  if (level === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (level === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-300" />;
  if (level === 'error') return <AlertTriangle className="h-4 w-4 text-rose-300" />;
  return <Info className="h-4 w-4 text-cyan-300" />;
}

function LevelBadge({ level }: { level: string }) {
  const cls = level === 'success'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
    : level === 'warning'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
      : level === 'error'
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
        : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${cls}`}>{level}</span>;
}

export default function FactoryAuditLogPanel() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async (selectedArea = area) => {
    setLoading(true);
    setMessage(null);
    try {
      const query = selectedArea ? `?area=${selectedArea}` : '';
      const response = await fetch(`${API_BASE}/audit${query}`);
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const payload = await response.json();
      setEvents(payload.events || []);
      setStats(payload.stats || {});
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Cannot load audit log');
    } finally {
      setLoading(false);
    }
  };

  const seed = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/audit/seed`, { method: 'POST' });
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      await refresh(area);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Cannot seed audit log');
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh('');
  }, []);

  const areas = ['', 'run', 'execution', 'provider', 'asset', 'release', 'command', 'git', 'system'];

  return <section className="space-y-4 rounded-[2rem] border border-amber-400/20 bg-slate-950/55 p-5 text-left shadow-xl shadow-slate-950/20">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-200"><Activity className="mr-2 inline h-4 w-4" />Runtime audit log</p>
        <h3 className="mt-2 text-xl font-black text-white">Factory runtime activity trail</h3>
        <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-400">Panel này đọc audit log từ daemon cục bộ để theo dõi run, execution, provider, asset, release, command và Git actions.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={area} onChange={(event) => { setArea(event.target.value); refresh(event.target.value); }} className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200">
          {areas.map((item) => <option key={item || 'all'} value={item}>{item || 'all areas'}</option>)}
        </select>
        <button onClick={() => refresh(area)} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-amber-400/40 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
        </button>
        <button onClick={seed} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-100 hover:border-amber-300/60 disabled:opacity-60">Seed audit</button>
      </div>
    </div>

    {message && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-6 text-amber-100">{message}</div>}

    <div className="grid gap-3 md:grid-cols-5">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">events</p><p className="mt-1 text-2xl font-black text-white">{stats.total ?? events.length}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">success</p><p className="mt-1 text-2xl font-black text-emerald-200">{stats.success ?? 0}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">warning</p><p className="mt-1 text-2xl font-black text-amber-200">{stats.warning ?? 0}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">error</p><p className="mt-1 text-2xl font-black text-rose-200">{stats.error ?? 0}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">info</p><p className="mt-1 text-2xl font-black text-cyan-200">{stats.info ?? 0}</p></div>
    </div>

    <div className="space-y-2">
      {events.length === 0 ? <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-bold text-slate-500">Chưa có audit event. Hãy click Seed audit hoặc chạy một action runtime.</div> : events.slice(0, 12).map((event) => <div key={event.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <LevelIcon level={event.level} />
            <div>
              <p className="text-xs font-black text-white">{event.title}</p>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{event.detail}</p>
              {event.entityId && <p className="mt-1 text-[10px] font-bold text-slate-600">Entity: {event.entityId}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={event.level} />
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-300">{event.area}</span>
            <span className="text-[10px] font-bold text-slate-600">{new Date(event.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>)}
    </div>
  </section>;
}

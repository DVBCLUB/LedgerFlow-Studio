import type { ConnectorDefinition } from '../../../types/agentOps';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export default function ConnectorsTab() {
  const connectors = readLocal<ConnectorDefinition[]>('ledgerflow_connector_sdk_registry_v1', []);
  return (
    <section className="rounded-3xl border border-cyan-400/35 bg-cyan-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Connector registry</p>
      <h3 className="mt-1 text-xl font-black text-white">Connectors</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Đọc connector registry cũ bằng type chung.</p>
      <div className="mt-4 grid gap-2">
        {connectors.map((item) => <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{item.name}</p><p className="mt-1 text-xs font-semibold text-slate-400">{item.category} · {item.mode} · {item.risk} · {item.status}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{item.purpose}</p></div>)}
        {connectors.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold text-slate-400">Chưa có connector lưu trong localStorage.</p>}
      </div>
    </section>
  );
}

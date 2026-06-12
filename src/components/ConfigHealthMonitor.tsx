import { useEffect, useState } from 'react';

type HealthSnapshot = {
  at: string;
  ok: boolean;
  providerCount: number;
  enabledCount: number;
  providers: string[];
  health?: Record<string, unknown>;
  autoLock?: Record<string, unknown>;
  notes: string[];
};

function exportJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function readSnapshot() {
  try {
    const raw = localStorage.getItem('ledgerflow_config_health_snapshot_v1');
    return raw ? JSON.parse(raw) as HealthSnapshot : null;
  } catch {
    return null;
  }
}

export default function ConfigHealthMonitor() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(() => readSnapshot());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [keysRes, healthRes, autoLockRes] = await Promise.all([
        fetch('/api/ai/keys'),
        fetch('/api/ai/health').catch(() => null),
        fetch('/api/ai/keys/auto-lock').catch(() => null)
      ]);
      const keysPayload = await keysRes.json();
      const healthPayload = healthRes ? await healthRes.json() : undefined;
      const autoLockPayload = autoLockRes ? await autoLockRes.json() : undefined;
      if (!keysPayload.success) throw new Error(keysPayload.error || 'Không đọc được cấu hình runtime.');
      const items = Array.isArray(keysPayload.keys) ? keysPayload.keys : [];
      const next: HealthSnapshot = {
        at: new Date().toLocaleString('vi-VN'),
        ok: true,
        providerCount: items.length,
        enabledCount: items.filter((item: any) => item.enabled !== false).length,
        providers: Array.from(new Set(items.map((item: any) => item.provider || 'unknown'))),
        health: healthPayload,
        autoLock: autoLockPayload?.autoLock || keysPayload.autoLock,
        notes: [
          'Màn này chỉ hiển thị metadata cấu hình, không hiển thị giá trị nhạy cảm.',
          'Luồng code vẫn đi qua Review Desk một lần duyệt.',
          'Không tự merge, không tự deploy, không tự chạy terminal/browser thật.'
        ]
      };
      localStorage.setItem('ledgerflow_config_health_snapshot_v1', JSON.stringify(next, null, 2));
      setSnapshot(next);
      window.dispatchEvent(new CustomEvent('ledgerflow-config-health-updated', { detail: next }));
      setMessage('Đã cập nhật trạng thái cấu hình.');
    } catch (error: any) {
      setMessage(error.message || 'Không đọc được trạng thái cấu hình.');
      const failed: HealthSnapshot = { at: new Date().toLocaleString('vi-VN'), ok: false, providerCount: 0, enabledCount: 0, providers: [], notes: ['Cần kiểm tra backend runtime hoặc cấu hình đang khóa.'] };
      localStorage.setItem('ledgerflow_config_health_snapshot_v1', JSON.stringify(failed, null, 2));
      setSnapshot(failed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!snapshot) void refresh();
  }, []);

  const status = !snapshot ? 'UNKNOWN' : snapshot.ok && snapshot.enabledCount > 0 ? 'OK' : snapshot.ok ? 'NO ACTIVE PROVIDER' : 'NEEDS REVIEW';

  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Config health</p>
          <h3 className="mt-1 text-xl font-black text-white">Runtime Configuration Health</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Kiểm tra tình trạng cấu hình backend ở mức metadata, không hiển thị giá trị nhạy cảm.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={refresh} disabled={loading} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60">{loading ? 'Đang kiểm tra...' : 'Refresh'}</button>
          <button onClick={() => exportJson('ledgerflow-config-health.json', snapshot || {})} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-300">Xuất JSON</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Status</p><p className="mt-2 text-lg font-black text-white">{status}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Providers</p><p className="mt-2 text-lg font-black text-white">{snapshot?.providerCount ?? 0}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Enabled</p><p className="mt-2 text-lg font-black text-white">{snapshot?.enabledCount ?? 0}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Updated</p><p className="mt-2 text-sm font-black text-white">{snapshot?.at || 'Chưa có'}</p></div>
      </div>

      {message && <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-bold text-slate-300">{message}</p>}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-white">Provider metadata</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{(snapshot?.providers || []).join(', ') || 'Chưa có provider.'}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-white">Guardrails</p>
          <div className="mt-2 space-y-2 text-sm font-semibold leading-6 text-slate-300">{(snapshot?.notes || []).map((note) => <p key={note}>• {note}</p>)}</div>
        </div>
      </div>
    </section>
  );
}

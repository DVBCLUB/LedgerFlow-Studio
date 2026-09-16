import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Smartphone, ShieldCheck, Database, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { getPwaSyncStatus, forcePwaSync, type PwaSyncStatus } from '../../utils/aiOpsApi';

export default function PwaOfflineSyncPanel() {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [status, setStatus] = useState<PwaSyncStatus>({
    queueDepth: 0,
    lastSyncAt: null,
    conflictCount: 0,
    pendingBytes: 0,
    connectedClients: 0,
    serviceWorkerVersion: 'sw-unknown',
    isOnline: true
  });

  useEffect(() => {
    getPwaSyncStatus().then(setStatus).catch(() => {});
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await forcePwaSync();
      setSynced(true);
    } catch {
      /* offline fallback */
    }
    setSyncing(false);
  };

  const STATUS = {
    queueDepth: status.queueDepth,
    lastSync: status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleTimeString('vi-VN') : 'chưa sync',
    conflicts: status.conflictCount,
    pendingKb: Number((status.pendingBytes / 1024).toFixed(1)),
    clients: status.connectedClients,
    version: status.serviceWorkerVersion,
    online: status.isOnline,
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Wifi className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Động Cơ Đồng Bộ Offline PWA (Offline Sync Engine)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Service Worker {STATUS.version}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Hàng đợi Offline Queue · Tự giải quyết xung đột dữ liệu · Đồng bộ đa thiết bị thời gian thực.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              STATUS.online
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${STATUS.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {STATUS.online ? '🟢 Online' : '🔴 Offline'}
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 to-teal-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hàng Đợi Chờ Gửi</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300 font-mono">
            {STATUS.queueDepth} <span className="text-xs text-slate-400 font-normal">items</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Đã lưu trong IndexedDB</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dung Lượng Chờ Đồng Bộ</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            {STATUS.pendingKb} <span className="text-xs text-slate-400 font-normal">KB</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Nén nhị phân siêu nhẹ</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thiết Bị Đang Kết Nối</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            {STATUS.clients} <span className="text-xs text-slate-400 font-normal">thiết bị</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">PC, Tablet, Mobile</p>
        </div>
      </div>

      {/* Action Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Cưỡng Bức Đồng Bộ Ngay (Force Sync Now)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Giải phóng toàn bộ hàng đợi offline ({STATUS.queueDepth} items) và đối soát dữ liệu với máy chủ tức thì.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={syncing || synced}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            synced
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-500/20'
          }`}
        >
          {synced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />}
          <span>{syncing ? '⏳ Đang Đồng Bộ...' : synced ? '✓ Đã Đồng Bộ Xong' : '🚀 Force Sync Now'}</span>
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
export default function PwaOfflineSyncPanel() {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const handleSync = () => { setSyncing(true); setTimeout(() => { setSyncing(false); setSynced(true); }, 1500); };
  const STATUS = { queueDepth: 7, lastSync: '5 phút trước', conflicts: 1, pendingKb: 41.9, clients: 3, version: 'sw-v2.14.0', online: true };
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#134e4a22,#0d948022)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #0d948044' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>📶 PWA Offline Sync Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Offline Queue · Conflict Resolution · Multi-Client Sync · Service Worker {STATUS.version}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[
          { l: 'Queue Depth', v: STATUS.queueDepth + ' items', warn: STATUS.queueDepth > 5 },
          { l: 'Pending Data', v: STATUS.pendingKb + ' KB', warn: false },
          { l: 'Conflicts', v: STATUS.conflicts + ' cần giải quyết', warn: STATUS.conflicts > 0 },
          { l: 'Connected Clients', v: STATUS.clients + ' thiết bị', warn: false },
          { l: 'Last Sync', v: STATUS.lastSync, warn: false },
          { l: 'Network Status', v: STATUS.online ? '🟢 Online' : '🔴 Offline', warn: !STATUS.online },
        ].map(c => (
          <div key={c.l} style={{ background: c.warn ? '#7f1d1d22' : '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid ' + (c.warn ? '#ef444440' : '#334155') }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.l}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: c.warn ? '#fca5a5' : '#2dd4bf', marginTop: '0.25rem' }}>{c.v}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 1rem', color: '#e2e8f0', fontSize: '1rem' }}>🔄 Force Sync</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>Drain toàn bộ offline queue ({STATUS.queueDepth} items) và reconcile với server ngay lập tức.</p>
        <button onClick={handleSync} disabled={syncing || synced} style={{ background: synced ? '#16a34a' : '#0d9488', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: syncing ? 'wait' : 'pointer', fontWeight: 600, opacity: syncing ? 0.7 : 1 }}>
          {syncing ? '⏳ Đang sync...' : synced ? '✅ Đã sync xong' : '🔄 Force Sync Now'}
        </button>
        {synced && <p style={{ color: '#4ade80', fontSize: '0.875rem', marginTop: '0.75rem' }}>✅ Sync thành công: 7 items · 1 conflict resolved · 0 lỗi.</p>}
      </div>
    </div>
  );
}

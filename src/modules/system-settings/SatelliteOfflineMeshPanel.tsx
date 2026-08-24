import React, { useState } from 'react';

export default function SatelliteOfflineMeshPanel() {
  const [synced, setSynced] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#0284c722,#0369a122)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #0284c744' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🛰️ Starlink & Satellite Offline-Mesh Sync</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Đồng bộ vệ tinh Protobuf siêu nhẹ (18.4x nén) cho mỏ khoáng sản & giàn khoan xa bờ</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Offshore Sites', value: '4 Sites', color: '#34d399' }, { label: 'Compression Ratio', value: '18.4x Protobuf', color: '#60a5fa' }, { label: 'Satellite Uptime', value: '99.98%', color: '#a78bfa' }, { label: 'Sync Latency', value: '480ms LEO', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Đồng bộ gói tin vệ tinh Starlink (Trigger Satellite Sync)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Nén nhị phân 42 bản ghi Sổ cái và truyền qua vệ tinh Starlink trong 1,840 bytes.</p>
        </div>
        <button onClick={() => setSynced(true)} style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {synced ? '✓ Synced 42 Packets via Satellite' : '🚀 Sync Satellite Mesh'}
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

export default function IotEdgeScaleSyncPanel() {
  const [synced, setSynced] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#0284c722,#0369a122)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #0284c744' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>📡 IoT Edge & Hardware Scale/RFID Sync Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Kết nối trực tiếp Cân xe tải 80 Tấn, Cổng RFID kho & Cảm biến đo dầu vào Sổ cái Kế toán 152</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Connected Devices', value: '8 Hardware Units', color: '#34d399' }, { label: 'Synced Events 24h', value: '1,240 GRN/GDN', color: '#60a5fa' }, { label: 'Hardware Health', value: '100% Online', color: '#a78bfa' }, { label: 'Latency', value: '< 20ms Edge', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Diễn tập nhận tín hiệu cân điện tử xe tải (Simulate Scale Event)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Quét tải trọng 25.4 Tấn Cát vàng và tự động sinh phiếu nhập kho GRN vào Sổ cái TK 152.</p>
        </div>
        <button onClick={() => setSynced(true)} style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {synced ? '✓ GRN Created & Synced to TK 152' : '🚀 Simulate Scale Telemetry'}
        </button>
      </div>
    </div>
  );
}

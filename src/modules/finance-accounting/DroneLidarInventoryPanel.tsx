import React, { useState } from 'react';

export default function DroneLidarInventoryPanel() {
  const [processed, setProcessed] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#064e3b22,#05966922)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #05966944' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🚁 Drone 3D LiDAR Volumetric Inventory Audit</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Xử lý đám mây điểm 48.5M points từ Drone · Tính thể tích bãi cát & kho thép chính xác 99.4%</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Scanned Sites', value: '6 Sites', color: '#34d399' }, { label: 'Point Cloud Points', value: '48.5M Points', color: '#60a5fa' }, { label: 'Volume Accuracy', value: '99.4%', color: '#a78bfa' }, { label: 'Stock Variance', value: '< 0.4% (Pass)', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Xử lý dữ liệu LiDAR bay kiểm kê (Process Drone Point Cloud)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Tính toán thể tích 4,250 m³ cát vàng và tự động đối soát khớp với Sổ kho TK 152.</p>
        </div>
        <button onClick={() => setProcessed(true)} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {processed ? '✓ 6,375 Tons Reconciled to TK 152' : '🚀 Process Point Cloud'}
        </button>
      </div>
    </div>
  );
}

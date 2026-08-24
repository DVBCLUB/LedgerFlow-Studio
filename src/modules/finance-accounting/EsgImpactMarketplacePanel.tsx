import React, { useState } from 'react';

export default function EsgImpactMarketplacePanel() {
  const [purchased, setPurchased] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#064e3b22,#05966922)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #05966944' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🌍 ESG Impact & Carbon Offset Marketplace Integration</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Đo lường Scope 1/2/3 · Sàn giao dịch tín chỉ Carbon VCS Verra · Lộ trình Net Zero 2028</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Scope Emissions', value: '142.5 Tấn', color: '#34d399' }, { label: 'Carbon Offset', value: '142.5 Tấn (100%)', color: '#60a5fa' }, { label: 'ESG Rating', value: 'AAA Net-Zero', color: '#a78bfa' }, { label: 'Target Year', value: '2028', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Mua tín chỉ Carbon bù đắp phát thải (Carbon Offset Purchase)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Chứng chỉ VCS Verra từ Dự án Trồng rừng Ngập mặn Cà Mau với chứng thư số blockchain.</p>
        </div>
        <button onClick={() => setPurchased(true)} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {purchased ? '✓ Offset Certified: CARBON-CERT-VCS' : '🚀 Purchase Carbon Credits'}
        </button>
      </div>
    </div>
  );
}

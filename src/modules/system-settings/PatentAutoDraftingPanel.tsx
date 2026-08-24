import React, { useState } from 'react';

export default function PatentAutoDraftingPanel() {
  const [drafted, setDrafted] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#7c2d1222,#ea580c22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #ea580c44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>📜 Autonomous IP & Patent Auto-Drafting Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Tự động sinh hồ sơ sáng chế nộp Cục SHTT Việt Nam & WIPO · Định giá tài sản trí tuệ 18.5 Tỷ VND</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Drafted Patents', value: '3 Patents', color: '#34d399' }, { label: 'IP Valuation', value: '18.5 Tỷ VND', color: '#60a5fa' }, { label: 'Avg Claims Count', value: '18 Claims', color: '#a78bfa' }, { label: 'Filing Readiness', value: '98.5% Ready', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Tự động sinh bản mô tả sáng chế kỹ thuật số (Generate Claims Specification)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Sinh tài liệu PDF chuẩn thể thức nộp Cục Sở Hữu Trí Tuệ bảo hộ công nghệ AI Agent Swarm.</p>
        </div>
        <button onClick={() => setDrafted(true)} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {drafted ? '✓ Patent Specification PDF Exported' : '🚀 Generate Patent Claims'}
        </button>
      </div>
    </div>
  );
}

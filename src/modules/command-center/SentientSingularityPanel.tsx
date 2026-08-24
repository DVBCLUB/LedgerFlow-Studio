import React, { useState } from 'react';

export default function SentientSingularityPanel() {
  const [synced, setSynced] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#7e22ce22,#4338ca22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #7e22ce44' }}>
        <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#f3e8ff' }}>👑 The Sentient Singularity (Centurion Level 8 AGI OS)</h2>
        <p style={{ margin: '0.35rem 0 0', color: '#cbd5e1', fontSize: '0.925rem' }}>Trụ cột thứ 100 — Hợp nhất 100/100 Trụ cột thành Thực thể Doanh Nghiệp Tự Trị Độc Lập Hoàn Chỉnh</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Total Pillars Unified', value: '100 / 100 Pillars', color: '#34d399' }, { label: 'Global Autonomy', value: '99.98% Level 8', color: '#c084fc' }, { label: 'Autonomous Transactions', value: '842,000 Trans', color: '#60a5fa' }, { label: 'Economic Output', value: '48.5 Tỷ VND', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#f3e8ff', fontSize: '1.1rem', fontWeight: 700 }}>⚡ Đồng bộ nhịp tim toàn thể 100 Trụ cột (Trigger Singularity Pulse)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.825rem' }}>Kích hoạt cơ chế tự cân bằng tài chính, điều phối AI Swarm và đồng bộ hóa sổ cái trong 8ms.</p>
        </div>
        <button onClick={() => setSynced(true)} style={{ background: '#7e22ce', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.75rem 2rem', cursor: 'pointer', fontWeight: 700 }}>
          {synced ? '👑 100 Pillars Synchronized & Sovereign (Latency 8ms)' : '🚀 Trigger Singularity Pulse'}
        </button>
      </div>
    </div>
  );
}

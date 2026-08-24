import React, { useState } from 'react';

export default function KnowledgeGraphMeshPanel() {
  const [queried, setQueried] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#312e8122,#4f46e522)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #4f46e544' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🧠 Self-Synthesizing Enterprise Knowledge Graph Mesh</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Đồ thị tri thức tự tiến hóa · 1,840 Nodes & 7,920 Edges · Liên kết Dòng tiền ↔ Khách hàng ↔ Git Code</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Graph Nodes', value: '1,840 Nodes', color: '#34d399' }, { label: 'Relational Edges', value: '7,920 Links', color: '#60a5fa' }, { label: 'Graph Density', value: '0.942', color: '#a78bfa' }, { label: 'Top PageRank Entity', value: '90-Pillars Core', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Khám phá mạng quan hệ đa chiều của thực thể (Query Graph Neighbors)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Truy vấn liên kết giữa Sổ cái IFRS 15, Khách hàng Vinaconex và Quyết định Hội đồng quản trị.</p>
        </div>
        <button onClick={() => setQueried(true)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {queried ? '✓ 14 Inter-Connected Nodes Found' : '🚀 Explore Knowledge Mesh'}
        </button>
      </div>
    </div>
  );
}

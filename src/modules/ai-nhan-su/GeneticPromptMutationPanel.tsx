import React, { useState } from 'react';

export default function GeneticPromptMutationPanel() {
  const [evolved, setEvolved] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#312e8122,#4f46e522)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #4f46e544' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🧬 Autonomous Genetic Prompt Mutation Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Đột biến & tiến hóa system prompt cho 52+ Swarm Agents qua giải thuật di truyền · Tăng +34.8% độ chuẩn xác</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Generations Evolved', value: '142 Gens', color: '#34d399' }, { label: 'Fitness Gain', value: '+34.8%', color: '#60a5fa' }, { label: 'Optimized Agents', value: '52 Swarms', color: '#a78bfa' }, { label: 'Top Fitness Score', value: '99.7%', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Đột biến tiến hóa thế hệ Prompt mới (Evolve Prompt Generation)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Tự động chắt lọc mẫu đối thoại thành công và tối ưu hóa câu lệnh cho CFO AI Agent.</p>
        </div>
        <button onClick={() => setEvolved(true)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {evolved ? '✓ Gen 15 Champion Evolved (Fitness 99.7%)' : '🚀 Evolve Agent Prompts'}
        </button>
      </div>
    </div>
  );
}

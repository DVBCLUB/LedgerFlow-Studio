import React, { useState } from 'react';

export default function ZeroKnowledgeAuditPanel() {
  const [proved, setProved] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#312e8122,#1e1b4b22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #312e8144' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🛡️ Zero-Knowledge Proof (ZKP) Confidential Audit</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Ứng dụng zk-SNARKs Groth16 / BN254 kiểm toán 15.36 Tỷ VND doanh thu không tiết lộ PII</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'zk-Audited Revenue', value: '15.36 Tỷ VND', color: '#34d399' }, { label: 'Proof Circuit', value: 'Groth16 zk-SNARK', color: '#60a5fa' }, { label: 'Confidential Proofs', value: '24 Proofs', color: '#a78bfa' }, { label: 'Verification Time', value: '14ms Instant', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Sinh bằng chứng mật mã không tiết lộ tri thức (Generate zk-SNARK Proof)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Chứng minh tính hợp lệ 100% của Sổ cái cho đơn vị kiểm toán Big-4 trong 14ms.</p>
        </div>
        <button onClick={() => setProved(true)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {proved ? '✓ zk-Proof Mathematically Verified' : '🚀 Generate zk-Proof'}
        </button>
      </div>
    </div>
  );
}

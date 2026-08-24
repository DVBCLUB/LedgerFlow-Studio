import React, { useState } from 'react';

export default function SmartContractEscrowPanel() {
  const [released, setReleased] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#0284c722,#0369a122)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #0284c744' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>📜 Autonomous Smart Contract Escrow Settlement</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Khóa quỹ bảo chứng 4.5 Tỷ VND · Tự động giải ngân qua Smart Contract khi AI nghiệm thu milestone (4.2s)</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Locked Escrow Pool', value: '4.5 Tỷ VND', color: '#34d399' }, { label: 'Settlement Success', value: '100.0%', color: '#60a5fa' }, { label: 'Disbursement Speed', value: '4.2 Seconds', color: '#a78bfa' }, { label: 'Networks', value: 'Arbitrum & Solana', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Giải ngân quỹ bảo chứng Smart Contract (Release Escrow Settlement)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Thanh toán 2.5 Tỷ VND cho Vinaconex 3 ngay khi AI Agent xác nhận nghiệm thu phần thân.</p>
        </div>
        <button onClick={() => setReleased(true)} style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {released ? '✓ 2.5B VND Released via Smart Contract (Tx: 0x8f4b...)' : '🚀 Release Escrow Funds'}
        </button>
      </div>
    </div>
  );
}

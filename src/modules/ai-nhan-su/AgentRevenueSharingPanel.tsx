import React, { useState } from 'react';

export default function AgentRevenueSharingPanel() {
  const [paid, setPaid] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#312e8122,#4f46e522)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #4f46e544' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🤖 Autonomous AI Agent Marketplace & Revenue Sharing</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Hệ sinh thái Agent Swarm phân phối · Chia sẻ 70% doanh thu cho Creator · Payout VietQR tự động</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Creator Payouts YTD', value: '840M VND', color: '#34d399' }, { label: 'Published Agents', value: '24 Swarms', color: '#60a5fa' }, { label: 'Creator Share', value: '70% Revenue', color: '#a78bfa' }, { label: 'Platform Take Rate', value: '30%', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Tự động thanh toán hoa hồng cho Nhà phát triển AI Agent</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Giải ngân tự động qua VietQR theo tỷ lệ chia sẻ 70/30 sau khi trừ chi phí token burn.</p>
        </div>
        <button onClick={() => setPaid(true)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {paid ? '✓ Payout Disbursed via VietQR' : '🚀 Disburse Creator Payout'}
        </button>
      </div>
    </div>
  );
}

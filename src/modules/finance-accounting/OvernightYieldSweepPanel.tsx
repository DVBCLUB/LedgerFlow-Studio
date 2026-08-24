import React, { useState } from 'react';

export default function OvernightYieldSweepPanel() {
  const [swept, setSwept] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#064e3b22,#04785722)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #04785744' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>⚡ High-Frequency Cashflow Overnight Yield Sweep</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Quét số dư tiền mặt nhàn rỗi 28.4 Tỷ VND · Tối ưu hóa lợi suất qua đêm 5.5%/năm (+4.28M VND/ngày)</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Idle Cash Pool', value: '28.4 Tỷ VND', color: '#34d399' }, { label: 'Daily Yield Earned', value: '+4.28M VND', color: '#60a5fa' }, { label: 'Annualized Yield', value: '1.56 Tỷ VND', color: '#a78bfa' }, { label: 'Yield Rate', value: '5.5% / year', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Thực hiện quét tự động số dư nhàn rỗi (Execute Overnight Sweep)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Chuyển tiền vào quỹ thị trường tiền tệ MMF và tự động hoàn trả thanh khoản vào 08:00 sáng mai.</p>
        </div>
        <button onClick={() => setSwept(true)} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {swept ? '✓ Swept 28.4B VND (+4.28M/day Active)' : '🚀 Execute Yield Sweep'}
        </button>
      </div>
    </div>
  );
}

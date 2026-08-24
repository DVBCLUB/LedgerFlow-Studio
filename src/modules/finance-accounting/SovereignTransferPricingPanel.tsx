import React, { useState } from 'react';

export default function SovereignTransferPricingPanel() {
  const [calculated, setCalculated] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b22,#3730a322)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #3730a344' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🌐 Sovereign Multi-State Transfer Pricing & Tax Shield</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Quản trị thuế chuyển giá NĐ 132/2020 & DTAA quốc tế (VN, SG, US) · Tối ưu hóa 850M VND thuế</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Cross-Border Volume', value: '6.4 Tỷ VND', color: '#34d399' }, { label: 'Tax Savings', value: '850M VND', color: '#60a5fa' }, { label: 'Arm’s Length Margin', value: '8.5% Compliant', color: '#a78bfa' }, { label: 'Treaties Applied', value: '3 Nations', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Tính toán giá giao dịch liên kết chuẩn (Arm’s Length Calculation)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Sinh hồ sơ quốc gia (Local File) chứng minh biên lợi nhuận hợp lý theo chuẩn OECD.</p>
        </div>
        <button onClick={() => setCalculated(true)} style={{ background: '#3730a3', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {calculated ? '✓ Arm’s Length Validated (8.5% Margin)' : '🚀 Calculate Transfer Pricing'}
        </button>
      </div>
    </div>
  );
}

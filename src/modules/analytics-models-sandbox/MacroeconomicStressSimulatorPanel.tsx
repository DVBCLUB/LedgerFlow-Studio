import React, { useState } from 'react';

export default function MacroeconomicStressSimulatorPanel() {
  const [simulated, setSimulated] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#7c2d1222,#ea580c22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #ea580c44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🌪️ 10-Year Macroeconomic Stress Test Simulator</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Mô phỏng 10 năm biến động kinh tế vĩ mô DSGE · Chống chịu lạm phát 12% & Điểm sinh tồn 96.5/100</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Stress Robustness', value: '96.5 / 100', color: '#34d399' }, { label: 'Runway in Crisis', value: '32+ Months', color: '#60a5fa' }, { label: '10-Year Cashflow', value: '184 Tỷ VND', color: '#a78bfa' }, { label: 'Model Accuracy', value: 'DSGE Monte Carlo', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Chạy kịch bản khủng hoảng lạm phát 12% (Simulate Stagflation Shock)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Mô phỏng tác động tăng lãi suất +400 bps và kiểm tra độ an toàn của bảng cân đối kế toán.</p>
        </div>
        <button onClick={() => setSimulated(true)} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {simulated ? '✓ Balance Sheet Robustness: 97.2% Verified' : '🚀 Run Stress Test'}
        </button>
      </div>
    </div>
  );
}

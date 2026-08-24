import React, { useState } from 'react';

export default function HyperPersonalizationPanel() {
  const [generated, setGenerated] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#83184322,#be123c22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #be123c44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🎪 1-to-1 Hyper-Personalization Marketing Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Sinh nội dung chào hàng cá nhân hóa 100% theo ngành · Tỷ lệ mở 78.4% · Tỷ lệ phản hồi 34.2%</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Personalized Sent 30d', value: '1,420 Accounts', color: '#34d399' }, { label: 'Open Rate', value: '78.4%', color: '#60a5fa' }, { label: 'Reply Rate', value: '34.2%', color: '#a78bfa' }, { label: 'Avg Projected ROI', value: '365%', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Sinh nội dung pitch cá nhân hóa cho khách hàng mục tiêu</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Tự động tạo thông điệp giải quyết đúng nỗi đau kế toán và đối soát hóa đơn theo từng doanh nghiệp.</p>
        </div>
        <button onClick={() => setGenerated(true)} style={{ background: '#be123c', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {generated ? '✓ Pitch Generated & Ready to Send' : '🚀 Generate Pitch'}
        </button>
      </div>
    </div>
  );
}

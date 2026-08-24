import React, { useState } from 'react';

export default function CustomerSuccessAcademyPanel() {
  const [issued, setIssued] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#312e8122,#4338ca22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #4338ca44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🎓 AI-Powered Customer Success & Training Academy</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Lộ trình đào tạo tự động · Cấp chứng chỉ kế toán AI · 1,420 chuyên gia đã tốt nghiệp</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Certified Alumni', value: '1,420 Học viên', color: '#34d399' }, { label: 'Completion Rate', value: '92.4%', color: '#60a5fa' }, { label: 'NPS Improvement', value: '+28.5%', color: '#a78bfa' }, { label: 'Core Courses', value: '2 Tracks', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Cấp chứng chỉ tốt nghiệp tự động (Issue Certificate)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Sinh chứng chỉ số có mã xác thực QR cho học viên hoàn thành khóa học.</p>
        </div>
        <button onClick={() => setIssued(true)} style={{ background: '#4338ca', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {issued ? '✓ Certificate Issued: CERT-LF-Q3' : '🚀 Issue Certificate'}
        </button>
      </div>
    </div>
  );
}

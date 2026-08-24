import React, { useState } from 'react';

export default function VirtualDataRoomPanel() {
  const [granted, setGranted] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#064e3b22,#04785722)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #04785744' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>💼 Autonomous M&A Virtual Data Room (VDR Engine)</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Phòng dữ liệu ảo Due Diligence Series A · Watermark động chống rò rỉ · 105 tài liệu kiểm toán</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Total Verified Docs', value: '105 Files', color: '#34d399' }, { label: 'Investor Access', value: '6 Funds', color: '#60a5fa' }, { label: 'Data Room Size', value: '384 MB', color: '#a78bfa' }, { label: 'Audit Trail', value: '100% Cryptographic', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Cấp quyền truy cập VDR cho Quỹ đầu tư mạo hiểm (Grant Investor Access)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Kèm chữ ký bảo mật NDA và watermark số hiển thị email nhà đầu tư trên từng trang tài liệu.</p>
        </div>
        <button onClick={() => setGranted(true)} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {granted ? '✓ Secure Token & Watermark Generated' : '🚀 Grant VDR Access'}
        </button>
      </div>
    </div>
  );
}

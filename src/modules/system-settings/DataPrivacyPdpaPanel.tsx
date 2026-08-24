import React, { useState } from 'react';

export default function DataPrivacyPdpaPanel() {
  const [executed, setExecuted] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b22,#312e8122)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #312e8144' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🔐 Data Privacy & PDPA/GDPR Compliance Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Tuân thủ Nghị định 13/2023/NĐ-CP & GDPR · Tự động hóa DSAR · Mã hóa AES-256 GCM 48,920 bản ghi</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Encrypted PII Records', value: '48,920', color: '#34d399' }, { label: 'DSAR Requests 30d', value: '14 Handled', color: '#60a5fa' }, { label: 'Compliance Level', value: '100% Passed', color: '#a78bfa' }, { label: 'Retention Policies', value: '6 Active', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Tự động thực thi yêu cầu DSAR (Data Subject Access Request)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Trích xuất toàn bộ dữ liệu cá nhân theo yêu cầu khách hàng với mã xác thực cryptographic audit log.</p>
        </div>
        <button onClick={() => setExecuted(true)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {executed ? '✓ DSAR Request Executed (42 records)' : '🚀 Run DSAR Handler'}
        </button>
      </div>
    </div>
  );
}

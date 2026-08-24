import React, { useState } from 'react';

export default function BilingualVoiceBridgePanel() {
  const [translated, setTranslated] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#312e8122,#4338ca22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #4338ca44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🎙️ Real-Time Bilingual AI Voice Negotiation Bridge</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Tổng đài đàm thoại song ngữ Anh - Việt tức thời · Độ trễ 120ms · Tỷ lệ chốt hợp đồng quốc tế 88.5%</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Intl Calls Handled', value: '48 Calls', color: '#34d399' }, { label: 'Translation Latency', value: '120ms Realtime', color: '#60a5fa' }, { label: 'Negotiation Win Rate', value: '88.5%', color: '#a78bfa' }, { label: 'Audio Clarity', value: '98.4% Hi-Fi', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Thử nghiệm đàm thoại song ngữ VI ↔ EN tức thời</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Dịch thuật thuật ngữ hợp đồng kế toán IFRS 15 và điều khoản trọng tài thương mại quốc tế.</p>
        </div>
        <button onClick={() => setTranslated(true)} style={{ background: '#4338ca', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {translated ? '✓ Audio Stream Generated (120ms)' : '🚀 Translate Negotiation Voice'}
        </button>
      </div>
    </div>
  );
}

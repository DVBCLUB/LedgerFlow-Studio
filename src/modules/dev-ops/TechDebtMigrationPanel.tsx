import React, { useState } from 'react';

export default function TechDebtMigrationPanel() {
  const [scanned, setScanned] = useState(false);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#0284c722,#0369a122)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #0284c744' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🔭 Tech Debt & EOL Dependency Migration Roadmap AI</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Quét AST codebase · Phát hiện lỗ hổng bảo mật · Tự động lập kế hoạch dọn dẹp kỹ thuật</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[{ label: 'Codebase Health', value: '98.8%', color: '#34d399' }, { label: 'Est. Debt Hours', value: '16.5h', color: '#60a5fa' }, { label: 'CVE Vulnerabilities', value: '0 Critical', color: '#a78bfa' }, { label: 'Auto-Fix Ready', value: '100% Ready', color: '#fbbf24' }].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Sinh kế hoạch nâng cấp tự động (Generate Migration Roadmap)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Tự động sinh các bản vá AST refactoring và tối ưu hóa bundle weight.</p>
        </div>
        <button onClick={() => setScanned(true)} style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {scanned ? '✓ Roadmap Generated: Target 99.5%' : '🚀 Generate Roadmap'}
        </button>
      </div>
    </div>
  );
}

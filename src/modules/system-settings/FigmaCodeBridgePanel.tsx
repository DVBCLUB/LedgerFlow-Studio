import React, { useState } from 'react';
import { importFigmaComponent, FigmaConversionResult } from '../../utils/knowledgeIntegrationsApi';

export default function FigmaCodeBridgePanel() {
  const [figmaUrl, setFigmaUrl] = useState('https://figma.com/file/sample');
  const [componentName, setComponentName] = useState('LedgerFlowDashboard');
  const [result, setResult] = useState<FigmaConversionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImport = () => {
    setLoading(true);
    importFigmaComponent({ figmaUrl, componentName })
      .then((d) => setResult(d.result))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#312e8122,#4338ca22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #4338ca44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🎨 Figma → React Code Bridge</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Chuyển design token & layout Figma thành JSX + CSS Variables · Đồng bộ component tự động</p>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input value={figmaUrl} onChange={(e) => setFigmaUrl(e.target.value)} placeholder="Figma URL" style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontSize: '0.875rem' }} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input value={componentName} onChange={(e) => setComponentName(e.target.value)} placeholder="Component name" style={{ flex: 1, background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontSize: '0.875rem' }} />
          <button onClick={handleImport} disabled={loading} style={{ background: '#4338ca', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
            {loading ? 'Đang import...' : '🎨 Import Figma'}
          </button>
        </div>
      </div>
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155' }}>
            <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.75rem' }}>Design Tokens</div>
            <pre style={{ margin: 0, color: '#38bdf8', fontSize: '0.8rem', fontFamily: 'monospace' }}>{JSON.stringify(result.designTokens, null, 2)}</pre>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155' }}>
            <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.75rem' }}>Generated JSX — {result.componentName}</div>
            <pre style={{ margin: 0, color: '#34d399', fontSize: '0.8rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{result.jsxCode}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

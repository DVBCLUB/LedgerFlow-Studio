import React, { useState } from 'react';
import { generateCodeDiff, FileDiffSession } from '../../utils/devopsApi';

export default function AiCodeDiffPanel() {
  const [targetFile, setTargetFile] = useState('src/utils/aiSettingsApi.ts');
  const [original, setOriginal] = useState('export function getAiConfig() {\n  return { provider: "openai" };\n}');
  const [proposed, setProposed] = useState('export function getAiConfig() {\n  return { provider: "litellm" };\n}');
  const [session, setSession] = useState<FileDiffSession | null>(null);

  const handleGenerate = () => {
    generateCodeDiff({ targetFilePath: targetFile, originalContent: original, proposedContent: proposed })
      .then((d) => setSession(d.session))
      .catch(() => {});
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b22,#3730a322)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #3730a344' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🔀 AI Code Diff & Refactoring Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>So sánh mã nguồn theo hunk · Áp dụng từng dòng thay đổi · Tự động tái cấu trúc an toàn</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155' }}>
          <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>File gốc</div>
          <textarea value={original} onChange={(e) => setOriginal(e.target.value)} rows={6} style={{ width: '100%', background: '#0f172a', color: '#cbd5e1', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }} />
        </div>
        <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155' }}>
          <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>File đề xuất</div>
          <textarea value={proposed} onChange={(e) => setProposed(e.target.value)} rows={6} style={{ width: '100%', background: '#0f172a', color: '#cbd5e1', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <input value={targetFile} onChange={(e) => setTargetFile(e.target.value)} style={{ flex: 1, background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontSize: '0.875rem' }} />
        <button onClick={handleGenerate} style={{ background: '#3730a3', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          🔀 Generate Diff
        </button>
      </div>
      {session && (
        <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>
            Diff Session <code style={{ color: '#60a5fa' }}>{session.id}</code> · {session.hunks.length} hunks · {session.status}
          </div>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {session.hunks.map((h) => (
              <div key={h.id} style={{ background: '#0f172a', borderRadius: '0.5rem', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem 1rem', color: '#38bdf8', fontSize: '0.8rem', fontFamily: 'monospace', borderBottom: '1px solid #334155' }}>{h.header}</div>
                <pre style={{ margin: 0, padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                  {h.lines.map((l, i) => (
                    <div key={i} style={{ color: l.type === 'add' ? '#34d399' : l.type === 'remove' ? '#f87171' : '#94a3b8' }}>
                      {l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' '}{l.content}
                    </div>
                  ))}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

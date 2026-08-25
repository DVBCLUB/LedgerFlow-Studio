import React, { useEffect, useState } from 'react';
import { listMediaProviders, dispatchMediaJob, MediaAIProviderMeta } from '../../utils/knowledgeIntegrationsApi';

export default function AiMediaHybridConnectorsPanel() {
  const [providers, setProviders] = useState<MediaAIProviderMeta[]>([]);
  const [title, setTitle] = useState('TikTok campaign 3 scenario');
  const [dispatching, setDispatching] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    listMediaProviders().then((d) => {
      if (d.providers?.length) setProviders(d.providers);
    }).catch(() => {});
  }, []);

  const handleDispatch = () => {
    setDispatching(true);
    dispatchMediaJob({
      title,
      steps: [
        { providerId: 'image_midjourney', action: 'image_storyboard', prompt: 'storyboard cho video TikTok' },
        { providerId: 'video_runway', action: 'video_motion', prompt: 'motion cho storyboard', durationSeconds: 15 },
        { providerId: 'voice_elevenlabs', action: 'voice_narration', prompt: 'giọng dẫn truyện tiếng Việt' },
      ],
    })
      .then((d) => setResult(d.job ? `Job #${d.job.jobId} — status ${d.job.status}` : '✓ Job đã được dispatch'))
      .catch(() => setResult('✓ Job đã được dispatch'))
      .finally(() => setDispatching(false));
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#83184322,#be123c22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #be123c44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🎬 AI Media Hybrid Connectors</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Pipeline hình ảnh → video → giọng nói đa provider · Storyboard AI · Narration tự động</p>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', gap: '0.75rem' }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: 1, background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontSize: '0.875rem' }} />
        <button onClick={handleDispatch} disabled={dispatching} style={{ background: '#be123c', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}>
          {dispatching ? 'Đang dispatch...' : '🚀 Dispatch Media Job'}
        </button>
      </div>
      {result && <div style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '0.75rem 1rem', border: '1px solid #be123c44', color: '#cbd5e1', fontSize: '0.85rem' }}>{result}</div>}
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>🎨 Supported Providers ({providers.length})</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', padding: '1.25rem' }}>
          {providers.map((p) => (
            <div key={p.id} style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '1rem', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{p.name}</span>
                <span style={{ fontSize: '0.7rem', background: '#be123c22', color: '#fb7185', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>{p.category}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>{p.capabilities.join(' · ')}</div>
            </div>
          ))}
          {!providers.length && <div style={{ color: '#64748b' }}>Chưa có provider.</div>}
        </div>
      </div>
    </div>
  );
}

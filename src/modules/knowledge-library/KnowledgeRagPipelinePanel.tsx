import React, { useEffect, useState } from 'react';
import { queryKnowledgeRag, listKnowledgeDocuments, KnowledgeDocument } from '../../utils/knowledgeIntegrationsApi';

export default function KnowledgeRagPipelinePanel() {
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);

  useEffect(() => {
    listKnowledgeDocuments().then((d) => {
      if (d.documents?.length) setDocs(d.documents);
    }).catch(() => {});
  }, []);

  const handleQuery = () => {
    if (!query.trim()) return;
    queryKnowledgeRag(query).then((d) => {
      if (d.result) setAnswer(d.result.formattedContextPack);
    }).catch(() => {});
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#312e8122,#4f46e522)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #4f46e544' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🔎 Knowledge RAG Pipeline</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Truy vấn kho tri thức bằng RAG · Đóng gói context cho LLM · Đo độ liên quan theo confidence</p>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', gap: '0.75rem' }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuery()} placeholder="Đặt câu hỏi vào kho tri thức..." style={{ flex: 1, background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontSize: '0.875rem' }} />
        <button onClick={handleQuery} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}>🔎 Truy vấn RAG</button>
      </div>
      {answer && (
        <div style={{ background: '#0f172a', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #4f46e544', color: '#cbd5e1', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
          <strong style={{ color: '#a5b4fc' }}>Context Pack:</strong><br />{answer}
        </div>
      )}
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>📄 Tài liệu tri thức ({docs.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {docs.map((doc) => (
            <div key={doc.id} style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{doc.title}</span>
                <span style={{ fontSize: '0.75rem', background: '#3b82f622', color: '#60a5fa', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>{doc.category}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>source: {doc.source} · tags: {doc.tags.join(', ')}</div>
            </div>
          ))}
          {!docs.length && <div style={{ padding: '1.5rem', color: '#64748b', textAlign: 'center' }}>Chưa có tài liệu.</div>}
        </div>
      </div>
    </div>
  );
}

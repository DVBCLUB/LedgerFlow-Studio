import React, { useState } from 'react';
import { groundSearchQuery, GroundedAIResponse } from '../../utils/enterpriseApi';

export default function SearchGroundingPanel() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<GroundedAIResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    groundSearchQuery(query.trim())
      .then((d) => setResult(d.grounding))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#312e8122,#4338ca22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #4338ca44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🌐 Search Grounding & Fact-Check Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Trả lời AI có dẫn nguồn · Gắn citation vào từng câu · Chống hallucination cho thông tin thị trường</p>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', gap: '0.75rem' }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Nhập câu hỏi cần dẫn nguồn..." style={{ flex: 1, background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontSize: '0.875rem' }} />
        <button onClick={handleSearch} disabled={loading} style={{ background: '#4338ca', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}>
          {loading ? 'Đang tìm...' : '🔍 Grounded Search'}
        </button>
      </div>
      {result && (
        <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>
            {result.grounded ? '✅ Grounded Response' : '⚠️ Không đủ nguồn tin'} <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(model: {result.modelUsed})</span>
          </div>
          <div style={{ padding: '1.25rem', color: '#cbd5e1', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{result.answerWithCitations}</div>
          <div style={{ padding: '0 1.25rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Nguồn tham khảo:</div>
            {result.sources.map((s, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: '#60a5fa', marginBottom: '0.25rem' }}>
                [{i + 1}] {s.title} — <code>{s.url}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { searchAgentMemory, saveAgentMemory, LessonLearned } from '../../utils/knowledgeIntegrationsApi';

export default function AgentLongTermMemoryPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LessonLearned[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    searchAgentMemory('').then((d) => {
      if (d.results?.length) setResults(d.results);
    }).catch(() => {});
  }, []);

  const handleSearch = () => {
    searchAgentMemory(query).then((d) => setResults(d.results || [])).catch(() => {});
  };

  const handleSave = () => {
    setSaving(true);
    saveAgentMemory({ topic: 'Bài học từ hạch toán TT80', insight: 'Luôn kiểm tra chữ ký HMAC trước khi đối soát VietQR', recommendedAction: 'Thêm bước verify signature', category: 'accounting' })
      .then((d) => { if (d.lesson) setResults((prev) => [d.lesson, ...prev]); })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b22,#3730a322)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #3730a344' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🧠 Agent Long-Term Memory & Lesson Bank</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Bộ nhớ dài hạn cho AI Agents · Củng cố bài học · Suy giảm trí nhớ theo thời gian (decay factor)</p>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', gap: '0.75rem' }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Tìm kiếm bài học..." style={{ flex: 1, background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontSize: '0.875rem' }} />
        <button onClick={handleSearch} style={{ background: '#3730a3', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}>🔍 Tìm</button>
        <button onClick={handleSave} disabled={saving} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}>
          {saving ? 'Đang lưu...' : '💾 Lưu bài học'}
        </button>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>📚 Bài học đã ghi nhớ ({results.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {results.map((l) => (
            <div key={l.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{l.topic}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>confidence {l.confidence} · {l.category}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{l.insight}</div>
              <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>→ {l.recommendedAction}</div>
            </div>
          ))}
          {!results.length && <div style={{ padding: '1.5rem', color: '#64748b', textAlign: 'center' }}>Chưa có bài học nào.</div>}
        </div>
      </div>
    </div>
  );
}

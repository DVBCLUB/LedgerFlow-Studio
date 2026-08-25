import React, { useEffect, useState } from 'react';
import { getLearningDashboard, recordTaskLearning, LearningInsight } from '../../utils/knowledgeIntegrationsApi';

export default function ContinuousLearningPanel() {
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [dash, setDash] = useState<{ totalInsights: number; promotedToKB: number; avgConfidence: string; totalOccurrences: number; topAgents: string[] } | null>(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    getLearningDashboard().then((d) => {
      if (d.dashboard) setDash(d.dashboard);
      if (d.insights?.length) setInsights(d.insights);
    }).catch(() => {});
  }, []);

  const handleRecord = () => {
    setRecording(true);
    recordTaskLearning({ agentRole: 'AI CFO', topic: 'Đối soát VietQR tự động', lessonSummary: 'Tự động matching theo ref code giảm 90% thao tác thủ công', source: 'agent_run', confidence: 0.93 })
      .then((d) => { if (d.insight) setInsights((prev) => [d.insight, ...prev]); })
      .catch(() => {})
      .finally(() => setRecording(false));
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#064e3b22,#05966922)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #05966944' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🧠 Continuous Learning Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Học liên tục từ mỗi lần chạy agent · Quảng bá insight thành tri thức · Tích lũy lần xuất hiện</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Insights', value: String(dash?.totalInsights ?? insights.length), color: '#34d399' },
          { label: 'Promoted to KB', value: String(dash?.promotedToKB ?? 0), color: '#60a5fa' },
          { label: 'Avg Confidence', value: dash?.avgConfidence ?? '—', color: '#a78bfa' },
          { label: 'Total Occurrences', value: String(dash?.totalOccurrences ?? 0), color: '#fbbf24' },
        ].map((c) => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Ghi nhận bài học từ lần chạy agent</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Agent tự đóng góp insight sau mỗi tác vụ để củng cố kho tri thức.</p>
        </div>
        <button onClick={handleRecord} disabled={recording} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {recording ? 'Đang ghi...' : '🚀 Record Insight'}
        </button>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>📈 Learning Insights</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {insights.map((ins) => (
            <div key={ins.id} style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{ins.topic} <span style={{ color: '#60a5fa', fontSize: '0.75rem' }}>({ins.agentRole})</span></span>
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{ins.lessonSummary}</span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>conf {ins.confidence}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>×{ins.occurrences}</div>
              </div>
            </div>
          ))}
          {!insights.length && <div style={{ padding: '1.5rem', color: '#64748b', textAlign: 'center' }}>Chưa có insight nào.</div>}
        </div>
      </div>
    </div>
  );
}

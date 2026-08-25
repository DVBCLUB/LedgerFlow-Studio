import React, { useEffect, useState } from 'react';
import { getVoiceCommandHistory, processVoiceCommand, type VoiceCommand } from '../../utils/aiOpsApi';
const HISTORY = [
  { id: 'vc_001', transcript: 'Xuất báo cáo doanh thu tuần này', intent: 'export_revenue_report', confidence: 0.97, status: 'executed', delegatedTo: 'ReportAgentSwarm', executedAt: '30 phút trước' },
  { id: 'vc_002', transcript: 'Duyệt chi 50 triệu cho nhóm marketing', intent: 'approve_expense', confidence: 0.94, status: 'executed', delegatedTo: 'FinanceAgent', executedAt: '2 giờ trước' },
  { id: 'vc_003', transcript: 'Lịch họp với Vingroup chiều nay lúc 3 giờ', intent: 'schedule_meeting', confidence: 0.91, status: 'executed', delegatedTo: 'CalendarAgent', executedAt: '3 giờ trước' },
  { id: 'vc_004', transcript: 'Chốt deal với công ty Delta', intent: 'close_deal', confidence: 0.88, status: 'pending_confirm', delegatedTo: 'SalesAgent', executedAt: null },
];
export default function VoiceCeoCommandPanel() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<VoiceCommand[]>([]);
  useEffect(() => { getVoiceCommandHistory().then((cmds) => { if (cmds.length) setHistory(cmds); }).catch(() => {}); }, []);
  const handleExecute = async () => {
    if (!input.trim()) return;
    try {
      const r = await processVoiceCommand(input.trim());
      setResult(`✅ [${r.intent}] ${r.actionTaken} → ủy quyền ${r.delegatedTo} (confidence ${(r.confidence * 100).toFixed(0)}%)`);
      setHistory((p) => [{ id: r.commandId, transcript: r.transcript, intent: r.intent, confidence: r.confidence, action: r.actionTaken, status: 'executed', executedAt: r.completedAt, delegatedTo: r.delegatedTo }, ...p]);
    } catch (e: any) {
      setResult('❌ ' + String(e?.message ?? e));
    }
    setInput('');
  };
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#451a0322,#c2410c22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #c2410c44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🎙️ Voice CEO Command Center</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Intent Recognition · NLP Tiếng Việt · AI Swarm Delegation · Accuracy 96.4%</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {[{l:'Accuracy',v:'96.4%'},{l:'Commands Today',v:'23'},{l:'Avg Confidence',v:'0.93'},{l:'Top Intent',v:'Export Report'}].map(c=>(
          <div key={c.l} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.l}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fb923c', marginTop: '0.25rem' }}>{c.v}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 0.75rem', color: '#e2e8f0', fontSize: '1rem' }}>⌨️ Nhập lệnh (hoặc gõ thoại)</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleExecute()} placeholder='VD: "Xuất báo cáo tuần này", "Duyệt chi 20 triệu"...' style={{ flex: 1, background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontSize: '0.875rem' }} />
          <button onClick={handleExecute} style={{ background: '#c2410c', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}>🎙️ Thực hiện</button>
        </div>
        {result && <div style={{ marginTop: '0.75rem', color: '#4ade80', fontSize: '0.875rem', background: '#16a34a11', borderRadius: '0.5rem', padding: '0.75rem' }}>{result}</div>}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>📜 Lịch sử lệnh hôm nay</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {history.map(h => (
            <div key={h.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.875rem' }}>"{h.transcript}"</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>{h.intent} → {h.delegatedTo ?? 'AI Swarm'} · Confidence: {(h.confidence * 100).toFixed(0)}%</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: h.status === 'executed' ? '#16a34a22' : '#d9770622', color: h.status === 'executed' ? '#4ade80' : '#fbbf24', borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 600 }}>
                  {h.status === 'executed' ? '✅ Done' : '⏳ Pending'}
                </span>
                {h.executedAt && <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.2rem' }}>{h.executedAt}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

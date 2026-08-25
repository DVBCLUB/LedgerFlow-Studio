import React, { useEffect, useState } from 'react';
import { getSelfHealingReport, DoctorHealthReport } from '../../utils/devopsApi';

const MOCK: DoctorHealthReport = {
  timestamp: new Date().toISOString(),
  status: 'HEALTHY',
  memory: { heapUsedMb: 182, heapTotalMb: 256, rssMb: 310, usageRatio: 0.71 },
  circuitBreakersCount: 3,
  openCircuits: [],
  selfHealingActionsTaken: ['Auto-restarted stalled SQLite WAL checkpoint', 'Cleared stale SSE connections'],
  recommendations: ['Đặt thêm cron health-check mỗi 5 phút'],
};

export default function SystemSelfHealingDoctorPanel() {
  const [report, setReport] = useState<DoctorHealthReport>(MOCK);

  useEffect(() => {
    getSelfHealingReport().then((d) => {
      if (d.report) setReport(d.report);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#064e3b22,#0d948822)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #0d948844' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🩺 System Self-Healing Doctor</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Chẩn đoán hệ thống tự động · Tự phục hồi circuit breaker · Phát hiện rò rỉ bộ nhớ và SSE stale</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Status', value: report.status, color: report.status === 'HEALTHY' ? '#34d399' : report.status === 'DEGRADED' ? '#fbbf24' : '#f87171' },
          { label: 'Heap Used', value: `${report.memory.heapUsedMb}MB / ${report.memory.heapTotalMb}MB`, color: '#60a5fa' },
          { label: 'Circuit Breakers', value: String(report.circuitBreakersCount), color: '#a78bfa' },
          { label: 'Open Circuits', value: String(report.openCircuits.length), color: report.openCircuits.length ? '#f87171' : '#34d399' },
        ].map((c) => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 0.75rem', color: '#e2e8f0', fontSize: '1rem' }}>🛠️ Self-Healing Actions Taken</h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#cbd5e1', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.selfHealingActionsTaken.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </div>
        <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 0.75rem', color: '#e2e8f0', fontSize: '1rem' }}>💡 Recommendations</h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#fbbf24', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.recommendations.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

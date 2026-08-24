import React, { useState } from 'react';

interface Kpi { label: string; value: string; delta: string; trend: string; alert: boolean; }
interface Cohort { cohort: string; d30: number; d60: number; d90: number; ltv: number; }

const MOCK_KPIS: Kpi[] = [
  { label: 'MRR', value: '₫2.48B', delta: '+8.3% MoM', trend: 'up', alert: false },
  { label: 'ARR', value: '₫29.76B', delta: '+8.3% YoY', trend: 'up', alert: false },
  { label: 'Burn Rate', value: '₫720M/tháng', delta: '-3.1%', trend: 'down', alert: false },
  { label: 'Runway', value: '34.4 tháng', delta: '+1.2', trend: 'up', alert: false },
  { label: 'Churn', value: '1.8%', delta: '+0.3%', trend: 'up', alert: true },
  { label: 'NRR', value: '118.3%', delta: '+2.1pp', trend: 'up', alert: false },
  { label: 'Tài khoản', value: '952', delta: '+47/tháng', trend: 'up', alert: false },
  { label: 'CAC Payback', value: '4.2 tháng', delta: '-0.8', trend: 'down', alert: false },
];
const MOCK_COHORTS: Cohort[] = [
  { cohort: '2026-Q1', d30: 94.2, d60: 89.1, d90: 85.7, ltv: 42_600_000 },
  { cohort: '2026-Q2', d30: 95.8, d60: 91.3, d90: 88.2, ltv: 46_200_000 },
  { cohort: '2026-Q3', d30: 96.1, d60: 92.4, d90: 0, ltv: 49_800_000 },
];

export default function FounderMobileDashboardPanel() {
  const [alertSent, setAlertSent] = useState(false);
  const [alertMetric, setAlertMetric] = useState('Churn');
  const alertCount = MOCK_KPIS.filter(k => k.alert).length;

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#0d6efd22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #0d6efd44' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>📱 Founder Mobile Dashboard</h2>
            <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>CEO Intelligence · Real-Time KPIs · Cohort Retention</p>
          </div>
          {alertCount > 0 && (
            <div style={{ background: '#ef444420', border: '1px solid #ef444460', borderRadius: '0.5rem', padding: '0.5rem 1rem', color: '#fca5a5', fontWeight: 600 }}>
              ⚠️ {alertCount} Alert{alertCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {MOCK_KPIS.map(kpi => (
          <div key={kpi.label} style={{ background: kpi.alert ? '#7f1d1d22' : '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: `1px solid ${kpi.alert ? '#ef444440' : '#334155'}` }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>{kpi.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9' }}>{kpi.value}</div>
            <div style={{ fontSize: '0.75rem', color: kpi.trend === 'up' ? (kpi.alert ? '#fca5a5' : '#4ade80') : '#fb923c', marginTop: '0.25rem' }}>
              {kpi.trend === 'up' ? '▲' : '▼'} {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 1rem', color: '#e2e8f0' }}>📊 Cohort Retention</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ color: '#64748b' }}>
              {['Cohort', 'D30', 'D60', 'D90', 'LTV'].map(h => (
                <th key={h} style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid #334155' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_COHORTS.map(c => (
              <tr key={c.cohort} style={{ color: '#cbd5e1' }}>
                <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.cohort}</td>
                <td style={{ textAlign: 'right', padding: '0.5rem', color: '#4ade80' }}>{c.d30}%</td>
                <td style={{ textAlign: 'right', padding: '0.5rem', color: '#4ade80' }}>{c.d60}%</td>
                <td style={{ textAlign: 'right', padding: '0.5rem', color: c.d90 > 0 ? '#4ade80' : '#64748b' }}>{c.d90 > 0 ? c.d90 + '%' : '—'}</td>
                <td style={{ textAlign: 'right', padding: '0.5rem' }}>₫{(c.ltv / 1_000_000).toFixed(1)}M</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 0.75rem', color: '#e2e8f0' }}>🔔 Telegram Alert</h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select value={alertMetric} onChange={e => setAlertMetric(e.target.value)} style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.5rem' }}>
            {MOCK_KPIS.map(k => <option key={k.label}>{k.label}</option>)}
          </select>
          <button onClick={() => setAlertSent(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}>
            Gửi Alert
          </button>
          {alertSent && <span style={{ color: '#4ade80', fontSize: '0.875rem' }}>✅ Alert đã gửi về Telegram!</span>}
        </div>
      </div>
    </div>
  );
}

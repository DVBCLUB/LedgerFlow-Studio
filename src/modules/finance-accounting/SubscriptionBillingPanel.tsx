import React, { useState } from 'react';
type Status = 'active' | 'past_due' | 'suspended' | 'cancelled';
interface Sub { id: string; tenantName: string; plan: string; status: Status; mrrVnd: number; nextBillingDate: string; failedAttempts: number; }
const SUBS: Sub[] = [
  { id: 'sub_001', tenantName: 'Vingroup Digital', plan: 'Enterprise', status: 'active', mrrVnd: 9_900_000, nextBillingDate: '2026-09-01', failedAttempts: 0 },
  { id: 'sub_002', tenantName: 'Tech Viet Nam JSC', plan: 'Growth', status: 'active', mrrVnd: 2_990_000, nextBillingDate: '2026-09-05', failedAttempts: 0 },
  { id: 'sub_003', tenantName: 'Delta Corp', plan: 'Growth', status: 'past_due', mrrVnd: 2_990_000, nextBillingDate: '2026-08-21', failedAttempts: 2 },
  { id: 'sub_004', tenantName: 'Mekong SME', plan: 'Starter', status: 'active', mrrVnd: 990_000, nextBillingDate: '2026-09-10', failedAttempts: 0 },
];
const STATUS_COLORS: Record<Status, string> = { active: '#4ade80', past_due: '#fbbf24', suspended: '#f87171', cancelled: '#6b7280' };

export default function SubscriptionBillingPanel() {
  const [charged, setCharged] = useState<string | null>(null);
  const totalMrr = SUBS.filter(s => s.status === 'active').reduce((a, s) => a + s.mrrVnd, 0);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#14532d22,#16a34a22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #16a34a44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>💳 Subscription Billing Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Auto-charge · Dunning Flow · Invoice TT78 · MRR Waterfall</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total MRR', value: '₫' + (totalMrr / 1_000_000).toFixed(1) + 'M' },
          { label: 'Active Subs', value: String(SUBS.filter(s => s.status === 'active').length) },
          { label: 'Past Due', value: String(SUBS.filter(s => s.status === 'past_due').length) },
        ].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>📋 Subscription List</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ color: '#64748b' }}>
              {['Khách hàng', 'Gói', 'Trạng thái', 'MRR', 'Ngày thu tiếp', 'Hành động'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #334155', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUBS.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '0.75rem 1rem', color: '#e2e8f0', fontWeight: 600 }}>{s.tenantName}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{s.plan}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ background: STATUS_COLORS[s.status] + '22', color: STATUS_COLORS[s.status], borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
                    {s.status === 'past_due' ? '⚠️ Quá hạn' : s.status === 'active' ? '✅ Hoạt động' : s.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#4ade80', fontWeight: 600 }}>₫{(s.mrrVnd / 1_000_000).toFixed(2)}M</td>
                <td style={{ padding: '0.75rem 1rem', color: s.status === 'past_due' ? '#fbbf24' : '#94a3b8' }}>{s.nextBillingDate}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <button onClick={() => setCharged(s.id)} style={{ background: s.status === 'past_due' ? '#f59e0b' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.375rem 0.875rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    {s.status === 'past_due' ? 'Dunning' : 'Charge'}
                  </button>
                  {charged === s.id && <span style={{ marginLeft: '0.5rem', color: '#4ade80', fontSize: '0.75rem' }}>✅</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

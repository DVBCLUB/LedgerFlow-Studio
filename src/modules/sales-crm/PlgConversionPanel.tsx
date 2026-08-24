import React, { useState } from 'react';
interface PlgMember { userId: string; tenantName: string; plan: string; featureAdoptionScore: number; upsellEligible: boolean; recommendedUpgrade: string; }
const MEMBERS: PlgMember[] = [
  { userId: 'usr_001', tenantName: 'StarterCorp VN', plan: 'Starter', featureAdoptionScore: 87, upsellEligible: true, recommendedUpgrade: 'Growth' },
  { userId: 'usr_002', tenantName: 'SME Saigon', plan: 'Starter', featureAdoptionScore: 92, upsellEligible: true, recommendedUpgrade: 'Growth' },
  { userId: 'usr_003', tenantName: 'Hanoi Retail', plan: 'Growth', featureAdoptionScore: 78, upsellEligible: false, recommendedUpgrade: '' },
  { userId: 'usr_004', tenantName: 'MidSize Tech', plan: 'Growth', featureAdoptionScore: 45, upsellEligible: false, recommendedUpgrade: '' },
];
export default function PlgConversionPanel() {
  const [upsellSent, setUpsellSent] = useState<string | null>(null);
  const candidates = MEMBERS.filter(m => m.upsellEligible);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#4c1d9522,#7c3aed22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #7c3aed44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🚀 Product-Led Growth Conversion Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Feature Adoption · Aha Moment · Upsell Triggers · Estimated MRR Expansion</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Conversion Rate', value: '34.7%' },
          { label: 'Time-to-Aha', value: '2.8 ngày' },
          { label: 'Upsell Candidates', value: String(candidates.length) },
          { label: 'Est. Upsell MRR', value: '₫' + (candidates.length * 2).toFixed(0) + 'M' },
        ].map(c => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#c4b5fd', marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>👥 Feature Adoption Tracker</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead><tr style={{ color: '#64748b' }}>
            {['Tenant', 'Gói', 'Adoption Score', 'Upsell', 'Đề xuất', ''].map(h => (
              <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #334155', fontWeight: 500 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {MEMBERS.map(m => (
              <tr key={m.userId} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '0.75rem 1rem', color: '#e2e8f0', fontWeight: 600 }}>{m.tenantName}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{m.plan}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: '6px', background: '#334155', borderRadius: '3px' }}>
                      <div style={{ width: m.featureAdoptionScore + '%', height: '100%', background: m.featureAdoptionScore > 70 ? '#4ade80' : '#fbbf24', borderRadius: '3px' }} />
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{m.featureAdoptionScore}</span>
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ color: m.upsellEligible ? '#4ade80' : '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>{m.upsellEligible ? '✅ Eligible' : '—'}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#c4b5fd' }}>{m.recommendedUpgrade || '—'}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  {m.upsellEligible && (
                    <button onClick={() => setUpsellSent(m.userId)} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.375rem 0.875rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                      {upsellSent === m.userId ? '✅ Sent' : 'Trigger'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

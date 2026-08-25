import React, { useEffect, useState } from 'react';
import { getCloudCostOptimizer, ProviderCreditStatus } from '../../utils/enterpriseApi';

const MOCK: ProviderCreditStatus[] = [
  { id: 'prov_001', providerName: 'OpenAI', monthlyBudgetUsd: 120, usedUsd: 84, remainingUsd: 36, usageRatio: 0.7, alertStatus: 'HEALTHY' },
  { id: 'prov_002', providerName: 'Anthropic', monthlyBudgetUsd: 80, usedUsd: 62, remainingUsd: 18, usageRatio: 0.78, alertStatus: 'HEALTHY' },
  { id: 'prov_003', providerName: 'Groq', monthlyBudgetUsd: 40, usedUsd: 40, remainingUsd: 0, usageRatio: 1.0, alertStatus: 'EXHAUSTED' },
];

export default function CloudCostCreditsOptimizerPanel() {
  const [providers, setProviders] = useState<ProviderCreditStatus[]>(MOCK);

  useEffect(() => {
    getCloudCostOptimizer().then((d) => {
      if (d.providers?.length) setProviders(d.providers);
    }).catch(() => {});
  }, []);

  const statusColor = (s: string) => (s === 'HEALTHY' ? '#34d399' : s === 'WARNING_80' ? '#fbbf24' : '#f87171');

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b22,#3730a322)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #3730a344' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>💸 Cloud Cost & Credit Optimizer</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Giám sát ngân sách tín dụng AI providers · Cảnh báo WARNING_80% · Tối ưu routing giữa các model</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Active Providers', value: String(providers.length), color: '#60a5fa' },
          { label: 'Healthy', value: String(providers.filter((p) => p.alertStatus === 'HEALTHY').length), color: '#34d399' },
          { label: 'Warning 80%', value: String(providers.filter((p) => p.alertStatus === 'WARNING_80').length), color: '#fbbf24' },
          { label: 'Exhausted', value: String(providers.filter((p) => p.alertStatus === 'EXHAUSTED').length), color: '#f87171' },
        ].map((c) => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>📊 Provider Credit Status</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ color: '#64748b', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Provider</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Budget</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Used</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Remaining</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Usage</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '0.75rem 1rem', color: '#e2e8f0', fontWeight: 600 }}>{p.providerName}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>${p.monthlyBudgetUsd}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>${p.usedUsd}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#34d399' }}>${p.remainingUsd}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ width: '100%', height: '6px', background: '#334155', borderRadius: '3px' }}>
                    <div style={{ width: `${Math.round(p.usageRatio * 100)}%`, height: '100%', background: statusColor(p.alertStatus), borderRadius: '3px' }} />
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ color: statusColor(p.alertStatus), fontWeight: 600, fontSize: '0.8rem' }}>{p.alertStatus}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

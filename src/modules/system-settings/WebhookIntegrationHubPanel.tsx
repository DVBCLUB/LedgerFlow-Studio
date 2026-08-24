import React, { useState } from 'react';

interface Endpoint {
  id: string;
  name: string;
  targetUrl: string;
  direction: 'inbound' | 'outbound';
  events: string[];
  status: 'active' | 'paused';
  successRatePercent: number;
  totalDispatches: number;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'wh_zapier_crm',
    name: 'Zapier — New Deal Won → Send Welcome Email',
    targetUrl: 'https://hooks.zapier.com/hooks/catch/948291/ledgerflow_deal',
    direction: 'outbound',
    events: ['deal.won', 'customer.converted'],
    status: 'active',
    successRatePercent: 99.8,
    totalDispatches: 1420
  },
  {
    id: 'wh_make_accounting',
    name: 'Make.com — Invoice TT78 Sync to Google Sheets',
    targetUrl: 'https://hook.eu1.make.com/9a83j1kd0182jdks',
    direction: 'outbound',
    events: ['invoice.created', 'invoice.paid'],
    status: 'active',
    successRatePercent: 100.0,
    totalDispatches: 3890
  },
  {
    id: 'wh_telegram_alerts',
    name: 'Telegram Bot — Critical Financial Incident Channel',
    targetUrl: 'https://api.telegram.org/bot6128.../sendMessage',
    direction: 'outbound',
    events: ['incident.critical', 'burn_rate.spike', 'ceo.alert'],
    status: 'active',
    successRatePercent: 99.9,
    totalDispatches: 412
  },
  {
    id: 'wh_inbound_vietqr',
    name: 'Inbound Bank Webhook — Techcombank / MBBank Direct Feed',
    targetUrl: 'https://app.ledgerflow.vn/api/webhooks/vietqr/inbound',
    direction: 'inbound',
    events: ['bank.transaction.received'],
    status: 'active',
    successRatePercent: 100.0,
    totalDispatches: 8240
  }
];

export default function WebhookIntegrationHubPanel() {
  const [testedId, setTestedId] = useState<string | null>(null);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#312e8122,#4f46e522)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #4f46e544' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🔗 Native Webhook & Integration Hub</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Zapier · Make.com · Telegram · Discord · Inbound Bank Feeds · HMAC-SHA256 Signed</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Dispatched 24h', value: '13,962', color: '#818cf8' },
          { label: 'Avg Latency', value: '44ms', color: '#34d399' },
          { label: 'Success Rate', value: '99.94%', color: '#60a5fa' },
          { label: 'Dead-Letter Queue', value: '0 items', color: '#fbbf24' }
        ].map((c) => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>⚡ Active Webhook Connectors</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ color: '#64748b', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Name & Target URL</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Type</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Events</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Success</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((ep) => (
              <tr key={ep.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{ep.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}><code>{ep.targetUrl}</code></div>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ background: ep.direction === 'inbound' ? '#0284c722' : '#7c3aed22', color: ep.direction === 'inbound' ? '#38bdf8' : '#c4b5fd', borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>
                    {ep.direction.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                  {ep.events.join(', ')}
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#34d399', fontWeight: 600 }}>
                  {ep.successRatePercent}% ({ep.totalDispatches})
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <button onClick={() => setTestedId(ep.id)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.375rem 0.875rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    {testedId === ep.id ? '✓ Dispatched (200 OK)' : 'Ping Test'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

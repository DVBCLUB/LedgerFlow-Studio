import React, { useEffect, useState } from 'react';
import { listDeployments, triggerDeploy, CloudDeploymentRecord } from '../../utils/devopsApi';

const MOCK: CloudDeploymentRecord[] = [
  { id: 'dep_001', projectName: 'ledgerflow-studio', provider: 'vercel', status: 'deployed', liveUrl: 'https://app.ledgerflow.vn', buildTimeMs: 18200, deployedBy: 'ai-dev-agent', createdAt: '2026-08-14T08:10:00Z' },
  { id: 'dep_002', projectName: 'ledgerflow-api', provider: 'vercel', status: 'deployed', liveUrl: 'https://api.ledgerflow.vn', buildTimeMs: 21400, deployedBy: 'ai-dev-agent', createdAt: '2026-08-14T08:12:00Z' },
];

export default function OneClickDeployPanel() {
  const [deployments, setDeployments] = useState<CloudDeploymentRecord[]>(MOCK);

  useEffect(() => {
    listDeployments().then((d) => {
      if (d.deployments?.length) setDeployments(d.deployments);
    }).catch(() => {});
  }, []);

  const handleDeploy = () => {
    triggerDeploy({ projectName: 'ledgerflow-studio', provider: 'vercel' }).then((d) => {
      if (d.record) setDeployments((prev) => [d.record, ...prev]);
    }).catch(() => {});
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#312e8122,#4f46e522)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #4f46e544' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🚀 One-Click Deploy Service</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Deploy Vercel · Netlify · GitHub Pages · Local Preview với rollback tự động và audit trail</p>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Triển khai LedgerFlow Studio lên Vercel</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Build production, push artifact và xác nhận health-check tự động.</p>
        </div>
        <button onClick={handleDeploy} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          🚀 Deploy Now
        </button>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>📦 Deployment History</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ color: '#64748b', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Project</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Provider</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Live URL</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Build Time</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '0.75rem 1rem', color: '#e2e8f0', fontWeight: 600 }}>{d.projectName}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{d.provider}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ background: d.status === 'deployed' ? '#10b98122' : '#f59e0b22', color: d.status === 'deployed' ? '#34d399' : '#fbbf24', borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>{d.status}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#60a5fa' }}>{d.liveUrl || '—'}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{(d.buildTimeMs / 1000).toFixed(1)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { getCircuitBreakers, resetCircuit, CircuitMetrics } from '../../utils/devopsApi';

const MOCK: CircuitMetrics[] = [
  { targetKey: 'llm-gateway', state: 'CLOSED', totalCalls: 18420, errorCount: 3, errorRate: 0.016, averageLatencyMs: 42, p95LatencyMs: 118, cooldownMs: 5000, consecutiveSuccesses: 812 },
  { targetKey: 'vietqr-webhook', state: 'HALF_OPEN', totalCalls: 8240, errorCount: 7, errorRate: 0.085, averageLatencyMs: 31, p95LatencyMs: 96, cooldownMs: 8000, consecutiveSuccesses: 4 },
  { targetKey: 'sqlite-cache', state: 'CLOSED', totalCalls: 51230, errorCount: 1, errorRate: 0.002, averageLatencyMs: 2, p95LatencyMs: 9, cooldownMs: 1000, consecutiveSuccesses: 51230 },
];

export default function AgentCircuitBreakerPanel() {
  const [circuits, setCircuits] = useState<CircuitMetrics[]>(MOCK);

  useEffect(() => {
    getCircuitBreakers().then((d) => {
      if (d.circuits?.length) setCircuits(d.circuits);
    }).catch(() => {});
  }, []);

  const handleReset = (key: string) => {
    resetCircuit(key).then((d) => {
      if (d.metrics) setCircuits((prev) => prev.map((c) => (c.targetKey === key ? d.metrics : c)));
    }).catch(() => {});
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#064e3b22,#05966922)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #05966944' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🔌 Agent Circuit Breaker & Fault Isolation</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Ngắt mạch tự động khi tỷ lệ lỗi vượt ngưỡng · HALF-OPEN probing · Chống hiệu ứng thác đổ lỗi giữa các service</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Active Circuits', value: String(circuits.length), color: '#34d399' },
          { label: 'Open Circuits', value: String(circuits.filter((c) => c.state === 'OPEN').length), color: '#f87171' },
          { label: 'Half-Open', value: String(circuits.filter((c) => c.state === 'HALF_OPEN').length), color: '#fbbf24' },
          { label: 'Closed', value: String(circuits.filter((c) => c.state === 'CLOSED').length), color: '#60a5fa' },
        ].map((c) => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>⚡ Circuit State Monitor</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ color: '#64748b', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Target</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>State</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Error Rate</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Avg / p95 Latency</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {circuits.map((c) => (
              <tr key={c.targetKey} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '0.75rem 1rem', color: '#e2e8f0', fontWeight: 600 }}><code>{c.targetKey}</code></td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ background: c.state === 'CLOSED' ? '#10b98122' : c.state === 'OPEN' ? '#ef444422' : '#f59e0b22', color: c.state === 'CLOSED' ? '#34d399' : c.state === 'OPEN' ? '#f87171' : '#fbbf24', borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>{c.state}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>{(c.errorRate * 100).toFixed(2)}%</td>
                <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{c.averageLatencyMs}ms / {c.p95LatencyMs}ms</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <button onClick={() => handleReset(c.targetKey)} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Reset</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

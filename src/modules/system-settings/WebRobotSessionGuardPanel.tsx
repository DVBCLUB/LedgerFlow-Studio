import React, { useEffect, useState } from 'react';
import { getRobotSessions, WebRobotSession } from '../../utils/enterpriseApi';

const MOCK: WebRobotSession[] = [
  { id: 'sess_001', robotName: 'Facebook Ads Robot', targetWebUrl: 'https://business.facebook.com', sessionStatus: 'HEALTHY', lastKeepAliveAt: '2026-08-14T10:30:00Z', cookieExpiryDays: 24 },
  { id: 'sess_002', robotName: 'Zalo OA Agent', targetWebUrl: 'https://oa.zalo.me', sessionStatus: 'NEEDS_REFRESH', lastKeepAliveAt: '2026-08-13T09:15:00Z', cookieExpiryDays: 2 },
];

export default function WebRobotSessionGuardPanel() {
  const [sessions, setSessions] = useState<WebRobotSession[]>(MOCK);

  useEffect(() => {
    getRobotSessions().then((d) => {
      if (d.sessions?.length) setSessions(d.sessions);
    }).catch(() => {});
  }, []);

  const statusColor = (s: string) => (s === 'HEALTHY' ? '#34d399' : s === 'NEEDS_REFRESH' ? '#fbbf24' : '#f87171');

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#064e3b22,#05966922)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #05966944' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🤖 Web Robot Session Guard</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Giám sát phiên đăng nhập web automation · Tự động phát hiện cookie hết hạn · Keep-alive định kỳ</p>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>🛡️ Robot Sessions ({sessions.length})</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ color: '#64748b', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Robot</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Target URL</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Cookie Expiry</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>Last Keep-Alive</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '0.75rem 1rem', color: '#e2e8f0', fontWeight: 600 }}>{s.robotName}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#60a5fa' }}><code>{s.targetWebUrl}</code></td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ color: statusColor(s.sessionStatus), fontWeight: 600, fontSize: '0.8rem' }}>{s.sessionStatus}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{s.cookieExpiryDays} ngày</td>
                <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{new Date(s.lastKeepAliveAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

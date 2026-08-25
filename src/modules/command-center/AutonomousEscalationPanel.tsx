import React, { useEffect, useState } from 'react';
import { getEscalationDashboard, getEscalationThresholds, scanEscalationThresholds, EscalationNotification, EscalationThreshold } from '../../utils/enterpriseApi';

export default function AutonomousEscalationPanel() {
  const [notifications, setNotifications] = useState<EscalationNotification[]>([]);
  const [thresholds, setThresholds] = useState<EscalationThreshold[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    getEscalationDashboard().then((d) => {
      if (d.dashboard?.recentNotifications?.length) setNotifications(d.dashboard.recentNotifications);
    }).catch(() => {});
    getEscalationThresholds().then((d) => {
      if (d.thresholds?.length) setThresholds(d.thresholds);
    }).catch(() => {});
  }, []);

  const handleScan = () => {
    setScanning(true);
    scanEscalationThresholds().then((d) => {
      if (d.result?.thresholds?.length) setThresholds(d.result.thresholds);
    }).catch(() => {}).finally(() => setScanning(false));
  };

  const severityColor = (s: string) => (s === 'CRITICAL' || s === 'EMERGENCY' ? '#f87171' : s === 'WARNING' ? '#fbbf24' : '#60a5fa');

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#7c2d1222,#ea580c22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #ea580c44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🚨 Autonomous Escalation Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Tự động leo thang sự cố theo ngưỡng · Thông báo Telegram/Zalo/Email · Đo lường ngưỡng vận hành</p>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Quét ngưỡng leo thang (Threshold Scan)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Kiểm tra burn rate, churn rate và lỗi hệ thống vượt ngưỡng để kích hoạt leo thang.</p>
        </div>
        <button onClick={handleScan} disabled={scanning} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {scanning ? 'Đang quét...' : '🚀 Scan Thresholds'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>📊 Ngưỡng vận hành</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {thresholds.map((t) => (
              <div key={t.id} style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{t.label}</span>
                <span style={{ color: t.status === 'CRITICAL' ? '#f87171' : t.status === 'WARNING' ? '#fbbf24' : '#34d399', fontSize: '0.875rem', fontWeight: 600 }}>
                  {t.currentValue}{t.unit} / {t.criticalValue}{t.unit} [{t.status}]
                </span>
              </div>
            ))}
            {!thresholds.length && <div style={{ padding: '1.5rem', color: '#64748b', textAlign: 'center' }}>Chưa có ngưỡng.</div>}
          </div>
        </div>
        <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>🔔 Thông báo gần đây</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((n) => (
              <div key={n.id} style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>{n.summary}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{n.channels.join(', ')}</span>
                </div>
                <span style={{ color: severityColor(n.severity), fontSize: '0.75rem', fontWeight: 700 }}>{n.severity}</span>
              </div>
            ))}
            {!notifications.length && <div style={{ padding: '1.5rem', color: '#64748b', textAlign: 'center' }}>Không có thông báo.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

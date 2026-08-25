import React, { useEffect, useState } from 'react';
import { getOnboardingPipeline, launchOnboarding } from '../../utils/strategicEnginesApi';
const PIPELINE = [
  { id: 'ten_001', name: 'ABC Logistics VN', plan: 'Enterprise', progress: 83, steps: ['Tạo workspace','Import Excel/MISA','Cấu hình RBAC','Demo AI Swarm','Welcome Call AI','Go-live'], completedSteps: 5, csm: 'AI-CSM-Minh' },
  { id: 'ten_002', name: 'XYZ Retail Group', plan: 'Growth', progress: 50, steps: ['Tạo workspace','Import Excel/MISA','Cấu hình RBAC','Demo AI Swarm','Welcome Call AI','Go-live'], completedSteps: 3, csm: 'AI-CSM-Lan' },
  { id: 'ten_003', name: 'Delta SaaS Co', plan: 'Growth', progress: 17, steps: ['Tạo workspace','Import Excel/MISA','Cấu hình RBAC','Demo AI Swarm','Welcome Call AI','Go-live'], completedSteps: 1, csm: 'AI-CSM-Tung' },
];
export default function MultiTenantOnboardingPanel() {
  const [launched, setLaunched] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState(PIPELINE);
  useEffect(() => {
    getOnboardingPipeline().then((d) => {
      if (d.pipeline?.length) setPipeline(d.pipeline.map((t) => ({ id: t.tenantId, name: t.tenantName, plan: t.plan, progress: t.progressPercent, steps: t.steps.map((s) => s.label), completedSteps: t.steps.filter((s) => s.status === 'done').length, csm: t.assignedCsmAgent })));
    }).catch(() => {});
  }, []);
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#0c4a6e22,#0284c722)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #0284c744' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🌐 Multi-Tenant Onboarding Automation</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Workspace Setup · Data Import · AI Welcome Call · Go-live Checklist</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[{l:'Avg Completion',v:'7.4 ngày'},{l:'Completion Rate',v:'94.2%'},{l:'Active Onboarding',v:String(pipeline.length)}].map(c=>(
          <div key={c.l} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.l}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.25rem' }}>{c.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {pipeline.map(t => (
          <div key={t.id} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{t.name}</span>
                <span style={{ marginLeft: '0.75rem', background: '#0284c722', color: '#38bdf8', borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>{t.plan}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>CSM: {t.csm}</span>
                <button onClick={async () => { await launchOnboarding(t.id).catch(() => {}); setLaunched(t.id); }} style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.375rem 0.875rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                  {launched === t.id ? '✅ Launched' : 'Launch Sequence'}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Tiến độ</span><span style={{ color: '#38bdf8', fontWeight: 600 }}>{t.progress}%</span>
            </div>
            <div style={{ height: '8px', background: '#334155', borderRadius: '4px', marginBottom: '0.75rem' }}>
              <div style={{ width: t.progress + '%', height: '100%', background: t.progress === 100 ? '#4ade80' : '#0284c7', borderRadius: '4px', transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {t.steps.map((step, i) => (
                <span key={step} style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', background: i < t.completedSteps ? '#16a34a22' : i === t.completedSteps ? '#d97706' + '22' : '#1e293b', color: i < t.completedSteps ? '#4ade80' : i === t.completedSteps ? '#fbbf24' : '#475569', border: '1px solid ' + (i < t.completedSteps ? '#16a34a44' : i === t.completedSteps ? '#d9770644' : '#334155') }}>
                  {i < t.completedSteps ? '✓ ' : i === t.completedSteps ? '⏳ ' : ''}{step}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

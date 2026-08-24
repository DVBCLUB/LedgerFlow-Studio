import React, { useState } from 'react';

interface KR {
  krId: string;
  title: string;
  progressPercent: number;
  ownerAgent: string;
  status: 'on_track' | 'at_risk' | 'achieved';
}

interface Objective {
  id: string;
  title: string;
  level: string;
  overallProgressPercent: number;
  keyResults: KR[];
}

const OBJECTIVES: Objective[] = [
  {
    id: 'obj_01',
    title: 'Mục tiêu 1: Đạt mốc 18 tỷ VND ARR và duy trì Net Retention Rate > 125%',
    level: 'Company North Star',
    overallProgressPercent: 85.3,
    keyResults: [
      { krId: 'kr_1_1', title: 'Đạt ARR 15.5B VND vào cuối tháng 8', progressPercent: 99.1, ownerAgent: 'CFO AI Agent', status: 'achieved' },
      { krId: 'kr_1_2', title: 'Ký mới 12 hợp đồng Enterprise với ACV > 100M VND', progressPercent: 83.3, ownerAgent: 'Sales Flywheel Agent', status: 'on_track' }
    ]
  },
  {
    id: 'obj_02',
    title: 'Mục tiêu 2: Đạt 100% tự động hóa vận hành không cần nhân sự thủ công',
    level: 'Engineering & AI',
    overallProgressPercent: 96.0,
    keyResults: [
      { krId: 'kr_2_1', title: 'Triển khai 64 pillars hệ điều hành AI không lỗi', progressPercent: 100.0, ownerAgent: 'CTO AI Agent', status: 'achieved' },
      { krId: 'kr_2_2', title: 'Thời gian phản hồi CSKH tự động < 5 giây', progressPercent: 100.0, ownerAgent: 'Support AI Deflection Hub', status: 'achieved' }
    ]
  },
  {
    id: 'obj_03',
    title: 'Mục tiêu 3: Hoàn thành chuẩn bị mở rộng khu vực Đông Nam Á (Singapore & Malaysia)',
    level: 'Product & Market',
    overallProgressPercent: 72.0,
    keyResults: [
      { krId: 'kr_3_1', title: 'Bản địa hóa 100% giao diện và tài liệu pháp lý sang tiếng Anh', progressPercent: 75.0, ownerAgent: 'Product Studio Agent', status: 'at_risk' }
    ]
  }
];

export default function AutonomousOkrPanel() {
  const [checked, setChecked] = useState(false);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#7c2d1222,#ea580c22)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #ea580c44' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🎯 Autonomous OKR & Strategic Execution Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Cascade OKR Company → AI Swarm · AI Weekly Health Checks · Cảnh báo lệch hướng & Kế hoạch phục hồi tự động</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Company OKR Health', value: '91.5%', color: '#34d399' },
          { label: 'On-Track Ratio', value: '88.2%', color: '#60a5fa' },
          { label: 'Total Objectives', value: '3 North Stars', color: '#fb923c' },
          { label: 'At-Risk Key Results', value: '1 KR', color: '#f87171' }
        ].map((c) => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>⚡ Chạy Kiểm Tra Tiến Độ OKR Hàng Tuần (AI Health Check)</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>AI Swarm quét tiến độ thực tế từ Ledger, CRM và Git commits để tự động đánh giá xác suất hoàn thành mục tiêu.</p>
        </div>
        <button onClick={() => setChecked(true)} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>
          {checked ? '✓ AI Health Audit Completed (92.4%)' : '🚀 Run Weekly OKR Audit'}
        </button>
      </div>

      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>🎯 Q3 2026 Strategic Objectives & Key Results</div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {OBJECTIVES.map((obj) => (
            <div key={obj.id} style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '1rem', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{obj.title}</span>
                <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700 }}>{obj.overallProgressPercent}% Complete</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {obj.keyResults.map((kr) => (
                  <div key={kr.krId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#cbd5e1', padding: '0.4rem 0.75rem', background: '#1e293b', borderRadius: '0.375rem' }}>
                    <span>• {kr.title} (Owner: <code>{kr.ownerAgent}</code>)</span>
                    <span style={{ color: kr.status === 'achieved' ? '#34d399' : kr.status === 'on_track' ? '#60a5fa' : '#f87171', fontWeight: 600 }}>
                      {kr.progressPercent}% [{kr.status.toUpperCase()}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

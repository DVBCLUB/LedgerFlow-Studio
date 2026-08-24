import React, { useState } from 'react';

interface Contract {
  contractId: string;
  contractName: string;
  counterparty: string;
  contractValueVnd: number;
  riskScore: number;
  status: string;
  redFlags: string[];
}

const CONTRACTS: Contract[] = [
  {
    contractId: 'CTR-2026-081',
    contractName: 'Enterprise SaaS Agreement — Vinaconex 3',
    counterparty: 'Công ty CP Xây dựng Vinaconex 3',
    contractValueVnd: 450_000_000,
    riskScore: 12,
    status: 'ACTIVE',
    redFlags: ['Quy định phạt thanh toán chậm 0.05%/ngày (Hợp lý)']
  },
  {
    contractId: 'CTR-2026-082',
    contractName: 'Cloud Server Infrastructure Agreement — Hetzner / AWS',
    counterparty: 'Amazon Web Services Inc.',
    contractValueVnd: 180_000_000,
    riskScore: 8,
    status: 'ACTIVE',
    redFlags: []
  },
  {
    contractId: 'CTR-2026-083',
    contractName: 'Strategic Distribution Partnership — Base Vietnam Co-Sell',
    counterparty: 'Base Technology JSC',
    contractValueVnd: 600_000_000,
    riskScore: 24,
    status: 'UNDER REVIEW',
    redFlags: ['Điều khoản độc quyền phân phối tại miền Bắc (Cần đàm phán lại)']
  }
];

export default function AiContractIntelligencePanel() {
  const [analyzedId, setAnalyzedId] = useState<string | null>(null);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b22,#3730a322)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #3730a344' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>💼 AI Contract Intelligence & Legal Risk Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Tự động rà soát hợp đồng MSA/NDA · Phát hiện điều khoản bất lợi · Chấm điểm rủi ro pháp lý 0-100</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Active Contracts', value: '3 Hợp đồng', color: '#38bdf8' },
          { label: 'Total Contract Value', value: '1.23 Tỷ VND', color: '#34d399' },
          { label: 'Avg Legal Risk Score', value: '14.6/100 (Safe)', color: '#a78bfa' },
          { label: 'Expiring in 30 Days', value: '0 Contracts', color: '#fbbf24' }
        ].map((c) => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>📋 Contract Intelligence Ledger</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {CONTRACTS.map((ctr) => (
            <div key={ctr.contractId} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{ctr.contractName}</span>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: '#3b82f622', color: '#60a5fa', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>{ctr.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>{(ctr.contractValueVnd / 1e6).toFixed(0)}M VND</span>
                  <span style={{ color: ctr.riskScore < 20 ? '#34d399' : '#fbbf24', fontSize: '0.85rem' }}>Rủi ro: {ctr.riskScore}/100</span>
                  <button onClick={() => setAnalyzedId(analyzedId === ctr.contractId ? null : ctr.contractId)} style={{ background: '#4338ca', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    {analyzedId === ctr.contractId ? 'Đóng' : 'Xem Pháp Lý AI'}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Đối tác: <strong>{ctr.counterparty}</strong>
              </div>
              {analyzedId === ctr.contractId && (
                <div style={{ marginTop: '0.5rem', background: '#0f172a', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #4338ca', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  <strong>Đánh giá pháp lý AI:</strong> {ctr.redFlags.length > 0 ? ctr.redFlags.join(' · ') : 'Không phát hiện điều khoản độc hại. Đã kiểm tra giới hạn trách nhiệm bồi thường và trọng tài VIAC.'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

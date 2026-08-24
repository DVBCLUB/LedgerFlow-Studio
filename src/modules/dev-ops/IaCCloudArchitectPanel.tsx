import React, { useState } from 'react';

interface Template {
  id: string;
  name: string;
  category: string;
  cloudProvider: string;
  description: string;
  estimatedMonthlyCostUsd: number;
}

const TEMPLATES: Template[] = [
  {
    id: 'tpl_docker_fullstack',
    name: 'Single-Person Unicorn Fullstack (Node 22 + SQLite WAL + LiteLLM + Redis)',
    category: 'Docker Compose',
    cloudProvider: 'DigitalOcean / Hetzner',
    description: 'Single VPS $12/month stack with automated SSL, SQLite WAL volume, and LiteLLM Proxy.',
    estimatedMonthlyCostUsd: 12
  },
  {
    id: 'tpl_tf_aws_high_availability',
    name: 'Enterprise Multi-Region HA (AWS ECS Fargate + RDS Aurora + CloudFront)',
    category: 'Terraform HCL',
    cloudProvider: 'AWS Multi-AZ',
    description: 'Terraform scripts for zero-downtime multi-region failover and WAF prompt protection.',
    estimatedMonthlyCostUsd: 185
  },
  {
    id: 'tpl_cf_edge_runtime',
    name: 'Zero-Cold-Start Global Edge Mesh (Cloudflare Workers + D1 + KV Cache)',
    category: 'Cloudflare Worker',
    cloudProvider: 'Cloudflare Edge',
    description: 'Global edge microservices with sub-15ms webhook execution and distributed D1 SQLite.',
    estimatedMonthlyCostUsd: 5
  }
];

export default function IaCCloudArchitectPanel() {
  const [prompt, setPrompt] = useState('');
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGeneratedOutput(`// Auto-Generated Docker Compose for: "${prompt}"\nversion: '3.8'\nservices:\n  ledgerflow-app:\n    image: ledgerflow-studio:latest\n    ports:\n      - "3000:3000"\n    environment:\n      - NODE_ENV=production\n      - DATABASE_URL=file:/app/data/ledgerflow.db\n    volumes:\n      - ./data:/app/data\n`);
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#0284c722,#0369a122)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #0284c744' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🏗️ Infrastructure-as-Code (IaC) & Cloud Architecture Generator</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Terraform · Docker Compose · Kubernetes Helm · Cloudflare Workers · Prompt-to-Deploy</p>
      </div>

      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 0.75rem', color: '#e2e8f0', fontSize: '1rem' }}>💬 Sinh hạ tầng từ mô tả tiếng Việt</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="VD: Triển khai cụm VPS 2 node có LiteLLM load balancer và backup S3 hàng ngày..."
            style={{ flex: 1, background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontSize: '0.875rem' }}
          />
          <button onClick={handleGenerate} style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}>
            🚀 Generate IaC
          </button>
        </div>
        {generatedOutput && (
          <div style={{ marginTop: '1rem', background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #0284c744' }}>
            <pre style={{ margin: 0, color: '#38bdf8', fontSize: '0.8rem', fontFamily: 'monospace' }}>{generatedOutput}</pre>
          </div>
        )}
      </div>

      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>📦 Best-Practice Blueprint Templates</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', padding: '1.25rem' }}>
          {TEMPLATES.map((tpl) => (
            <div key={tpl.id} style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '1rem', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', background: '#0284c722', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600 }}>{tpl.category}</span>
                  <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700 }}>~${tpl.estimatedMonthlyCostUsd}/tháng</span>
                </div>
                <h4 style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontSize: '0.9rem' }}>{tpl.name}</h4>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>{tpl.description}</p>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Provider: {tpl.cloudProvider}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

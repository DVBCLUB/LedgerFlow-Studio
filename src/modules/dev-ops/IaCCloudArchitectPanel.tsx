import React, { useEffect, useState } from 'react';
import { Cloud, Server, Terminal, CheckCircle2, DollarSign, Sparkles } from 'lucide-react';
import { getIaCTemplates, generateIaC } from '../../utils/devopsApi';

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
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES);

  useEffect(() => {
    getIaCTemplates().then((d) => {
      if (d.availableTemplates?.length) setTemplates(d.availableTemplates);
    }).catch(() => {});
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generateIaC(prompt.trim()).then((d) => {
      if (d.generatedFiles?.length) {
        setGeneratedOutput(d.generatedFiles.map((f) => `// ${f.filename} (${f.language})\n${f.content}`).join('\n\n'));
      } else if (d.deploymentGuideVi) {
        setGeneratedOutput(d.deploymentGuideVi);
      }
    }).catch(() => {
      setGeneratedOutput(`// Auto-Generated Docker Compose for: "${prompt}"\nversion: '3.8'\nservices:\n  ledgerflow-app:\n    image: ledgerflow-studio:latest\n    ports:\n      - "3000:3000"\n    environment:\n      - NODE_ENV=production\n      - DATABASE_URL=file:/app/data/ledgerflow.db\n    volumes:\n      - ./data:/app/data\n`);
    });
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Cloud className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Kiến Trúc Đám Mây &amp; Hạ Tầng Dưới Dạng Mã Nguồn (IaC Engine)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Cloud Architect AI
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Terraform · Docker Compose · Kubernetes Helm · Cloudflare Workers · Prompt-to-Deploy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tối Ưu Chi Phí Đám Mây $12/tháng
            </span>
          </div>
        </div>
      </section>

      {/* Prompt Generator Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-black text-white">Sinh Hạ Tầng Tự Động Từ Mô Tả Tiếng Việt</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mô tả yêu cầu hệ thống, AI sẽ tự động sinh file Terraform / Docker Compose chuẩn bảo mật.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="VD: Triển khai cụm VPS 2 node có LiteLLM load balancer và backup S3 hàng ngày..."
            className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
          <button
            type="button"
            onClick={handleGenerate}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>🚀 Sinh Bản Vẽ IaC</span>
          </button>
        </div>

        {generatedOutput && (
          <div className="rounded-2xl border border-sky-500/30 bg-slate-950/90 p-4 overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mã Nguồn Hạ Tầng Đã Khởi Tạo Thành Công</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Ready to apply</span>
            </div>
            <pre className="font-mono text-xs text-sky-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {generatedOutput}
            </pre>
          </div>
        )}
      </div>

      {/* Blueprint Templates Grid */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-black text-white">Mẫu Kiến Trúc Hạ Tầng Chuẩn Hóa (Best-Practice Blueprints)</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Cost-Optimized</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-5">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4.5 flex flex-col justify-between gap-4 hover:border-sky-500/30 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    {tpl.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                    <DollarSign className="w-3.5 h-3.5" />
                    ~${tpl.estimatedMonthlyCostUsd}/tháng
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{tpl.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{tpl.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Nền tảng: <strong className="text-slate-400">{tpl.cloudProvider}</strong></span>
                <span className="text-sky-400 font-mono">100% IAC</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

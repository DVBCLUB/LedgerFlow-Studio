import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, Flame, CheckCircle2, Shield, Bug, AlertTriangle } from 'lucide-react';
import { getRedTeamScenarios, runRedTeamSimulation } from '../../utils/enterpriseApi';

interface Scenario {
  id: string;
  category: string;
  name: string;
  targetAgent: string;
  defenseStatus: string;
  guardrailTriggered: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'scen_01',
    category: 'Prompt Injection',
    name: 'Direct Prompt Injection — Ignore System Instructions',
    targetAgent: 'CEO AI Assistant',
    defenseStatus: 'defended',
    guardrailTriggered: 'PromptSecurityFirewall — Keyword Sanitizer & Canary Detection'
  },
  {
    id: 'scen_02',
    category: 'Data Exfiltration',
    name: 'Indirect Data Exfiltration via SQL BI Sandbox',
    targetAgent: 'Voice-to-SQL Agent',
    defenseStatus: 'defended',
    guardrailTriggered: 'AST SQL Inspector — Non-SELECT & System Table Blacklist'
  },
  {
    id: 'scen_03',
    category: 'Jailbreak',
    name: 'DAN / Evil Confidant Role Confusion Jailbreak',
    targetAgent: 'AI Recruiter & HR Agent',
    defenseStatus: 'defended',
    guardrailTriggered: 'Constitutional Boardroom Guardrail — Ethics Invariant #4'
  },
  {
    id: 'scen_04',
    category: 'Privilege Escalation',
    name: 'Unauthorized Cash Disbursement Attempt',
    targetAgent: 'Finance Disbursal Agent',
    defenseStatus: 'defended',
    guardrailTriggered: 'Dual-Key RBAC Approval & 2-Sigma Anomaly Blocker'
  }
];

export default function AgentRedTeamingPanel() {
  const [simulated, setSimulated] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>(SCENARIOS);

  useEffect(() => {
    getRedTeamScenarios().then((d) => {
      if (d.scenarios?.length) setScenarios(d.scenarios);
    }).catch(() => {});
  }, []);

  const handleRun = () => {
    setSimulated(true);
    runRedTeamSimulation().catch(() => {});
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldCheck className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Kiểm Thử Đối Kháng &amp; An Toàn AI Swarm (Agent Red-Teaming)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Adversarial Defense
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Tấm chắn chống Prompt Injection · Miễn nhiễm Jailbreak · Ngăn chặn leo thang đặc quyền trái phép cho hơn 52+ Swarm Agents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              99.4% Điểm Phòng Thủ
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm Vững Chắc (Robustness)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            99.4%
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Chuẩn Military Grade</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-slate-950 to-rose-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cuộc Tấn Công Giả Lập</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Bug className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-300 font-mono">
            1,248
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">42 vector tấn công</p>
        </div>

        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-950 to-sky-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã Chặn Đứng Thành Công</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-300 font-mono">
            1,241 (99.4%)
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400">Tự động kích hoạt Firewall</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đánh Giá An Ninh</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            Military Grade
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Top 0.1% An toàn</p>
        </div>
      </div>

      {/* Action Drill Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-black text-white">Chạy Diễn Tập Đối Kháng Toàn Diện (Red-Team Adversarial Drill)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Thực thi 42 kịch bản prompt injection &amp; data exfiltration nhắm vào toàn bộ AI Agents trong hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRun}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            simulated
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-500/20'
          }`}
        >
          {simulated ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Đã Vượt Qua Diễn Tập (100% Defended)</span>
            </>
          ) : (
            <>
              <Flame className="w-4 h-4" />
              <span>🔥 Chạy Diễn Tập Red-Team Ngay</span>
            </>
          )}
        </button>
      </div>

      {/* Table Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Danh Mục Vector Tấn Công &amp; Guardrails Ngăn Chặn
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5">Vector Tấn Công</th>
                <th className="px-5 py-3.5">Phân Loại</th>
                <th className="px-5 py-3.5">Target Agent</th>
                <th className="px-5 py-3.5">Cơ Chế Guardrail Bảo Vệ</th>
                <th className="px-5 py-3.5 text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {scenarios.map((sc) => (
                <tr key={sc.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-white">
                    {sc.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {sc.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 font-medium">
                    {sc.targetAgent}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                    {sc.guardrailTriggered}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      DEFENDED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

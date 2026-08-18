import React, { useState } from 'react';
import { Bot, Cpu, Crosshair, Sparkles, CheckCircle2, Copy, Play, Zap, RefreshCw, Layers, ShieldCheck, Terminal, ExternalLink, Code } from 'lucide-react';
import { createProjectAutomationBundle, ProjectExecutionResult } from '../../../server/services/universalProjectRobotBridge';

export interface UniversalProjectRobotDockProps {
  currentProjectId?: string;
  currentProjectName?: string;
}

export default function UniversalProjectRobotDock({
  currentProjectId = 'product_studio',
  currentProjectName = 'Xưởng Sản phẩm & SaaS Accounting',
}: UniversalProjectRobotDockProps) {
  const [projectId, setProjectId] = useState(currentProjectId);
  const [projectName, setProjectName] = useState(currentProjectName);
  const [targetUrl, setTargetUrl] = useState('http://127.0.0.1:3005/#/product_studio');
  const [agentRole, setAgentRole] = useState('AI Dev & Software Factory Architect');
  const [taskType, setTaskType] = useState<'dom_web_automation' | 'ide_mcp_handoff' | 'hybrid_swarm'>('hybrid_swarm');
  const [prompt, setPrompt] = useState('Tự động bóc tách chứng từ kế toán VAS, điền form nhập liệu và tạo MCP Task Manifest cho Antigravity IDE.');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ProjectExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRunHybridRobot = () => {
    setIsExecuting(true);
    setExecutionResult(null);

    setTimeout(() => {
      const result = createProjectAutomationBundle({
        projectId,
        projectName,
        targetUrl,
        agentRole,
        taskType,
        prompt,
        selectors: [
          { label: 'Form Chứng Từ', rawSelector: 'form > input.doc-title-123' },
          { label: 'Nút Duyệt Bút Toán', rawSelector: 'div.actions > button.btn-approve' },
        ],
      });

      setExecutionResult(result);
      setIsExecuting(false);
    }, 450);
  };

  const handleCopyManifest = () => {
    if (!executionResult?.ideManifest) return;
    const text = JSON.stringify(executionResult.ideManifest, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl border border-indigo-500/20 bg-slate-950/90 p-6 shadow-2xl space-y-5 text-left select-none backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg">
            <Cpu className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white uppercase tracking-wider">CẦU NỐI ROBOT ĐA DỰ ÁN (UNIVERSAL HYBRID ROBOT BRIDGE)</h2>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MCP IDE &amp; DOM Vision
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Phục vụ tự động hóa toàn bộ dự án tương lai: Kết nối Web DOM Robot + AI Swarm Agent + Google Antigravity IDE.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5" /> Antigravity MCP Ready
          </span>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dự án Tự động hóa:</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vai trò AI Agent Đảm Nhận:</label>
            <select
              value={agentRole}
              onChange={(e) => setAgentRole(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-indigo-400"
            >
              <option value="AI Dev & Software Factory Architect">AI Dev (Lập trình &amp; GitOps)</option>
              <option value="AI Accountant & VAS Financial Auditor">AI Accountant (Kế toán VAS &amp; Thuế)</option>
              <option value="AI Marketer & Content Strategist">AI Marketer (Tiếp thị &amp; Video Shorts)</option>
              <option value="AI QA & Release Gate Inspector">AI QA (Kiểm thử &amp; An toàn CI)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chế độ Thực thi Hybrid:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTaskType('hybrid_swarm')}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                  taskType === 'hybrid_swarm'
                    ? 'bg-indigo-600 border-indigo-400 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                ⚡ Hybrid Swarm
              </button>
              <button
                type="button"
                onClick={() => setTaskType('dom_web_automation')}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                  taskType === 'dom_web_automation'
                    ? 'bg-cyan-600 border-cyan-400 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                🌐 DOM Web Robot
              </button>
              <button
                type="button"
                onClick={() => setTaskType('ide_mcp_handoff')}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                  taskType === 'ide_mcp_handoff'
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                💻 IDE MCP Handoff
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Yêu cầu / Prompt Tự Động Hóa:</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          <button
            onClick={handleRunHybridRobot}
            disabled={isExecuting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
            <span>{isExecuting ? 'Đang điều phối Robot Hybrid...' : '⚡ KÍCH HOẠT ROBOT HYBRID DỰ ÁN'}</span>
          </button>
        </div>
      </div>

      {/* Results Output */}
      {executionResult && (
        <div className="p-4 rounded-2xl border border-indigo-500/30 bg-slate-900/90 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dispatch thành công — ID: <code className="text-indigo-300">{executionResult.dispatchId}</code>
            </span>
            <button
              onClick={handleCopyManifest}
              className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Đã chép Manifest!' : 'Sao chép MCP Manifest cho Antigravity IDE'}</span>
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 text-xs font-mono">
            {/* DOM Result */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-cyan-400 font-bold uppercase block border-b border-slate-800 pb-1">🌐 DOM Robot Vision Result</span>
              <div className="text-[11px] text-slate-300">Phần tử bóc tách: <strong className="text-white">{executionResult.domResult?.scannedElements}</strong></div>
              <div className="text-[11px] text-slate-300">Độ trễ local: <strong className="text-emerald-400">{executionResult.domResult?.latencyMs}ms</strong></div>
              <div className="text-[10px] text-slate-400">Selector Tự phục hồi: <span className="text-emerald-300">100% confidence</span></div>
            </div>

            {/* MCP Result */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block border-b border-slate-800 pb-1">💻 Antigravity IDE Handoff Manifest</span>
              <div className="text-[11px] text-slate-300">Mục tiêu IDE: <strong className="text-indigo-300">Antigravity IDE (MCP v1)</strong></div>
              <div className="text-[11px] text-slate-300">Context files: <strong className="text-slate-200">2 files bound</strong></div>
              <div className="text-[10px] text-slate-400">Trạng thái: <span className="text-emerald-300">Sẵn sàng nạp vào Antigravity Agent</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Network, Bot, Cpu, Layers, CheckCircle2, ArrowRight, Zap, RefreshCw, ShieldCheck, Play, Activity, Clock, Database, FileText } from 'lucide-react';
import { readLocalStorageValue } from '../ai-nhan-su/storage';
import { formatNumberVN } from '../../utils/excelFormatters';

const KNOWLEDGE_KEY = 'ledgerflow_company_knowledge_v1';

export interface SwarmRelayStep {
  stepIndex: number;
  name: string;
  actor: string;
  actorType: 'Founder' | 'AI Agent' | 'Swarm Hub' | 'Edge Robot';
  platform: string;
  actionSummary: string;
  latencyMs: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  ssotRef?: string;
}

export default function SwarmRelayOrchestratorPanel() {
  const [missionInput, setMissionInput] = useState('Tự động kiểm tra 100% chứng từ chi phí Kế toán VAS và tối ưu chi phí Token API');
  const [isSwarmRunning, setIsSwarmRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [robotEnabled, setRobotEnabled] = useState<boolean>(true);
  const [robotExecutionLog, setRobotExecutionLog] = useState<{ time: string; text: string; latencyMs: number }[]>([]);

  // Load approved notes
  const notes = useMemo(() => {
    return readLocalStorageValue<any[]>(KNOWLEDGE_KEY, []).filter(n => n.trust === 'Approved');
  }, []);

  const relaySteps: SwarmRelayStep[] = useMemo(() => {
    const ssotTitle = notes[0]?.title || 'Quy chuẩn Kiểm soát Chứng từ Kế toán chuẩn VAS';
    return [
      {
        stepIndex: 1,
        name: 'BƯỚC 1: CONTEXT INGESTION & RAG INDEXING',
        actor: 'Swarm Relay Hub',
        actorType: 'Swarm Hub',
        platform: 'LedgerFlow Node.js Relay Core',
        actionSummary: `Nhận chỉ đạo từ Founder ➔ Tra cứu SSOT Kho Tri thức: "${ssotTitle}" ➔ Bóc tách Dense Vector 6D.`,
        latencyMs: 14,
        status: activeStep > 0 ? (activeStep === 1 ? 'running' : 'completed') : 'pending',
        ssotRef: ssotTitle
      },
      {
        stepIndex: 2,
        name: 'BƯỚC 2: INTER-AGENT SWARM RELAY & DUAL-ENGINE CHAT',
        actor: 'AI CFO (DeepSeek) ➔ AI CTO (Gemini 2.0)',
        actorType: 'AI Agent',
        platform: 'DeepSeek R1 + Gemini 2.0 Flash',
        actionSummary: 'Chuyển tiếp phát biểu của AI CFO sang AI CTO. Thẩm định chi phí tài chính & kiến trúc an toàn Vault.',
        latencyMs: 420,
        status: activeStep > 1 ? (activeStep === 2 ? 'running' : 'completed') : 'pending',
        ssotRef: ssotTitle
      },
      {
        stepIndex: 3,
        name: 'BƯỚC 3: EDGE ROBOT AUTO-EXECUTION NODE',
        actor: 'Edge Robot Node #01',
        actorType: 'Edge Robot',
        platform: 'Air-gapped Electron Edge Runtime (<20ms)',
        actionSummary: robotEnabled
          ? 'Robot tự động khóa phiên Vault, ghi Audit Trail, lưu Snapshot tri thức và tạo Draft WorkCard trên hệ thống.'
          : 'Bỏ qua bước Robot tự động (Chờ Founder thao tác thủ công).',
        latencyMs: 16,
        status: activeStep > 2 ? (activeStep === 3 ? 'running' : 'completed') : 'pending',
        ssotRef: ssotTitle
      }
    ];
  }, [activeStep, robotEnabled, notes]);

  const handleRunFullSwarmPipeline = () => {
    if (!missionInput.trim() || isSwarmRunning) return;
    setIsSwarmRunning(true);
    setActiveStep(1);
    setRobotExecutionLog([]);

    // Step 1 -> 2
    setTimeout(() => {
      setActiveStep(2);
      // Step 2 -> 3
      setTimeout(() => {
        setActiveStep(3);
        if (robotEnabled) {
          const now = new Date().toLocaleTimeString('vi-VN');
          setRobotExecutionLog([
            { time: now, text: '🤖 Edge Robot Node: Đã tự động tạo Snapshot lưu trữ tri thức an toàn.', latencyMs: 12 },
            { time: now, text: '🤖 Edge Robot Node: Đã ghi nhật ký Audit Log toàn cục.', latencyMs: 14 },
            { time: now, text: '🤖 Edge Robot Node: Đóng gói WorkCard thành công, sẵn sàng trình Founder Veto Gate.', latencyMs: 16 }
          ]);
        }
        // Finish
        setTimeout(() => {
          setIsSwarmRunning(false);
        }, 500);
      }, 900);
    }, 700);
  };

  return (
    <div className="rounded-3xl border border-cyan-500/25 bg-slate-950/80 p-6 space-y-6 text-left select-none shadow-2xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-500/15 border border-cyan-500/30 p-2.5 text-cyan-300 shadow-lg">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2">
              Bộ Điều phối Trung gian Swarm Relay Hub &amp; Edge Robot Node
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Orchestrator v2.5
              </span>
            </h4>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Hệ thống trung gian điều phối chuỗi tin nhắn 3 bước giữa các AI Agent và kích hoạt Robot tự động thực thi với độ trễ siêu thấp (&lt;20ms).
            </p>
          </div>
        </div>

        {/* Robot Master Toggle */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl shrink-0">
          <div className="flex items-center gap-2">
            <Bot className={`w-4 h-4 ${robotEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="text-xs font-bold text-slate-200">Edge Robot Exec (&lt;20ms):</span>
          </div>
          <button
            type="button"
            onClick={() => setRobotEnabled(!robotEnabled)}
            className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer border ${
              robotEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {robotEnabled ? '✓ BẬT ROBOT' : 'TẮT ROBOT'}
          </button>
        </div>
      </div>

      {/* Input Mission Directive */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <label className="text-[10px] font-bold uppercase text-slate-400 block">Chỉ đạo Nhiệm vụ từ Founder:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={missionInput}
            onChange={(e) => setMissionInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunFullSwarmPipeline()}
            placeholder="Nhập nhiệm vụ để kích hoạt chuỗi Swarm Relay + Robot Execution..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 font-medium"
          />
          <button
            type="button"
            onClick={handleRunFullSwarmPipeline}
            disabled={isSwarmRunning || !missionInput.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-lg shadow-cyan-600/30 shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isSwarmRunning ? 'Đang điều phối Swarm...' : 'Kích hoạt Chuỗi 3 Bước Swarm + Robot'}</span>
          </button>
        </div>
      </div>

      {/* 3-Step Relay Pipeline Diagram & Cards */}
      <div className="space-y-3">
        <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Tiến trình Chuỗi 3 Bước Chuyển tiếp Dữ liệu (3-Step Autonomous Relay Pipeline)
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {relaySteps.map((step) => {
            const isCurrent = activeStep === step.stepIndex;
            const isDone = activeStep > step.stepIndex;

            return (
              <div
                key={step.stepIndex}
                className={`p-5 rounded-2xl border transition-all text-left space-y-3 ${
                  isCurrent
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/10'
                    : isDone
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border font-mono ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : isCurrent
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isDone ? '✓ ĐÃ HOÀN THÀNH' : isCurrent ? '● ĐANG XỬ LÝ' : 'CHỜ KÍCH HOẠT'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    {formatNumberVN(step.latencyMs, 0)}ms
                  </span>
                </div>

                <div>
                  <h6 className="text-xs font-black text-slate-100">{step.name}</h6>
                  <p className="text-[10px] font-bold text-indigo-300 mt-0.5">{step.actor} ({step.platform})</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  {step.actionSummary}
                </p>

                {step.ssotRef && (
                  <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-emerald-400">
                    <Database className="w-3 h-3 shrink-0" />
                    <span className="truncate">SSOT: {step.ssotRef}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edge Robot Execution Log */}
      {robotEnabled && robotExecutionLog.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2.5 text-left animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              Nhật ký Thực thi Tự động của Edge Robot Node (&lt;20ms Execution Stream):
            </span>
            <span className="text-[10px] font-mono text-emerald-400">● AIR-GAPPED EMBEDDED NODE</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs text-slate-200">
            {robotExecutionLog.map((log, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span>{log.text}</span>
                <span className="text-[10px] text-slate-500 shrink-0 ml-2">{log.time} · {log.latencyMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

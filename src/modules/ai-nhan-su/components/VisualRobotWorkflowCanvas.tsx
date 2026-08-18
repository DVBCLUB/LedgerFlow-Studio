import React, { useState } from 'react';
import { Play, Plus, ArrowRight, ShieldCheck, FileSpreadsheet, Bot, CheckCircle, RefreshCw } from 'lucide-react';

interface WorkflowNode {
  id: string;
  label: string;
  type: 'crawler' | 'privacy_mask' | 'accounting_post' | 'approval_gate' | 'notify';
  status: 'idle' | 'running' | 'success' | 'failed';
  details: string;
}

const DEFAULT_NODES: WorkflowNode[] = [
  { id: '1', label: '1. Inbound Webhook / Invoice Ingestion', type: 'crawler', status: 'idle', details: 'Trích xuất dữ liệu hóa đơn đầu vào' },
  { id: '2', label: '2. Decree 13/2023 PII Masking', type: 'privacy_mask', status: 'idle', details: 'Ẩn CCCD, SĐT, MST khách hàng' },
  { id: '3', label: '3. Double-Entry Posting (VAS 200)', type: 'accounting_post', status: 'idle', details: 'Ghi sổ Nợ 112 / Có 511, 3331' },
  { id: '4', label: '4. Executive Human Approval Gateway', type: 'approval_gate', status: 'idle', details: 'Duyệt giao dịch > 20,000,000 VNĐ' },
  { id: '5', label: '5. Executive Summary Notification', type: 'notify', status: 'idle', details: 'Gửi báo cáo qua Telegram & CEO Panel' },
];

export default function VisualRobotWorkflowCanvas() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(DEFAULT_NODES);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);

  const runWorkflow = async () => {
    setIsRunning(true);
    for (let i = 0; i < nodes.length; i++) {
      setActiveStep(i);
      setNodes((prev) =>
        prev.map((node, idx) => ({
          ...node,
          status: idx === i ? 'running' : idx < i ? 'success' : 'idle',
        }))
      );
      await new Promise((r) => setTimeout(r, 800));
    }
    setNodes((prev) => prev.map((node) => ({ ...node, status: 'success' })));
    setIsRunning(false);
    setActiveStep(-1);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            Visual Robot Automation Pipeline Builder
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Quy trình tự động hóa chuỗi liên hoàn: Thu nạp hóa đơn → Bảo mật PII → Hạch toán VAS → Phê duyệt → Báo cáo
          </p>
        </div>

        <button
          onClick={runWorkflow}
          disabled={isRunning}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Đang chạy Pipeline...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Kích hoạt toàn chuỗi
            </>
          )}
        </button>
      </div>

      {/* Visual Chain Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {nodes.map((node, idx) => (
          <div key={node.id} className="relative">
            <div
              className={`p-4 rounded-xl border transition-all duration-300 h-full flex flex-col justify-between ${
                node.status === 'running'
                  ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 animate-pulse'
                  : node.status === 'success'
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-cyan-400 font-mono text-[11px]">Node {idx + 1}</span>
                  {node.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                </div>
                <h4 className="text-xs font-bold text-slate-100">{node.label}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{node.details}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 uppercase font-mono">
                <span>{node.type}</span>
                <span className={node.status === 'running' ? 'text-cyan-400 font-bold' : ''}>
                  {node.status}
                </span>
              </div>
            </div>

            {idx < nodes.length - 1 && (
              <div className="hidden md:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-slate-400">
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

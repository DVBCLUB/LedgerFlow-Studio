import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Download, CheckCircle, RefreshCw, Terminal, Shield, Zap, Sparkles, AlertCircle } from 'lucide-react';
import type { OllamaLocalStatus } from '../../types/api-responses';

export default function OllamaLocalModelHubPanel() {
  const [status, setStatus] = useState<OllamaLocalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedModel, setCopiedModel] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ollama/local/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const copyCommand = (modelName: string) => {
    navigator.clipboard.writeText(`ollama run ${modelName}`);
    setCopiedModel(modelName);
    setTimeout(() => setCopiedModel(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 text-slate-100 shadow-xl">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                1-Click Ollama Local Model Hub ($0 / Offline-First)
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  Zero Cloud Cost
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Vận hành AI hoàn toàn ngoại tuyến trên máy tính cục bộ. Dữ liệu tài chính & PII không bao giờ gửi ra Internet.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto border border-slate-700 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới trạng thái
        </button>
      </div>

      {/* Connection & Memory Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Ollama Daemon</span>
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${status?.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className={status?.isRunning ? 'text-emerald-400' : 'text-rose-400'}>
              {status?.isRunning ? 'Đang hoạt động (Online)' : 'Chưa kết nối (Offline)'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">Port: http://127.0.0.1:11434</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Bảo mật Dữ liệu</span>
          <div className="flex items-center gap-1.5 font-bold text-sm text-cyan-400">
            <Shield className="w-4 h-4 text-cyan-400" />
            100% On-Device Local
          </div>
          <span className="text-[10px] text-slate-500 block">Tuân thủ Nghị định 13/2023/NĐ-CP</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Chi Phí Token</span>
          <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-400">
            <Zap className="w-4 h-4 text-emerald-400" />
            0 VNĐ / Không Giới Hạn
          </div>
          <span className="text-[10px] text-slate-500 block">Chạy vĩnh viễn không phụ thuộc API Key</span>
        </div>
      </div>

      {/* Curated Local Model Catalog */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Danh mục Mô hình Đề xuất theo Cấu hình Máy
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(status?.recommendedModels || [
            { name: 'llama3.2:3b', size: '2.0 GB', ramRequired: '4 GB RAM', domain: 'General Assistant, Email, Viết nội dung', isInstalled: false },
            { name: 'qwen2.5-coder:7b', size: '4.7 GB', ramRequired: '8 GB RAM', domain: 'Lập trình, Refactor Code, Viết Script', isInstalled: false },
            { name: 'deepseek-r1:1.5b', size: '1.1 GB', ramRequired: '3 GB RAM', domain: 'CoT Reasoning, Giải toán logic, Phân tích', isInstalled: false },
            { name: 'gemma2:2b', size: '1.6 GB', ramRequired: '4 GB RAM', domain: 'Tóm tắt văn bản, Trích xuất thông tin', isInstalled: false },
          ]).map((model, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/70 space-y-3 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-bold text-sm text-slate-100 font-mono flex items-center gap-2">
                    {model.name}
                    <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {model.size}
                    </span>
                  </h5>
                  <p className="text-xs text-slate-400 mt-1">{model.domain}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-[11px] text-cyan-400 flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  Yêu cầu: {model.ramRequired}
                </span>

                <button
                  onClick={() => copyCommand(model.name)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1"
                >
                  {copiedModel === model.name ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Đã copy lệnh!
                    </>
                  ) : (
                    <>
                      <Terminal className="w-3.5 h-3.5" />
                      Copy lệnh chạy
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

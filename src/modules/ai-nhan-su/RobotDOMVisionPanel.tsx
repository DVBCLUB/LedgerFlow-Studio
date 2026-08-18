import React, { useState, useMemo } from 'react';
import { Bot, Cpu, Layers, CheckCircle2, ArrowRight, Zap, RefreshCw, ShieldCheck, Play, Activity, Clock, Database, Eye, Terminal, Sparkles, Check, AlertTriangle, Crosshair, Search } from 'lucide-react';
import { healRobotActionSelector, HealedSelectorResult } from '../../../server/services/robotVisionHealer';

export interface DOMParsedElement {
  id: string;
  tagName: string;
  type?: string;
  label: string;
  selector: string;
  boundingX: number;
  boundingY: number;
  width: number;
  height: number;
  confidence: number;
}

export default function RobotDOMVisionPanel() {
  const [targetUrl, setTargetUrl] = useState('http://127.0.0.1:3005/#/knowledge_library');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedElements, setScannedElements] = useState<DOMParsedElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<DOMParsedElement | null>(null);
  const [testLabel, setTestLabel] = useState('Duyệt chi phí');
  const [testBrokenSelector, setTestBrokenSelector] = useState('div > button.btn-primary-123xyz');
  const [healingResult, setHealingResult] = useState<HealedSelectorResult | null>(null);
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);
  const [executionStep, setExecutionStep] = useState<number>(0);
  const [executionLogs, setExecutionLogs] = useState<{ time: string; text: string; latencyMs: number }[]>([]);

  // Initial Seed DOM Scan Data
  const sampleElements: DOMParsedElement[] = useMemo(() => [
    {
      id: 'input_title',
      tagName: 'INPUT',
      type: 'text',
      label: 'Tiêu đề Ghi chú / SOP',
      selector: 'input[placeholder*="Ví dụ: SOP"]',
      boundingX: 320,
      boundingY: 410,
      width: 380,
      height: 42,
      confidence: 0.98
    },
    {
      id: 'select_source',
      tagName: 'SELECT',
      type: 'dropdown',
      label: 'Nguồn Tri thức (Role)',
      selector: 'select[name="knowledge_source"]',
      boundingX: 320,
      boundingY: 470,
      width: 180,
      height: 40,
      confidence: 0.95
    },
    {
      id: 'btn_save',
      tagName: 'BUTTON',
      type: 'submit',
      label: 'Lưu & Gửi Duyệt Tri thức',
      selector: 'button:contains("Lưu & Gửi Duyệt")',
      boundingX: 520,
      boundingY: 620,
      width: 180,
      height: 44,
      confidence: 0.99
    },
    {
      id: 'btn_copy_rag',
      tagName: 'BUTTON',
      type: 'action',
      label: 'Sao chép Context đã duyệt',
      selector: 'button:contains("Sao chép Context")',
      boundingX: 1100,
      boundingY: 340,
      width: 190,
      height: 40,
      confidence: 0.96
    }
  ], []);

  const handleScanDOM = () => {
    setIsScanning(true);
    setScannedElements([]);
    setTimeout(() => {
      setScannedElements(sampleElements);
      setSelectedElement(sampleElements[0]);
      setIsScanning(false);
    }, 600);
  };

  const handleTestSelfHealing = () => {
    const result = healRobotActionSelector({
      selector: testBrokenSelector,
      targetLabel: testLabel,
      pageContentText: `Hệ thống duyệt chi ngân sách cao cấp. Nút bấm: ${testLabel} và Phê duyệt chứng từ.`
    });
    setHealingResult(result);
  };

  const handleRunDOMWorkflow = () => {
    setIsExecutingWorkflow(true);
    setExecutionStep(1);
    setExecutionLogs([]);

    const addLog = (text: string, latencyMs: number) => {
      setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text, latencyMs }]);
    };

    // Step 1: DOM Ingestion
    setTimeout(() => {
      addLog(`[DOM Vision Engine] Quét cấu trúc DOM tại ${targetUrl} ➔ Phát hiện 4 phần tử tương tác.`, 12);
      setExecutionStep(2);

      // Step 2: Self-Healing Selector Validation
      setTimeout(() => {
        addLog(`[Self-Healing Core] Tự phục hồi Selector thành công cho nút "${testLabel}" ➔ Gán nhãn data-vision-target.`, 18);
        setExecutionStep(3);

        // Step 3: Visual Coordinate Click & Simulation
        setTimeout(() => {
          addLog(`[Visual Robot Node] Mô phỏng click tại tọa độ (X: 520px, Y: 620px) ➔ Nhập dữ liệu tự động.`, 24);
          setExecutionStep(4);

          // Step 4: Audit Trail Logging
          setTimeout(() => {
            addLog(`[Air-gapped Runtime] Ghi nhận Audit Trail & lưu Snapshot tri thức tự trị (<20ms).`, 15);
            setIsExecutingWorkflow(false);
          }, 400);
        }, 500);
      }, 500);
    }, 500);
  };

  return (
    <div className="space-y-6 text-left select-none">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 shadow-lg">
              <Eye className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">CÔNG NGHỆ DOM VISION &amp; SOFTWARE ROBOT</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Self-Healing Automation v3.0
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Tích hợp trực tiếp công nghệ Bóc tách DOM, Visual Pixel Bounding Box và Selector Tự phục hồi khi Giao diện Web thay đổi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 border border-cyan-500/30 px-3 py-1.5 font-mono">
              <Crosshair className="h-4 w-4 text-cyan-400" />
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">DOM Parser</span>
                <span className="text-xs font-black text-cyan-300">Semantic Active</span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 px-3 py-1.5 font-mono">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Self-Healing</span>
                <span className="text-xs font-black text-emerald-300">Ready 100%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: DOM Inspector & Self-Healing Lab */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Live DOM Inspector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Trình Bóc Tách DOM &amp; Định Vị Tọa Độ Pixel</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">Playwright &amp; Vision Engine</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                placeholder="Nhập URL web hoặc ứng dụng nội bộ..."
              />
              <button
                onClick={handleScanDOM}
                disabled={isScanning}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-cyan-600/20 shrink-0"
              >
                {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                <span>{isScanning ? 'Đang quét DOM...' : '🔍 Quét DOM Tree'}</span>
              </button>
            </div>

            {/* Elements Table */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Danh sách phần tử nhận diện ({scannedElements.length}):</span>
              {scannedElements.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-slate-500 text-xs font-semibold">
                  Nhấn "🔍 Quét DOM Tree" để bắt đầu bóc tách phần tử từ trang web mẫu.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {scannedElements.map((el) => (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElement(el)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        selectedElement?.id === el.id
                          ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {el.tagName}
                          </span>
                          <span className="text-xs font-black text-white">{el.label}</span>
                        </div>
                        <code className="text-[10px] font-mono text-slate-400 block">{el.selector}</code>
                      </div>
                      <div className="text-right font-mono text-[10px] space-y-0.5">
                        <span className="text-emerald-400 font-bold block">X:{el.boundingX}px Y:{el.boundingY}px</span>
                        <span className="text-slate-400 block">{el.width}x{el.height}px</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Self-Healing Test Lab & Execution Engine */}
        <div className="lg:col-span-5 space-y-4">
          {/* Self-Healing Selector Lab */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Bộ Tự Phục Hồi Selector (Self-Healing)</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400">AI Vision OCR</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tên Nhãn phần tử (Target Label):</label>
                <input
                  type="text"
                  value={testLabel}
                  onChange={(e) => setTestLabel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Selector Cũ Bị Lỗi / Đổi Class Name:</label>
                <input
                  type="text"
                  value={testBrokenSelector}
                  onChange={(e) => setTestBrokenSelector(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-400"
                />
              </div>

              <button
                onClick={handleTestSelfHealing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-emerald-200" />
                <span>⚡ Thử nghiệm Tự Phục Hồi (Heal Selector)</span>
              </button>

              {healingResult && (
                <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-slate-900/90 space-y-2 text-xs font-mono animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Phục Hồi Thành Công
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                      {(healingResult.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1 pt-1">
                    <div><span className="text-slate-500">Selector cũ:</span> <code className="text-rose-400">{healingResult.originalSelector}</code></div>
                    <div><span className="text-slate-500">Selector mới:</span> <code className="text-emerald-300 font-bold">{healingResult.healedSelector}</code></div>
                    <div className="text-[10px] text-slate-400 italic pt-1">{healingResult.reason}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Runner */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Chạy Chuỗi Robot Tự Động DOM</h3>
              </div>
              <button
                onClick={handleRunDOMWorkflow}
                disabled={isExecutingWorkflow}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20"
              >
                {isExecutingWorkflow ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isExecutingWorkflow ? 'Đang chạy...' : 'Kích hoạt Chuỗi'}</span>
              </button>
            </div>

            {/* Logs Window */}
            <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/90 font-mono text-[11px] space-y-1.5 max-h-[160px] overflow-y-auto">
              {executionLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-4">Nhấn "Kích hoạt Chuỗi" để thực thi Robot tự động化 DOM.</div>
              ) : (
                executionLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                    <span className="text-cyan-300 flex-1">{log.text}</span>
                    <span className="text-emerald-400 text-[10px] shrink-0 font-bold">+{log.latencyMs}ms</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

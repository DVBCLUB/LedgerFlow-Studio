import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Layers,
  Zap,
} from 'lucide-react';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabledTiers: ('freemium' | 'pro' | 'enterprise')[];
  enabled: boolean;
  userCount: number;
}

const INITIAL_FLAGS: FeatureFlag[] = [
  {
    id: 'flag-1',
    key: 'WASM_PYTHON_SANDBOX',
    name: 'Môi trường Python 3.12 WebAssembly',
    description: 'Chạy phân tích dữ liệu & mã Python trực tiếp trên trình duyệt',
    enabledTiers: ['pro', 'enterprise'],
    enabled: true,
    userCount: 1420,
  },
  {
    id: 'flag-2',
    key: 'DOM_VISION_AUTONOMY',
    name: 'Robot Cạo Lead DOM Vision & OpenClaw',
    description: 'Điều khiển trình duyệt tự động và cạo dữ liệu thị trường',
    enabledTiers: ['enterprise'],
    enabled: true,
    userCount: 380,
  },
  {
    id: 'flag-3',
    key: 'VIETQR_AUTO_MATCH',
    name: 'Khớp Nối VietQR Tự Động Kế Toán VAS',
    description: 'Tự động bắt webhook ngân hàng và tạo chứng từ kế toán',
    enabledTiers: ['freemium', 'pro', 'enterprise'],
    enabled: true,
    userCount: 4500,
  },
  {
    id: 'flag-4',
    key: 'SWARM_RELAY_CHAT',
    name: 'Giao Ghi Chú & Chat Liên AI Agent',
    description: 'Truyền dữ liệu và phối hợp tự trị giữa các AI Staff',
    enabledTiers: ['pro', 'enterprise'],
    enabled: true,
    userCount: 890,
  },
  {
    id: 'flag-5',
    key: 'AUTONOMOUS_CLOSED_LOOP_L4',
    name: 'Vòng Lặp Tự Trị Đóng Level 4 (Closed-Loop Autonomy)',
    description: 'Tự động phản xạ liên phòng ban: Chốt deal -> Giao việc AI -> Tạo hóa đơn nháp',
    enabledTiers: ['enterprise'],
    enabled: true,
    userCount: 520,
  },
  {
    id: 'flag-6',
    key: 'DIGITAL_TWIN_MONTE_CARLO',
    name: 'Mô Phỏng Digital Twin & Monte Carlo Runway',
    description: 'Mô phỏng 10,000 kịch bản dự báo cạn tiền và điểm nghẽn token 60 ngày',
    enabledTiers: ['pro', 'enterprise'],
    enabled: true,
    userCount: 780,
  },
  {
    id: 'flag-7',
    key: 'SWE_AGENT_SANDBOX_SWARM',
    name: 'Nhà Máy Phần Mềm SWE Multi-Agent Swarm',
    description: 'AI tự động lập trình trong Docker Sandbox, chạy test và tạo GitHub PR an toàn',
    enabledTiers: ['enterprise'],
    enabled: true,
    userCount: 310,
  },
  {
    id: 'flag-8',
    key: 'REALTIME_SSE_TELEMETRY',
    name: 'Luồng Giám Sát Telemetry Thời Gian Thực SSE',
    description: 'Cập nhật trực tiếp phản xạ của robot và nhân sự ảo lên giao diện người dùng',
    enabledTiers: ['freemium', 'pro', 'enterprise'],
    enabled: true,
    userCount: 6200,
  },
];

export default function FeatureFlagMatrixPanel() {
  const [flags, setFlags] = useState<FeatureFlag[]>(INITIAL_FLAGS);
  const [selectedTier, setSelectedTier] = useState<'all' | 'freemium' | 'pro' | 'enterprise'>('all');

  const toggleFlag = (id: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    );
  };

  const filteredFlags = selectedTier === 'all'
    ? flags
    : flags.filter((f) => f.enabledTiers.includes(selectedTier));

  return (
    <div className="rounded-3xl border border-sky-500/20 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl text-left space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Sliders className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">AI Feature Flag & Tier Packaging Matrix</h3>
              <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/20">
                LaunchDarkly-Engine
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              Bật/tắt tính năng theo gói cước sản phẩm (Freemium, Pro, Enterprise) mà không cần build lại mã nguồn.
            </p>
          </div>
        </div>

        {/* Tier Filter Pills */}
        <div className="flex items-center gap-1.5">
          {(['all', 'freemium', 'pro', 'enterprise'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                selectedTier === tier
                  ? 'bg-sky-600 text-white shadow-md border border-sky-400'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tier === 'all' ? 'Tất cả Gói' : tier}
            </button>
          ))}
        </div>
      </div>

      {/* Flags List */}
      <div className="space-y-3">
        {filteredFlags.map((flag) => (
          <div
            key={flag.id}
            className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">{flag.name}</span>
                <code className="rounded bg-slate-950 px-1.5 py-0.5 text-[10px] font-mono text-sky-400 border border-slate-800">
                  {flag.key}
                </code>
              </div>
              <p className="text-[11px] font-medium text-slate-400">{flag.description}</p>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-slate-500">Đã mở cho gói:</span>
                {flag.enabledTiers.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-extrabold uppercase text-slate-300 border border-slate-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-black text-white font-mono">{flag.userCount.toLocaleString()}</span>
                <span className="block text-[9px] font-semibold text-slate-500">Users Active</span>
              </div>

              <button
                onClick={() => toggleFlag(flag.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                  flag.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                {flag.enabled ? (
                  <>
                    <ToggleRight className="h-4 w-4 text-emerald-400" /> BẬT (Active)
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-4 w-4" /> TẮT (Disabled)
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

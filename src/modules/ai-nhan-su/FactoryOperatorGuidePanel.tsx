import React from 'react';
import { BookOpen, Compass, ShieldCheck, Terminal, Cpu, CheckCircle } from 'lucide-react';

export function FactoryOperatorGuidePanel() {
  const steps = [
    {
      num: '01',
      title: 'Khởi Tạo Nhiệm Vụ (Mission Inception)',
      desc: 'Nhập mục tiêu sản phẩm (Game 3D, Video AI 4K, App WebGL) tại Product Studio hoặc Universal CEO Command Palette.',
    },
    {
      num: '02',
      title: 'Tư Duy Nhận Thức & Thẩm Định An Toàn (System 2)',
      desc: 'Glacia Deliberative Engine thẩm định rủi ro, phân tích khả thi và dự phóng chi phí $0 token trước khi viết mã.',
    },
    {
      num: '03',
      title: 'Thực Thi Lập Trình Tự Trị & Render Đồ Họa',
      desc: 'Điều phối đa mô hình (Claude Code, Antigravity, Blender, FFmpeg) tự động tạo mã nguồn và render asset 3D/video.',
    },
    {
      num: '04',
      title: 'Kiểm Thử Sandbox Cô Lập & Tự Sửa Lỗi (Self-Healing)',
      desc: 'Thực thi mã nguồn trong VM Sandbox, tự động bắt lỗi và sinh bản vá phục hồi nếu phát hiện bất thường.',
    },
    {
      num: '05',
      title: 'Đóng Gói Desktop & Phát Hành (Windows Executable)',
      desc: 'Đóng gói trực tiếp thành bản Windows Desktop release/win-unpacked/LedgerFlow Hub.exe để Founder sử dụng ngay.',
    },
  ];

  return (
    <div className="rounded-2xl border border-border-primary bg-slate-950/80 p-5 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between border-b border-border-secondary/60 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Sổ Tay Vận Hành Nhà Máy Phần Mềm (Operator Guide)</h3>
            <p className="text-xs text-text-tertiary">Quy trình 5 bước chuẩn hóa vận hành nhà máy tự trị</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/20">
          <Compass className="h-3.5 w-3.5" />
          Standard SOP v2.5
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((s) => (
          <div key={s.num} className="flex items-start gap-3.5 rounded-xl border border-border-secondary/60 bg-slate-900/40 p-3.5 hover:border-border-primary transition-all">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-black text-amber-400 border border-amber-500/20">
              {s.num}
            </span>
            <div>
              <div className="font-bold text-xs text-text-primary">{s.title}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-text-tertiary">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FactoryOperatorGuidePanel;

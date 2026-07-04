import React, { useState, useMemo } from 'react';
import { EyeOff, Play, ShieldCheck, Check } from 'lucide-react';

export default function DataAnonymizerSimulator() {
  const [inputText, setInputText] = useState<string>('Nguyễn Văn Hùng - 0987654321 - hung.nv@gmail.com - Chi phí tạm ứng mua bản quyền cho Dự án X');
  const [cleanedText, setCleanedText] = useState<string>('');
  const [processed, setProcessed] = useState<boolean>(false);

  const handleClean = () => {
    // Basic regex scrubbing for simulation
    let val = inputText;
    
    // Replace vietnamese full name with "Nhân viên / Khách hàng XX"
    // For simplicity, we just find name-like chunks or replace "Nguyễn Văn Hùng" with "Nhân sự A"
    val = val.replace(/Nguyễn Văn Hùng/gi, 'Nhân sự A');
    
    // Replace phone numbers with masked ones: e.g., 0987654321 -> 098*****21
    val = val.replace(/(0[2-9]\d)(\d{5})(\d{2})/g, '$1*****$3');
    
    // Replace emails with masked ones: hung.nv@gmail.com -> h**@gmail.com
    val = val.replace(/([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1**@$2');

    setCleanedText(val);
    setProcessed(true);
  };

  const handleReset = () => {
    setInputText('Nguyễn Văn Hùng - 0987654321 - hung.nv@gmail.com - Chi phí tạm ứng mua bản quyền cho Dự án X');
    setCleanedText('');
    setProcessed(false);
  };

  return (
    <div className="rounded-2xl border border-border-primary bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-xl">
      <div className="flex items-center gap-3 border-b border-border-primary pb-4 mb-5">
        <div className="p-2 bg-violet-500/10 text-violet-400 border border-violet-500/25 rounded-xl">
          <EyeOff className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">PII Data Anonymizer</h3>
          <p className="text-[11px] text-text-secondary font-semibold leading-relaxed">Giả lập quy trình ẩn danh hóa thông tin cá nhân (PII) trước khi gửi qua API đám mây công cộng.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Input */}
        <div className="lg:col-span-3 space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-350 mb-1.5">Dữ liệu thô chứa thông tin nhạy cảm:</label>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl text-xs text-text-primary focus:outline-none focus:border-violet-500 font-semibold leading-relaxed font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClean}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 px-4 py-2 text-xs font-black text-text-primary cursor-pointer transition-all"
            >
              <Play className="w-3.5 h-3.5" /> Ẩn danh hóa dữ liệu
            </button>
            <button
              onClick={handleReset}
              className="rounded-xl border border-slate-850 px-4 py-2 text-xs font-black text-text-secondary hover:text-text-primary cursor-pointer transition-all"
            >
              Đặt lại
            </button>
          </div>

          <div className="rounded-xl border border-slate-850/60 bg-bg-primary/30 p-3 text-xs leading-relaxed text-text-secondary font-semibold">
            <span className="text-text-primary font-bold block mb-1">Tuân thủ Nghị định 13/2023/NĐ-CP:</span>
            Khi xây dựng phần mềm AI, việc gửi số điện thoại, tên tuổi hay email thô của khách hàng Việt Nam qua API OpenAI/Gemini nước ngoài mà chưa có sự đồng ý của họ là hành vi vi phạm pháp luật dữ liệu cá nhân. Công cụ anonymizer trung gian là giải pháp tối ưu.
          </div>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-slate-950/60 rounded-xl p-5 border border-slate-850/80">
          {processed ? (
            <div className="space-y-4 text-left">
              <div>
                <span className="text-[10px] text-text-tertiary font-black uppercase tracking-wider block">Dữ liệu đã ẩn danh hóa (Sạch)</span>
                <div className="mt-1.5 p-3 rounded-lg bg-black/40 border border-slate-900 text-[11.5px] font-bold font-mono leading-relaxed text-emerald-300">
                  {cleanedText}
                </div>
              </div>

              <div className="border-t border-slate-900 pt-3">
                <span className="text-[10px] text-text-tertiary font-black uppercase tracking-wider block">Trạng thái an toàn</span>
                <span className="inline-flex items-center gap-1.5 mt-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase">
                  <Check className="w-3 h-3" /> Sẵn sàng gửi sang AI API
                </span>
                <p className="text-[10px] text-text-secondary mt-2 font-semibold leading-relaxed">
                  Bản ghi đã ẩn đi Họ tên, số điện thoại và email. AI vẫn hiểu được ngữ cảnh công việc và thực hiện phân tích được bình thường mà không gây rò rỉ thông tin cá nhân.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-text-tertiary p-4">
              <EyeOff className="w-8 h-8 mb-2 text-slate-655" />
              <p className="text-xs font-semibold leading-relaxed">Click nút để thực hiện chạy bộ lọc che giấu thông tin nhạy cảm.</p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-violet-400/90 border border-violet-500/10 bg-violet-500/5 p-2 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Quy chuẩn che giấu PII dữ liệu doanh nghiệp offline.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

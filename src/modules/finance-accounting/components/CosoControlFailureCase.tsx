import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';

export default function CosoControlFailureCase() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleReset = () => {
    setSelectedOption(null);
  };

  return (
    <div className="rounded-2xl border border-border-primary bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-xl">
      <div className="flex items-center gap-3 border-b border-border-primary pb-4 mb-5">
        <div className="p-2 bg-success/10 text-success border border-success/25 rounded-xl">
          <ShieldCheck className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">COSO Internal Control Simulator</h3>
          <p className="text-[11px] text-text-secondary font-semibold leading-relaxed">Mô phỏng tình huống sự cố kiểm soát và phương án gỡ lỗi quản trị nội bộ.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Scenario description */}
        <div className="rounded-xl border border-error/25 bg-error/5 p-4 text-left">
          <span className="text-[10px] text-rose-350 font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-rose-450" /> Tình huống sự cố:
          </span>
          <p className="text-xs font-semibold leading-relaxed text-slate-250 mt-2">
            Solo Founder thuê 01 Kế toán viên hỗ trợ công việc. Để tiện lợi và tiết kiệm thời gian, Founder bàn giao luôn Token ngân hàng doanh nghiệp và mật khẩu internet banking cho kế toán để tự thanh toán các đơn hàng vật tư nhỏ. 
            <br /><br />
            Sau 3 tháng, số dư tài khoản hao hụt bất thường. Founder kiểm tra và phát hiện kế toán tự tạo nhiều đơn đặt hàng/thầu phụ ảo để rút tiền chuyển về tài khoản cá nhân.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Hãy chọn phương án xử lý (kiểm soát nội bộ):</span>
          
          {[
            {
              id: 'option_a',
              label: 'Phương án A: Tin tưởng & Tăng lương',
              desc: 'Rút kinh nghiệm sâu sắc, nhắc nhở kế toán không tái phạm và tăng lương để họ cống hiến tốt hơn.',
              result: 'Rủi ro Cực kỳ cao! Việc này không giải quyết được lỗ hổng cấu trúc kiểm soát. Kế toán sẽ tìm cách tinh vi hơn để hợp thức hóa hóa đơn khống.',
              verdict: 'fail'
            },
            {
              id: 'option_b',
              label: 'Phương án B: Chỉ theo dõi thông báo biến động số dư',
              desc: 'Kế toán vẫn giữ token chuyển tiền, nhưng Founder yêu cầu tin nhắn SMS báo số dư gửi về số máy của mình.',
              result: 'Rủi ro Trung bình! Founder chỉ phát hiện khi tiền ĐÃ MẤT khỏi tài khoản, không ngăn chặn trước được hành vi tự ý chuyển tiền khống.',
              verdict: 'warn'
            },
            {
              id: 'option_c',
              label: 'Phương án C: Áp dụng nguyên tắc Bất Kiêm Nhiệm (Maker-Checker)',
              desc: 'Tách biệt quyền: Kế toán chỉ được nhập lệnh chuyển tiền (Maker). Founder giữ token vật lý bảo mật và trực tiếp duyệt lệnh cuối cùng (Checker).',
              result: 'Giải pháp Đạt chuẩn COSO! Tách biệt hoàn toàn chức năng phê duyệt (Duyệt chi) và chức năng thực hiện (Lập lệnh). Tiền không thể ra khỏi tài khoản nếu không có sự phê duyệt trực tiếp của Founder.',
              verdict: 'success'
            }
          ].map((opt) => {
            const isSelected = selectedOption === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? opt.verdict === 'success'
                      ? 'bg-success/20 border-success/80 text-success'
                      : opt.verdict === 'warn'
                      ? 'bg-warning/20 border-warning/80 text-warning'
                      : 'bg-error/20 border-error/80 text-error'
                    : 'bg-bg-primary border-border-primary hover:bg-bg-surface text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="text-xs font-bold block">{opt.label}</span>
                <span className="text-[10px] block mt-1 leading-relaxed font-semibold">{opt.desc}</span>
                
                {isSelected && (
                  <div className="mt-3 border-t border-border-secondary pt-3 text-[11px] leading-relaxed font-bold">
                    <span className="uppercase text-[9px] block mb-1">Kết quả kiểm tra:</span>
                    {opt.result}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedOption && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-primary">
            <span className="text-[10px] text-text-muted font-bold flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-text-secondary" />
              Chuẩn COSO: Kiểm soát phòng ngừa (Preventive) tốt hơn Kiểm soát phát hiện (Detective).
            </span>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-primary text-[10px] font-bold text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Chạy lại simulator
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

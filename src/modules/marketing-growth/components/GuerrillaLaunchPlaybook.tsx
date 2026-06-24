import React, { useState } from 'react';
import { Calendar, HelpCircle, CheckSquare, Square, Info } from 'lucide-react';

interface DayPlan {
  day: string;
  title: string;
  action: string;
  platform: string;
  details: string[];
}

const LAUNCH_DAYS: DayPlan[] = [
  {
    day: 'Ngày -3',
    title: 'Xây dựng sự chú ý trước (Pre-launch Build)',
    action: 'Đăng tải câu chuyện Build in Public kể về quá trình thiết kế và xử lý các bug kỹ thuật phức tạp.',
    platform: 'Facebook Groups, LinkedIn cá nhân',
    details: [
      'Viết bài dưới góc độ học hỏi, không chèo kéo bán hàng.',
      'Đăng ảnh chụp màn hình wireframe hoặc log lỗi thú vị.',
      'Kêu gọi tham gia nhóm Zalo Beta testing.'
    ]
  },
  {
    day: 'Ngày -1',
    title: 'Gửi thư riêng tư tới tập mẫu (Warm outreach)',
    action: 'Tiếp cận trực tiếp những khách hàng tiềm năng đã phỏng vấn ở bước khảo sát ICP.',
    platform: 'Zalo cá nhân, Email trực tiếp',
    details: [
      'Gửi tin nhắn cá nhân hóa: "Chào anh/chị, sản phẩm [Tên sản phẩm] chúng ta từng thảo luận đã có bản thử nghiệm..."',
      'Tặng mã giảm giá/miễn phí trọn đời cho 20 người đăng ký đầu tiên.',
      'Nhờ họ đóng góp ý kiến thô trước giờ G.'
    ]
  },
  {
    day: 'Ngày 0',
    title: 'Bấm nút khởi chạy chính thức (Official Launch)',
    action: 'Công bố sản phẩm trên diện rộng kèm landing page có sẵn bộ đếm đăng ký.',
    platform: 'Product Hunt, Hacker News, Cộng đồng công nghệ',
    details: [
      'Viết bài giới thiệu chi tiết vấn đề bạn giải quyết và giải pháp tối giản.',
      'Sẵn sàng online phản hồi comment của người dùng trong suốt 24h đầu.',
      'Theo dõi sát sao lượng đăng ký ảo (Smoke test conversion).'
    ]
  },
  {
    day: 'Ngày +3',
    title: 'Tận dụng hiệu ứng đám đông (Proof of Momentum)',
    action: 'Công bố kết quả sơ bộ và các bài học rút ra sau launch.',
    platform: 'Mạng xã hội, Bản tin newsletter',
    details: [
      'Đăng thống kê: "Sau 72 giờ, chúng tôi đón nhận 100+ đăng ký thử nghiệm từ..."',
      'Công khai một số phản hồi tích cực/góp ý của người dùng.',
      'Công bố lộ trình tính năng tiếp theo để tạo niềm tin lâu dài.'
    ]
  }
];

export default function GuerrillaLaunchPlaybook() {
  const [completed, setCompleted] = useState<Record<number, boolean>>({});

  const toggleDay = (idx: number) => {
    setCompleted(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/25 rounded-xl">
          <Calendar className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Guerrilla Launch Playbook</h3>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Kịch bản 7 ngày ra mắt sản phẩm du kích không tốn chi phí cho Solo Founder.</p>
        </div>
      </div>

      <div className="space-y-4">
        {LAUNCH_DAYS.map((plan, idx) => {
          const isDone = completed[idx];
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                isDone
                  ? 'bg-slate-950/50 border-slate-900 opacity-60'
                  : 'bg-slate-900/40 border-slate-850 hover:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleDay(idx)}
                    className="mt-0.5 text-sky-400 hover:text-sky-300 transition-colors cursor-pointer shrink-0"
                  >
                    {isDone ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {plan.day}
                      </span>
                      <span className="text-[10px] font-black text-slate-500 font-mono">
                        Platform: {plan.platform}
                      </span>
                    </div>
                    <h4 className={`text-xs font-black mt-2 ${isDone ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {plan.title}
                    </h4>
                    <p className={`text-xs font-semibold leading-relaxed mt-1.5 ${isDone ? 'text-slate-500' : 'text-slate-350'}`}>
                      {plan.action}
                    </p>
                    
                    {!isDone && (
                      <ul className="mt-3 space-y-1.5 text-[11px] text-slate-450 border-l-2 border-slate-800 pl-3">
                        {plan.details.map((detail, dIdx) => (
                          <li key={dIdx} className="list-disc list-inside leading-relaxed font-semibold">
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-sky-400/90 border border-sky-500/10 bg-sky-500/5 p-2 rounded-lg">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>Gợi ý: Hãy tùy chỉnh kế hoạch phù hợp với thói quen online của tệp ICP của bạn.</span>
      </div>
    </div>
  );
}

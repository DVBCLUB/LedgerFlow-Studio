import React, { useState, useMemo } from 'react';
import { Mail, ShieldCheck, MessageSquare, AlertCircle, Copy } from 'lucide-react';

export default function ZaloNotificationSimulator() {
  const [content, setContent] = useState<string>('Chào anh/chị, bên em vừa gửi báo cáo đối chiếu công nợ tuần qua. Anh/chị bấm nút bên dưới để kiểm tra nhé.');
  const [hasNameTag, setHasNameTag] = useState<boolean>(true);
  const [hasButton, setHasButton] = useState<boolean>(true);
  const [btnText, setBtnText] = useState<string>('Xem báo cáo sạch');

  const stats = useMemo(() => {
    const len = content.length;
    let baseScore = 50;

    // Penalty for length:
    if (len > 250) baseScore -= 15;
    else if (len > 150) baseScore -= 5;
    else if (len > 40 && len <= 120) baseScore += 10; // optimal length

    // Personalization bonus:
    if (hasNameTag && content.includes('[Tên]')) baseScore += 20;
    else if (hasNameTag) baseScore += 10;

    // Call to action button bonus:
    if (hasButton && btnText.trim().length > 0) baseScore += 20;

    const score = Math.min(100, Math.max(10, baseScore));

    // CTR & Open estimation:
    const openRate = Math.min(98, Math.round(75 + (score * 0.2)));
    const ctr = Math.min(45, Math.round(5 + (score * 0.35)));

    let quality = 'Cần tối ưu thêm';
    let qualityColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';

    if (score >= 80) {
      quality = 'Xuất sắc';
      qualityColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    } else if (score >= 60) {
      quality = 'Đạt yêu cầu';
      qualityColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }

    return { score, openRate, ctr, quality, qualityColor };
  }, [content, hasNameTag, hasButton, btnText]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/25 rounded-xl">
          <MessageSquare className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Zalo Notification Simulator</h3>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Bộ thử nghiệm soạn thảo và chấm điểm hiệu năng tin nhắn chăm sóc khách hàng qua Zalo.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column: Editor */}
        <div className="lg:col-span-3 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-350">Nội dung tin nhắn:</label>
              <span className={`text-[10px] font-bold ${content.length > 150 ? 'text-amber-400' : 'text-slate-500'}`}>
                {content.length} ký tự (Nên &lt; 150)
              </span>
            </div>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung tin nhắn. Dùng [Tên] để cá nhân hóa..."
              className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 font-semibold leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-bold">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasNameTag}
                onChange={(e) => {
                  setHasNameTag(e.target.checked);
                  if (e.target.checked && !content.includes('[Tên]')) {
                    setContent('[Tên] thân mến, ' + content);
                  }
                }}
                className="accent-sky-500"
              />
              Cá nhân hóa bằng tag [Tên] (+20 điểm)
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasButton}
                onChange={(e) => setHasButton(e.target.checked)}
                className="accent-sky-500"
              />
              Thêm nút Kêu gọi hành động (+20 điểm)
            </label>
          </div>

          {hasButton && (
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-1">Tên nút bấm (CTA):</label>
              <input
                type="text"
                value={btnText}
                onChange={(e) => setBtnText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 font-semibold"
              />
            </div>
          )}
        </div>

        {/* Right Column: Preview & Score */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-slate-950/60 rounded-xl p-5 border border-slate-850/80">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Điểm tối ưu (Zalo Copy Score)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-white font-mono">{stats.score}/100</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${stats.qualityColor}`}>
                  {stats.quality}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-3">
              <div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Tỷ lệ mở dự kiến</span>
                <p className="text-xl font-black text-white font-mono mt-1">{stats.openRate}%</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Tỷ lệ Click (CTR)</span>
                <p className="text-xl font-black text-sky-400 font-mono mt-1">{stats.ctr}%</p>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-3">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Mock-up Tin Nhắn Zalo</span>
              <div className="mt-2 rounded-xl bg-[#e5efff] text-slate-900 p-4 border border-blue-200/50 shadow-inner">
                <p className="text-xs font-semibold leading-relaxed text-left text-slate-800">
                  {content}
                </p>
                {hasButton && btnText.trim().length > 0 && (
                  <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-black text-center shadow-md">
                    {btnText}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-sky-400/90 border border-sky-500/10 bg-sky-500/5 p-2 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Mô phỏng tin nhắn ZNS chăm sóc khách hàng.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

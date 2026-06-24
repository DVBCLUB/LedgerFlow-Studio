import React, { useState } from 'react';
import { Database, HelpCircle, AlertCircle, Check, ArrowRight } from 'lucide-react';

interface CardData {
  title: string;
  vas133: string;
  vas200: string;
  tip: string;
}

const COMPARISONS: CardData[] = [
  {
    title: 'Đối tượng áp dụng',
    vas133: 'Doanh nghiệp nhỏ và vừa (SMEs) thuộc mọi thành phần kinh tế.',
    vas200: 'Mọi loại hình doanh nghiệp. Bắt buộc đối với các doanh nghiệp quy mô lớn.',
    tip: 'Lời khuyên cho Solo Founder: Hãy chọn VAS 133 để giảm bớt gánh nặng báo cáo.'
  },
  {
    title: 'Hệ thống tài khoản cấp 1 & 2',
    vas133: 'Đơn giản hóa, lược bỏ nhiều tài khoản phụ và phức tạp để kế toán làm nhanh.',
    vas200: 'Hệ thống cực kỳ chi tiết, nhiều cấp phụ, phân tách sâu dòng tiền và nguyên vật liệu.',
    tip: 'Nếu mô hình của bạn chỉ là dọn dẹp số liệu, hệ thống tài khoản VAS 133 giúp thiết kế database nhẹ nhàng hơn.'
  },
  {
    title: 'Báo cáo lưu chuyển tiền tệ (Statement of Cash Flows)',
    vas133: 'Không bắt buộc lập (Khuyến khích lập nhưng không bắt buộc pháp lý).',
    vas200: 'Bắt buộc phải lập và nộp cùng Báo cáo tài chính năm.',
    tip: 'Đây là ranh giới lớn. VAS 200 yêu cầu đối chiếu lưu chuyển tiền tệ gián tiếp/trực tiếp cực kỳ khắt khe.'
  },
  {
    title: 'Nguyên tắc ưu tiên hạch toán',
    vas133: 'Coi trọng bản chất kinh tế hơn hình thức pháp lý.',
    vas200: 'Tuân thủ chặt chẽ các biểu mẫu pháp lý và chứng từ kế toán chính thống.',
    tip: 'VAS 133 giúp Solo Founder dễ dàng hạch toán các nghiệp vụ kinh tế mới (như chi phí AI, thẻ ảo).'
  }
];

export default function VasAccountingCards() {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-xl">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">VAS 133 vs. VAS 200 Quick Guide</h3>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Flashcards tương tác giúp Solo Founder hiểu nhanh sự khác biệt giữa hai chế độ kế toán tại Việt Nam.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column: List of topics */}
        <div className="lg:col-span-2 space-y-2">
          {COMPARISONS.map((item, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/20 border-emerald-500/80 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-900 hover:bg-slate-900/40 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-500">0{idx + 1}.</span>
                  <span>{item.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Comparative Card */}
        <div className="lg:col-span-3 bg-slate-950/60 rounded-xl p-5 border border-slate-850/80 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-sm font-black text-white border-b border-slate-900 pb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Chủ đề: {COMPARISONS[activeIndex].title}
            </h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-3 text-left">
                <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">VAS 133 (SMEs)</span>
                <p className="text-xs font-semibold leading-relaxed text-slate-300 mt-2">
                  {COMPARISONS[activeIndex].vas133}
                </p>
              </div>

              <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-3 text-left">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">VAS 200 (Tiêu chuẩn)</span>
                <p className="text-xs font-semibold leading-relaxed text-slate-300 mt-2">
                  {COMPARISONS[activeIndex].vas200}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3.5 text-left">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-400 font-mono block">
                💡 Advisor Tip:
              </span>
              <p className="text-xs font-bold leading-relaxed text-slate-200 mt-1.5">
                {COMPARISONS[activeIndex].tip}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-emerald-400/90">
            <Check className="w-3.5 h-3.5" />
            <span>Chế độ kế toán phù hợp giúp tiết kiệm 70% chi phí kê khai thuế ban đầu.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

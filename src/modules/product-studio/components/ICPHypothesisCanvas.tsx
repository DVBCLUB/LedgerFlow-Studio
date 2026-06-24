import React, { useState, useMemo } from 'react';
import { Users, AlertCircle, Coins, Award, Layers } from 'lucide-react';

type ICPType = 'construction_acc' | 'retail_shop' | 'freelancer_tech';

interface ICPData {
  title: string;
  industry: string;
  painPoint: string;
  painLevel: number;
  payingAbility: string;
  traits: string[];
  mvpRecommendation: string[];
}

const ICP_DATASETS: Record<ICPType, ICPData> = {
  construction_acc: {
    title: 'Kế toán Xây dựng & Dự án',
    industry: 'Xây dựng / Dự án công trình',
    painPoint: 'Mất hàng trăm giờ đối chiếu thủ công hóa đơn nguyên vật liệu (dầu, cát, thép) với dự toán công trình và khối lượng thầu phụ giao.',
    painLevel: 9,
    payingAbility: 'Cao (5.000.000đ - 15.000.000đ/tháng) nếu giải quyết triệt để rủi ro thất thoát vật tư.',
    traits: [
      'Làm việc nhiều với file Excel cực kỳ phức tạp và lộn xộn.',
      'Sợ thanh tra Thuế sờ gáy do hóa đơn dầu/vật tư đầu vào không hợp lệ hoặc vượt định mức.',
      'Thường xuyên di chuyển giữa văn phòng và công trường.'
    ],
    mvpRecommendation: [
      'Tool dọn dẹp hóa đơn và trích xuất bảng Excel sạch.',
      'Hệ thống tự động phát hiện lệch số lượng giữa Phiếu nhập kho và Hóa đơn điện tử.',
      'Dashboard báo cáo tiến độ chi phí theo mã công trình.'
    ]
  },
  retail_shop: {
    title: 'Chủ Cửa hàng Bán lẻ & Chuỗi Mini',
    industry: 'Thương mại bán lẻ / F&B',
    painPoint: 'Mất kiểm soát dòng tiền công nợ gối đầu với hàng chục nhà cung cấp khác nhau; lệch số tồn kho giữa thực tế và phần mềm POS.',
    painLevel: 8,
    payingAbility: 'Trung bình (1.000.000đ - 3.000.000đ/tháng), rất cân nhắc chi phí vận hành phần mềm.',
    traits: [
      'Không thạo công nghệ phức tạp, thích giao diện di động tối giản.',
      'Bận rộn xử lý các sự vụ tại cửa hàng (nhân viên, khách hàng, ship hàng).',
      'Muốn xem báo cáo lợi nhuận nhanh chỉ trong 1 màn hình.'
    ],
    mvpRecommendation: [
      'Báo cáo tự động chốt công nợ NCC gửi qua Zalo mỗi tối.',
      'Ứng dụng đối chiếu nhanh file Excel ngân hàng với doanh thu trên phần mềm POS.',
      'Quy trình kiểm kho quét mã QR đơn giản bằng điện thoại.'
    ]
  },
  freelancer_tech: {
    title: 'Lập trình viên & Freelancer Tự do',
    industry: 'Công nghệ thông tin / Dịch vụ số',
    painPoint: 'Gặp khó khăn trong việc quản lý chi phí mua tool AI/SaaS chồng chéo; không biết cách tính thuế thu nhập cá nhân (PIT) và đăng ký hộ kinh doanh cá thể.',
    painLevel: 7,
    payingAbility: 'Thấp đến Trung bình (300.000đ - 1.000.000đ/tháng), ưa thích tự dùng các bản free tier.',
    traits: [
      'Cực kỳ rành công nghệ, hay thử nghiệm các công cụ mới.',
      'Làm việc online 100%, có thu nhập từ nước ngoài (Upwork, ads, affiliate).',
      'Muốn tự động hóa hóa đơn và kê khai thuế đơn giản.'
    ],
    mvpRecommendation: [
      'Bảng tính toán tối ưu stack tool 0đ (Zero-Cost Stack Optimizer).',
      'Tool tính thuế PIT tự động cho freelancer nhận tiền ngoại tệ.',
      'Template hợp đồng dịch vụ chuẩn mực pháp lý Việt Nam.'
    ]
  }
};

export default function ICPHypothesisCanvas() {
  const [selectedIcp, setSelectedIcp] = useState<ICPType>('construction_acc');

  const icp = useMemo(() => ICP_DATASETS[selectedIcp], [selectedIcp]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 text-left shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-xl">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Ideal Customer Profile (ICP) Canvas</h3>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Giả thuyết chân dung khách hàng mục tiêu để tối ưu thiết kế giải pháp R&D.</p>
        </div>
      </div>

      {/* Select ICP */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-850 mb-5">
        {(Object.keys(ICP_DATASETS) as ICPType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedIcp(type)}
            className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer border ${
              selectedIcp === type
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {type === 'construction_acc' ? 'Kế toán xây dựng' : type === 'retail_shop' ? 'Chủ shop bán lẻ' : 'Freelancer'}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850/60">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Ngành công nghiệp</span>
            <span className="text-xs font-black text-white mt-1 block">{icp.industry}</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850/60">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Nỗi đau lớn nhất (Pain Point)</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                Cường độ đau: {icp.painLevel}/10
              </span>
            </div>
            <p className="text-xs font-semibold leading-relaxed text-slate-250 mt-2">{icp.painPoint}</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850/60">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Khả năng chi trả / Willingness to Pay</span>
            <p className="text-xs font-bold leading-relaxed text-emerald-400 mt-2 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 shrink-0" />
              {icp.payingAbility}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850/60 text-left">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-2">Đặc điểm hành vi & Thói quen</span>
            <ul className="space-y-2 text-xs text-slate-350">
              {icp.traits.map((trait, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{trait}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850/60 text-left">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-2">Đề xuất MVP tối giản được khuyên dùng</span>
            <ul className="space-y-2 text-xs text-slate-350">
              {icp.mvpRecommendation.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-bold leading-relaxed text-emerald-100">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

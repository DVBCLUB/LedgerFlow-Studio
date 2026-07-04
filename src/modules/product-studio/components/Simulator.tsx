import React, { useState } from 'react';
import { Zap } from 'lucide-react';

export default function Simulator() {
  // Custom Simulator States
  const [targetVolume, setTargetVolume] = useState<number>(1000);
  const [unitPrice, setUnitPrice] = useState<number>(49000); // 49k VND
  const [monthlyServerCost, setMonthlyServerCost] = useState<number>(0); // Target zero

  // Pricing & Volume math values
  const totalRevenue = targetVolume * unitPrice;
  const netProfit = totalRevenue - (monthlyServerCost * 12);
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return (
    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 shadow-xl grid lg:grid-cols-12 gap-6 items-center">
      {/* Sliders Area */}
      <div className="lg:col-span-7 space-y-4">
        <div>
          <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">OPERATIONAL MODEL SIMULATOR</span>
          <h3 className="text-sm font-black text-text-primary uppercase mt-1">
            📊 Trình Giả Lập Phát Triển "Bán Rẻ - Số Lượng Rộng Lớn"
          </h3>
          <p className="text-[11px] text-text-secondary font-medium leading-relaxed mt-1">
            Chiến thuật du kích cắt bỏ rườm rà doanh nghiệp lớn. Chỉ cần tập trung bán cực rẻ với tệp khách đông đảo trên nền hạ tầng tự động <strong>0đ vận hành</strong>:
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Unit Price Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold font-sans">
              <span className="text-slate-350">Mức giá bán siêu rẻ (VND):</span>
              <span className="text-emerald-400 font-mono font-extrabold">{unitPrice.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <input 
              type="range"
              min="10000"
              max="250000"
              step="5000"
              value={unitPrice}
              onChange={e => setUnitPrice(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1"
            />
            <div className="flex justify-between text-[9px] text-text-tertiary">
              <span>10.000đ (Giá Mini Game)</span>
              <span>250.000đ (Micro-SaaS cao cấp)</span>
            </div>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold font-sans">
              <span className="text-slate-350">Số lượng khách hàng tải / gia hạn (User):</span>
              <span className="text-purple-400 font-mono font-extrabold">{targetVolume.toLocaleString('vi-VN')} lượt nạp</span>
            </div>
            <input 
              type="range"
              min="100"
              max="10000"
              step="100"
              value={targetVolume}
              onChange={e => setTargetVolume(Number(e.target.value))}
              className="w-full accent-purple-500 h-1"
            />
            <div className="flex justify-between text-[9px] text-text-tertiary">
              <span>100 lượt</span>
              <span>10.000 lượt (Quy mô vừa phải Việt Nam)</span>
            </div>
          </div>

          {/* Operating cost slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold font-sans">
              <span className="text-slate-350">Chi phí máy chủ, duy trì hàng tháng:</span>
              <span className={`font-mono font-extrabold ${monthlyServerCost === 0 ? 'text-emerald-500 animate-pulse' : 'text-rose-400'}`}>
                {monthlyServerCost === 0 ? '0 VNĐ (Tối ưu tuyệt đối)' : `${monthlyServerCost.toLocaleString('vi-VN')} VNĐ`}
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="500000"
              step="20000"
              value={monthlyServerCost}
              onChange={e => setMonthlyServerCost(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1"
            />
            <div className="flex justify-between text-[9px] text-text-tertiary">
              <span>0đ (Free-Tier Stack)</span>
              <span>500.000đ/tháng ( VPS riêng)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="lg:col-span-1 border-l border-slate-900 h-full hidden lg:block"></div>

      <div className="lg:col-span-4 bg-slate-950 p-4.5 rounded-2xl border border-slate-850 space-y-4">
        <div className="text-center pb-2 border-b border-slate-900">
          <span className="text-[10px] text-text-tertiary uppercase font-black tracking-wider block">HIỆU QUẢ DỮ LIỆU DỰ THU</span>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {totalRevenue.toLocaleString('vi-VN')} <span className="text-xs">VND</span>
          </p>
          <span className="text-[9.5px] text-text-tertiary font-semibold block mt-1">Dựa trên mô hình nhân rải quy mô Việt Nam</span>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between leading-none">
            <span className="text-text-tertiary font-semibold">Tỷ suất LN ròng:</span>
            <span className="text-text-primary font-bold font-mono">{profitMargin.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between leading-none">
            <span className="text-text-tertiary font-semibold">Phí server cả năm:</span>
            <span className="text-text-secondary font-bold font-mono">{(monthlyServerCost * 12).toLocaleString('vi-VN')} VNĐ</span>
          </div>
          
          <div className="pt-2 border-t border-slate-900">
            {monthlyServerCost === 0 ? (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                <span className="text-[9.5px] font-black text-emerald-400 uppercase tracking-widest block">⭐ CHỈ SỐ DU KÍCH HOÀN MỸ</span>
                <p className="text-[10px] text-text-secondary font-semibold leading-normal">
                  Không lo gánh nặng chi phí! Với operating cost = 0đ, bạn có thể treo game/app hàng năm trời để đón nhận cơ hội viral tự nhiên mà không lo âm tiền cốt lõi.
                </p>
              </div>
            ) : (
              <div className="p-2.5 bg-bg-primary border border-slate-850 rounded-xl">
                <p className="text-[10px] text-text-secondary font-semibold leading-normal">
                  Nếu bạn nỗ lực học kỹ thuật tối ưu hóa mã nguồn, tận dụng Supabase Free tier, SQLite cục bộ, bạn có thể ép chi phí vận hành về 0 VNĐ để tăng tỷ suất lợi nhuận đạt mức tối đa!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Filter, MousePointerClick, MessageCircle, FileText, CheckCircle, ArrowRight } from 'lucide-react';

export default function SalesFunnelLab() {
  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Filter className="h-6 w-6 text-indigo-400" /> Phòng Thí Nghiệm Phễu Bán Hàng
          </h2>
          <p className="text-xs text-slate-400 mt-1">Thiết kế luồng tương tác và chuyển đổi khách hàng tự động.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">
          + Tạo Phễu mới
        </button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="relative flex flex-col items-center gap-6 max-w-2xl mx-auto">
          
          {/* Node 1 */}
          <div className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-black/50 z-10 group hover:border-indigo-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <MousePointerClick className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Nguồn Traffic (Facebook Ads)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Chiến dịch "Ra mắt LedgerFlow OS"</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-white">12,400</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Lượt truy cập</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center justify-center -my-2 z-0">
            <div className="w-0.5 h-6 bg-slate-700"></div>
            <div className="bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-[10px] text-slate-400 font-bold z-10 flex items-center gap-1">
              <span className="text-emerald-400">15%</span> Click chat
            </div>
            <div className="w-0.5 h-6 bg-slate-700"></div>
          </div>

          {/* Node 2 */}
          <div className="w-5/6 bg-slate-900 border border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-black/50 z-10 group hover:border-indigo-500 transition-colors cursor-pointer relative">
            <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-[#09090b] shadow-lg">AI</div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <MessageCircle className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Bot Tư vấn viên (GPT-4o)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Lọc nhu cầu và thu thập Email</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-white">1,860</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Cuộc hội thoại</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center justify-center -my-2 z-0">
            <div className="w-0.5 h-6 bg-slate-700"></div>
            <div className="bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-[10px] text-slate-400 font-bold z-10 flex items-center gap-1">
              <span className="text-emerald-400">45%</span> Để lại thông tin
            </div>
            <div className="w-0.5 h-6 bg-slate-700"></div>
          </div>

          {/* Node 3 */}
          <div className="w-4/6 bg-slate-900 border border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-black/50 z-10 group hover:border-indigo-500 transition-colors cursor-pointer relative">
            <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-[#09090b] shadow-lg">AI</div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <FileText className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Agent Gửi Báo giá</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tạo file PDF cá nhân hóa</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-white">837</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Báo giá đã gửi</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center justify-center -my-2 z-0">
            <div className="w-0.5 h-6 bg-slate-700"></div>
            <div className="bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-[10px] text-slate-400 font-bold z-10 flex items-center gap-1">
              <span className="text-emerald-400">12%</span> Chốt Sale
            </div>
            <div className="w-0.5 h-6 bg-slate-700"></div>
          </div>

          {/* Node 4 (Thành công) */}
          <div className="w-3/6 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)] z-10 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
            <div className="text-2xl font-black text-white mb-1">100</div>
            <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Khách hàng mới</div>
          </div>

        </div>
      </div>
    </div>
  );
}

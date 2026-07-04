import React, { useState, useEffect } from 'react';
import { Box, Play, Pause, RotateCcw, TrendingUp, Users, AlertTriangle, Activity } from 'lucide-react';

type Face = 'front' | 'right' | 'back' | 'left';

export default function Analytics3DLab() {
  const [activeFace, setActiveFace] = useState<Face>('front');
  const [isAutoRotate, setIsAutoRotate] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAutoRotate) {
      interval = setInterval(() => {
        setActiveFace((prev) => {
          if (prev === 'front') return 'right';
          if (prev === 'right') return 'back';
          if (prev === 'back') return 'left';
          return 'front';
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAutoRotate]);

  const getRotationClass = () => {
    switch (activeFace) {
      case 'front': return '[transform:rotateY(0deg)]';
      case 'right': return '[transform:rotateY(-90deg)]';
      case 'back': return '[transform:rotateY(-180deg)]';
      case 'left': return '[transform:rotateY(90deg)]';
      default: return '[transform:rotateY(0deg)]';
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Box className="h-6 w-6 text-indigo-400" /> Hologram Data Sandbox
          </h2>
          <p className="text-xs text-text-secondary mt-1">Quan sát Đa chiều: Hệ sinh thái Kinh doanh & AI</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveFace('front')}
            className="p-2 rounded-xl bg-bg-primary border border-border-primary text-text-secondary hover:text-text-primary"
            title="Reset Góc nhìn"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              isAutoRotate 
                ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                : 'bg-bg-primary border-border-primary text-text-secondary hover:text-text-primary'
            }`}
          >
            {isAutoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isAutoRotate ? 'Đang tự quay' : 'Tự động xoay'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8 mt-12">
        {/* Khung chứa hiệu ứng 3D */}
        <div className="h-[500px] rounded-3xl bg-[#030303] border border-white/5 flex items-center justify-center overflow-hidden [perspective:1500px] relative">
          
          {/* Lưới không gian ảo */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px', transform: 'rotateX(60deg) scale(2.5)', transformOrigin: 'bottom' }}></div>

          <div className={`relative w-[280px] h-[280px] transition-transform duration-1000 ease-in-out [transform-style:preserve-3d] ${getRotationClass()}`}>
            
            {/* FRONT - Doanh thu */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-950/80 border-2 border-cyan-500/50 rounded-2xl [transform:rotateY(0deg)_translateZ(140px)] backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.3)] p-6 text-center">
              <TrendingUp className="h-10 w-10 text-cyan-400 mb-4" />
              <h3 className="text-sm font-black uppercase text-cyan-500 tracking-widest mb-1">Dòng tiền Q1</h3>
              <div className="text-3xl font-bold text-text-primary mb-2">$124,500</div>
              <div className="w-full h-1 bg-cyan-900 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-cyan-400"></div>
              </div>
            </div>

            {/* RIGHT - AI Workforce */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-violet-950/80 border-2 border-violet-500/50 rounded-2xl [transform:rotateY(90deg)_translateZ(140px)] backdrop-blur-md shadow-[0_0_30px_rgba(139,92,246,0.3)] p-6 text-center">
              <Activity className="h-10 w-10 text-violet-400 mb-4" />
              <h3 className="text-sm font-black uppercase text-violet-500 tracking-widest mb-1">Hiệu suất AI</h3>
              <div className="text-3xl font-bold text-text-primary mb-2">99.8%</div>
              <p className="text-xs text-violet-300">Hoạt động trơn tru 30 ngày qua</p>
            </div>

            {/* BACK - Khách hàng */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/80 border-2 border-emerald-500/50 rounded-2xl [transform:rotateY(180deg)_translateZ(140px)] backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.3)] p-6 text-center">
              <Users className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-sm font-black uppercase text-emerald-500 tracking-widest mb-1">Lượng User</h3>
              <div className="text-3xl font-bold text-text-primary mb-2">1,204</div>
              <p className="text-xs text-emerald-300">+12% so với tháng trước</p>
            </div>

            {/* LEFT - Rủi ro */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-950/80 border-2 border-amber-500/50 rounded-2xl [transform:rotateY(-90deg)_translateZ(140px)] backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.3)] p-6 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-400 mb-4" />
              <h3 className="text-sm font-black uppercase text-amber-500 tracking-widest mb-1">Báo động Đỏ</h3>
              <div className="text-3xl font-bold text-text-primary mb-2">0</div>
              <p className="text-xs text-amber-300">Hệ thống trong vùng an toàn</p>
            </div>
            
            {/* TOP & BOTTOM (đóng khối, mờ nhẹ) */}
            <div className="absolute inset-0 bg-indigo-900/20 border border-indigo-500/20 rounded-2xl [transform:rotateX(90deg)_translateZ(140px)]"></div>
            <div className="absolute inset-0 bg-indigo-900/20 border border-indigo-500/20 rounded-2xl [transform:rotateX(-90deg)_translateZ(140px)] shadow-[0_0_50px_rgba(99,102,241,0.4)]"></div>
          </div>
        </div>

        {/* Khung điều khiển */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-2">Bảng điều khiển 3D</h3>
          
          <button onClick={() => setActiveFace('front')} className={`p-4 rounded-2xl border text-left transition-all ${activeFace === 'front' ? 'bg-cyan-950/50 border-cyan-500/50' : 'bg-bg-primary/50 border-border-primary hover:border-border-secondary'}`}>
            <div className="flex items-center gap-3">
              <TrendingUp className={`h-5 w-5 ${activeFace === 'front' ? 'text-cyan-400' : 'text-text-tertiary'}`} />
              <div>
                <div className={`text-xs font-bold ${activeFace === 'front' ? 'text-text-primary' : 'text-text-secondary'}`}>Mặt Trước: Tài Chính</div>
                <div className="text-[10px] text-text-tertiary mt-1">Doanh thu & chi phí</div>
              </div>
            </div>
          </button>

          <button onClick={() => setActiveFace('right')} className={`p-4 rounded-2xl border text-left transition-all ${activeFace === 'right' ? 'bg-violet-950/50 border-violet-500/50' : 'bg-bg-primary/50 border-border-primary hover:border-border-secondary'}`}>
            <div className="flex items-center gap-3">
              <Activity className={`h-5 w-5 ${activeFace === 'right' ? 'text-violet-400' : 'text-text-tertiary'}`} />
              <div>
                <div className={`text-xs font-bold ${activeFace === 'right' ? 'text-text-primary' : 'text-text-secondary'}`}>Mặt Phải: AI Engine</div>
                <div className="text-[10px] text-text-tertiary mt-1">Độ ổn định Agent</div>
              </div>
            </div>
          </button>

          <button onClick={() => setActiveFace('back')} className={`p-4 rounded-2xl border text-left transition-all ${activeFace === 'back' ? 'bg-emerald-950/50 border-emerald-500/50' : 'bg-bg-primary/50 border-border-primary hover:border-border-secondary'}`}>
            <div className="flex items-center gap-3">
              <Users className={`h-5 w-5 ${activeFace === 'back' ? 'text-emerald-400' : 'text-text-tertiary'}`} />
              <div>
                <div className={`text-xs font-bold ${activeFace === 'back' ? 'text-text-primary' : 'text-text-secondary'}`}>Mặt Sau: Khách Hàng</div>
                <div className="text-[10px] text-text-tertiary mt-1">Lượng User truy cập</div>
              </div>
            </div>
          </button>

          <button onClick={() => setActiveFace('left')} className={`p-4 rounded-2xl border text-left transition-all ${activeFace === 'left' ? 'bg-amber-950/50 border-amber-500/50' : 'bg-bg-primary/50 border-border-primary hover:border-border-secondary'}`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-5 w-5 ${activeFace === 'left' ? 'text-amber-400' : 'text-text-tertiary'}`} />
              <div>
                <div className={`text-xs font-bold ${activeFace === 'left' ? 'text-text-primary' : 'text-text-secondary'}`}>Mặt Trái: Rủi ro</div>
                <div className="text-[10px] text-text-tertiary mt-1">Cảnh báo hệ thống</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Rocket, FastForward, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function BusinessSimulationEngine() {
  const [marketingBudget, setMarketingBudget] = useState(5000);
  const [churnRate, setChurnRate] = useState(5);
  const [price, setPrice] = useState(99);

  const simulationData = useMemo(() => {
    let currentUsers = 1000;
    let cashpool = 50000;
    const data = [];
    
    for (let month = 1; month <= 36; month++) {
      // Giả lập logic tăng trưởng
      const newUsers = Math.floor(marketingBudget / 50); // Giả sử CAC = $50
      const churnedUsers = Math.floor(currentUsers * (churnRate / 100));
      currentUsers = currentUsers + newUsers - churnedUsers;
      
      const revenue = currentUsers * price;
      const expenses = marketingBudget + (currentUsers * 10); // $10 chi phí vận hành/user
      const profit = revenue - expenses;
      cashpool += profit;

      data.push({
        month,
        users: currentUsers,
        revenue,
        profit,
        cashpool
      });
    }
    return data;
  }, [marketingBudget, churnRate, price]);

  const maxRevenue = Math.max(...simulationData.map(d => d.revenue));
  const finalCash = simulationData[35].cashpool;

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FastForward className="h-6 w-6 text-indigo-400" /> Cỗ Máy Thời Gian (36 Tháng)
          </h2>
          <p className="text-xs text-slate-400 mt-1">Dự phóng tài chính & Tăng trưởng theo biến số</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-8">
        {/* Sliders */}
        <div className="space-y-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Biến số Vận hành</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Ngân sách Marketing/Tháng</span>
              <span className="text-white font-bold">${marketingBudget.toLocaleString()}</span>
            </div>
            <input 
              type="range" min="0" max="50000" step="1000" 
              value={marketingBudget} onChange={(e) => setMarketingBudget(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Tỷ lệ rời bỏ (Churn Rate)</span>
              <span className="text-white font-bold">{churnRate}%</span>
            </div>
            <input 
              type="range" min="1" max="20" step="1" 
              value={churnRate} onChange={(e) => setChurnRate(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Giá bán / Tháng (Pricing)</span>
              <span className="text-white font-bold">${price}</span>
            </div>
            <input 
              type="range" min="10" max="500" step="10" 
              value={price} onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Kết quả sau 3 năm</div>
            <div className="text-3xl font-black text-emerald-400">
              ${(finalCash / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-slate-400">Tiền mặt thặng dư (Cashpool)</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-5 h-[400px] flex flex-col">
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span className="text-xs text-slate-400">Doanh thu ($)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-slate-400">Lợi nhuận ($)</span>
            </div>
          </div>

          <div className="flex-1 flex items-end gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            {simulationData.map((d, idx) => (
              <div key={idx} className="flex-1 min-w-[20px] flex flex-col justify-end items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute -top-16 bg-slate-800 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                  Tháng {d.month}<br/>
                  Rev: ${d.revenue.toLocaleString()}<br/>
                  Profit: ${d.profit.toLocaleString()}
                </div>
                
                {/* Doanh thu */}
                <div 
                  className="w-full bg-indigo-500/80 rounded-t-sm hover:bg-indigo-400 transition-all"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                ></div>
                {/* Tháng */}
                <div className="text-[8px] text-slate-600 mt-1">{idx % 3 === 0 ? `M${d.month}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

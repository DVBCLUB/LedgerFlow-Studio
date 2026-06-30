import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Activity, BarChart3, HelpCircle, Sparkles, Sliders } from 'lucide-react';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left ${className}`}>{children}</div>
);

// Mock data
const cashflowData = [
  { month: 'Jan', inflow: 45000, outflow: 32000, net: 13000 },
  { month: 'Feb', inflow: 52000, outflow: 38000, net: 14000 },
  { month: 'Mar', inflow: 49000, outflow: 41000, net: 8000 },
  { month: 'Apr', inflow: 63000, outflow: 42000, net: 21000 },
  { month: 'May', inflow: 58000, outflow: 48000, net: 10000 },
  { month: 'Jun', inflow: 71000, outflow: 52000, net: 19000 },
];

const projectVarianceData = [
  { name: 'Core SaaS App', budgeted: 120000, actual: 98000, variance: 22000 },
  { name: 'Construction ERP', budgeted: 80000, actual: 95000, variance: -15000 },
  { name: 'Local Business POS', budgeted: 50000, actual: 48000, variance: 2000 },
  { name: 'Zalo Connect Plugin', budgeted: 30000, actual: 25000, variance: 5000 },
];

const agingData = [
  { range: '0-30 days', receivables: 35000, payables: 15000 },
  { range: '31-60 days', receivables: 18000, payables: 8000 },
  { range: '61-90 days', receivables: 7000, payables: 4000 },
  { range: '90+ days', receivables: 4000, payables: 1000 },
];

export default function FinancialChartsModelPanel() {
  const [activeTab, setActiveTab] = useState<'cashflow' | 'variance' | 'aging' | 'scenario'>('cashflow');
  
  // What-If Scenario Sliders
  const [growthRate, setGrowthRate] = useState(15); // %
  const [churnRate, setChurnRate] = useState(3); // %
  const [opExpenses, setOpExpenses] = useState(42000); // USD/month
  const [currentCash, setCurrentCash] = useState(120000); // USD

  // Forecasting Calculation
  const forecastData = useMemo(() => {
    let cash = currentCash;
    let revenue = 65000; // baseline revenue
    const data = [{ month: 'Current', cash, revenue }];

    for (let i = 1; i <= 6; i++) {
      revenue = Math.round(revenue * (1 + growthRate / 100) * (1 - churnRate / 100));
      const net = revenue - opExpenses;
      cash = Math.max(0, cash + net);
      data.push({
        month: `Month +${i}`,
        cash,
        revenue,
      });
    }
    return data;
  }, [growthRate, churnRate, opExpenses, currentCash]);

  const runwayMonths = useMemo(() => {
    let cash = currentCash;
    let revenue = 65000;
    let months = 0;
    
    while (cash > 0 && months < 36) {
      revenue = revenue * (1 + growthRate / 100) * (1 - churnRate / 100);
      const net = revenue - opExpenses;
      if (net >= 0) return 'Infinity (Dòng tiền Dương)';
      cash += net;
      if (cash <= 0) break;
      months++;
    }
    return `${months} Tháng`;
  }, [growthRate, churnRate, opExpenses, currentCash]);

  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Financial Analysis & Forecasting Models</h2>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1.5 rounded-xl bg-slate-950 p-1">
          {(['cashflow', 'variance', 'aging', 'scenario'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                activeTab === tab 
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/25' 
                  : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              {tab === 'cashflow' && 'Cashflow & Burn'}
              {tab === 'variance' && 'Project Variance'}
              {tab === 'aging' && 'Aging Reports'}
              {tab === 'scenario' && 'What-If Simulation'}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Cashflow & Burn rate tab */}
      {activeTab === 'cashflow' && (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-400">
            Biểu đồ dòng tiền thực tế 6 tháng qua thể hiện dòng tiền thu vào (Inflow), chi ra (Outflow) và thặng dư ròng (Net cashflow).
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowData}>
                <defs>
                  <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area name="Inflow (Thu vào)" type="monotone" dataKey="inflow" stroke="#10b981" fillOpacity={1} fill="url(#colorInflow)" />
                <Area name="Outflow (Chi ra)" type="monotone" dataKey="outflow" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOutflow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 2. Project Variance tab */}
      {activeTab === 'variance' && (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-400">
            So sánh Ngân sách dự chi (Budgeted) và Chi phí thực tế phát sinh (Actual) trên từng danh mục dự án. Lệch âm màu đỏ thể hiện vượt ngân sách.
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectVarianceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar name="Budgeted (Kế hoạch)" dataKey="budgeted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar name="Actual (Thực tế)" dataKey="actual" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. Aging Reports tab */}
      {activeTab === 'aging' && (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-400">
            Báo cáo phân nhóm tuổi nợ của các Khoản phải thu khách hàng (Receivables) và Khoản phải trả nhà cung cấp (Payables).
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar name="Phải thu (Receivables)" dataKey="receivables" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="Phải trả (Payables)" dataKey="payables" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. What-If Simulation tab */}
      {activeTab === 'scenario' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sliders Control panel */}
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
              <Sliders className="h-4 w-4 text-amber-300" />
              <h3 className="text-xs font-black uppercase text-white">Tham Số Giả Định</h3>
            </div>

            {/* Cash */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Cash dự trữ:</span>
                <span className="font-black text-cyan-300">${currentCash.toLocaleString()}</span>
              </div>
              <input 
                type="range" min="10000" max="500000" step="5000" value={currentCash}
                onChange={(e) => setCurrentCash(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                aria-label="Cài đặt cash dự trữ"
              />
            </div>

            {/* Growth */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Tăng trưởng tháng:</span>
                <span className="font-black text-emerald-400">+{growthRate}%</span>
              </div>
              <input 
                type="range" min="0" max="50" step="1" value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                aria-label="Tỷ lệ tăng trưởng doanh thu"
              />
            </div>

            {/* Churn */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Tỷ lệ Churn:</span>
                <span className="font-black text-rose-450">{churnRate}%</span>
              </div>
              <input 
                type="range" min="0" max="20" step="1" value={churnRate}
                onChange={(e) => setChurnRate(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                aria-label="Tỷ lệ khách hàng rời bỏ"
              />
            </div>

            {/* OpExpenses */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Chi phí vận hành/tháng:</span>
                <span className="font-black text-rose-400">${opExpenses.toLocaleString()}</span>
              </div>
              <input 
                type="range" min="10000" max="100000" step="1000" value={opExpenses}
                onChange={(e) => setOpExpenses(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                aria-label="Chi phí vận hành định kỳ"
              />
            </div>
          </div>

          {/* Chart Display */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-300">
                <Sparkles className="h-4 w-4 text-cyan-300 animate-pulse" />
                DỰ BÁO RUNWAY AN TOÀN: <span className="text-amber-300 font-extrabold uppercase">{runwayMonths}</span>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line name="Cash dự báo" type="monotone" dataKey="cash" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line name="Doanh thu dự báo" type="monotone" dataKey="revenue" stroke="#10b981" strokeDasharray="5 5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

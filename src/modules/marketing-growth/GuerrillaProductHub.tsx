import React, { useState, useEffect } from 'react';
import { Zap, Database, Layers, DollarSign, Terminal, Cpu, TrendingUp, BookOpen } from 'lucide-react';
import IdeasTab from '../product-studio/guerrilla/IdeasTab';
import AgentsTab from '../product-studio/guerrilla/AgentsTab';
import StrategyTab from '../product-studio/guerrilla/StrategyTab';
import { useStore } from '../../store/useStore';

export default function GuerrillaProductHub() {
  const { agentPromptHandoff, setAgentPromptHandoff } = useStore();

  // Shared state for the AI Agent console so prompts/outputs persist when switching tabs
  const [activeTab, setActiveTab] = useState<'ideas' | 'agents' | 'strategy'>('ideas');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent_dev');
  const [agentUserInput, setAgentUserInput] = useState<string>('');
  const [agentOutput, setAgentOutput] = useState<string>('');

  useEffect(() => {
    if (agentPromptHandoff) {
      setSelectedAgentId(agentPromptHandoff.agentId);
      setAgentUserInput(agentPromptHandoff.prompt);
      setAgentOutput('');
      setActiveTab('agents');
      setAgentPromptHandoff(undefined);
    }
  }, [agentPromptHandoff, setAgentPromptHandoff]);

  return (
    <div className="space-y-6">
      {/* MANIFESTO/PHILOSOPHY HEADER */}
      <section className="bg-gradient-to-r from-purple-950/20 via-[#060a12] to-emerald-950/25 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-emerald-500/5 blur-3xl animate-pulse"></div>
        <div className="absolute left-1/4 bottom-0 w-32 h-32 rounded-full bg-purple-500/5 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-start gap-4 md:items-center justify-between text-left">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-widest flex items-center gap-2">
                🚀 VIETNAM GUERILLA PRODUCT STUDIO
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[9px] font-black rounded font-mono">HỌC ĐỂ ĐÓNG GÓI & BÁN</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-4xl font-semibold">
                Mục tiêu nghiên cứu DA, BA, Tài chính kế toán, Lập trình và ML là để <strong>đóng gói phần mềm, indie game đánh các thị trường ngách, định giá siêu rẻ để tiếp cận số lượng lớn chủ cửa hàng và người dùng Việt Nam</strong>. Hãy rèn luyện kỹ năng lai để xây dựng đế chế micro-SaaS có chi phí vận hành 0đ!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TACTICAL SKILL LINK GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 text-left">
        {[
          { title: "1. Data Science", desc: "Quét, làm sạch & khám phá hành vi, tìm ra đúng lỗ hổng thị trường ngách để đánh chiến thuật.", icon: Database, color: "text-blue-400 border-blue-500/20" },
          { title: "2. Business Analysis", desc: "Định vị quy trình tinh giản nhất, giải quyết triệt để 1 nỗi đau vàng lặp đi lặp lại của khách.", icon: Layers, color: "text-purple-400 border-purple-500/20" },
          { title: "3. Kế Toán & Định Giá", desc: "Đóng gói mô hình giá siêu hời nhắm số đông (bán sỉ) đi cùng cấu hình hạ tầng vận hành 0 VNĐ.", icon: DollarSign, color: "text-emerald-404 border-emerald-500/20" },
          { title: "4. Lập Trình Siêu Tốc", desc: "Code nhanh, gãy góc gọn nhẹ dạng MVP trong < 7 ngày bằng Web templates hay Godot thô sơ.", icon: Terminal, color: "text-slate-400 border-slate-700/30" },
          { title: "5. Machine Learning", desc: "Lắp ráp một mác AI On-device siêu nhẹ, tạo lợi thế độc quyền cho app tăng tỷ lệ chuyển đổi.", icon: Cpu, color: "text-indigo-400 border-indigo-500/20" }
        ].map((item, id) => (
          <div key={id} className={`bg-slate-950/60 p-4 rounded-xl border ${item.color} space-y-2`}>
            <div className="flex items-center gap-2">
              <item.icon className="w-4 h-4 text-slate-200" />
              <h4 className="text-[11px] font-black uppercase text-white tracking-tight">{item.title}</h4>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* TAB SUB-SELECTOR BAR */}
      <div className="flex flex-col md:flex-row border border-slate-800 bg-[#04080e]/80 p-1.5 rounded-2xl gap-2 select-none">
        <button
          onClick={() => setActiveTab('ideas')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border ${
            activeTab === 'ideas'
              ? 'bg-gradient-to-r from-emerald-950/50 via-slate-950 to-emerald-950/50 text-emerald-404 border-emerald-500/25 shadow-lg shadow-emerald-500/5'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>I. SỔ Ý TƯỞNG & GIẢ LẬP KINH TẾ</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border ${
            activeTab === 'agents'
              ? 'bg-gradient-to-r from-emerald-950/50 via-slate-950 to-emerald-950/50 text-emerald-404 border-emerald-500/25 shadow-lg shadow-emerald-500/5'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>II. BIỆT ĐỘI AI AGENT TÁC CHIẾN (SIÊU CẤP VIP)</span>
        </button>

        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border ${
            activeTab === 'strategy'
              ? 'bg-gradient-to-r from-emerald-950/50 via-slate-950 to-emerald-950/50 text-emerald-404 border-emerald-500/25 shadow-lg shadow-emerald-500/5'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>III. SƠ ĐỒ & CHIẾN LƯỢC TẬP TRUNG TỐI ĐA (0 VNĐ)</span>
        </button>
      </div>

      {activeTab === 'ideas' && <IdeasTab />}

      {activeTab === 'agents' && (
        <AgentsTab
          selectedAgentId={selectedAgentId}
          setSelectedAgentId={setSelectedAgentId}
          agentUserInput={agentUserInput}
          setAgentUserInput={setAgentUserInput}
          agentOutput={agentOutput}
          setAgentOutput={setAgentOutput}
        />
      )}

      {activeTab === 'strategy' && (
        <StrategyTab
          setActiveTab={setActiveTab}
          setSelectedAgentId={setSelectedAgentId}
          setAgentUserInput={setAgentUserInput}
          setAgentOutput={setAgentOutput}
        />
      )}
    </div>
  );
}

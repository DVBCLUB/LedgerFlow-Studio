import React, { useState } from 'react';
import { Bot, UserCheck, Sparkles, Film, Gamepad2, CircleDollarSign, Cpu, CheckCircle2, Play, ArrowDown, Send } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export interface AiStaffMember {
  id: string;
  roleTitle: string;
  department: string;
  agentName: string;
  avatarIcon: any;
  status: 'active' | 'busy' | 'idle' | 'needs_approval';
  currentTask: string;
  metrics: string;
  color: string;
}

export default function AIWorkforceVisualOrgChart() {
  const [selectedAgent, setSelectedAgent] = useState<AiStaffMember | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const staffList: AiStaffMember[] = [
    {
      id: 'staff_media',
      roleTitle: 'AI Media Director',
      department: 'Content & Media Factory',
      agentName: 'Agent Media-01',
      avatarIcon: Film,
      status: 'active',
      currentTask: 'Đang render 3 video ngắn TikTok Review Micro Pro & chèn link Affiliate Shopee',
      metrics: '15 Video/tuần • 98.5% Đúng kịch bản',
      color: 'from-purple-500 to-pink-600',
    },
    {
      id: 'staff_game',
      roleTitle: 'AI Game Developer',
      department: 'Game & App Studio',
      agentName: 'Agent SWE-Dev-02',
      avatarIcon: Gamepad2,
      status: 'busy',
      currentTask: 'Đang sửa lỗi Crash mất save màn 3 trên Steam do người chơi báo cáo',
      metrics: '4 Bản build/tháng • 100% Automated CI',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'staff_cfo',
      roleTitle: 'AI CFO & Growth Specialist',
      department: 'Monetization & Cash Radar',
      agentName: 'Agent Finance-03',
      avatarIcon: CircleDollarSign,
      status: 'active',
      currentTask: 'Đã tổng hợp 87.9 triệu ₫ doanh thu 24h & tính toán trích 25% tái đầu tư AI',
      metrics: '4 Nguồn dòng tiền • Auto Reinvestment',
      color: 'from-amber-500 to-emerald-600',
    },
    {
      id: 'staff_ops',
      roleTitle: 'AI Operations & RPA Daemon',
      department: 'System Governance',
      agentName: 'Agent Daemon-04',
      avatarIcon: Cpu,
      status: 'idle',
      currentTask: 'Đang trực kiểm tra sức khỏe hệ thống & Circuit Breaker',
      metrics: '99.9% Uptime • Zero-downtime Fallback',
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  const handleSendTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || !selectedAgent) return;

    setDispatchStatus(`Đã giao nhiệm vụ cho ${selectedAgent.roleTitle}: "${promptInput}"`);
    setPromptInput('');
    setTimeout(() => setDispatchStatus(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-950/40 via-slate-900 to-slate-900 p-5 rounded-2xl border border-violet-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Sơ đồ Tổ chức Đội ngũ AI Staff (Visual Org Chart)
              <Badge variant="purple">1 Founder + 4 AI Staff</Badge>
            </h2>
            <p className="text-xs text-slate-400">
              Quản lý và giao việc cho dàn nhân sự AI tự vận hành công ty số 1 người của bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Org Chart Tree Structure */}
      <div className="space-y-6">
        {/* Top Node: Founder */}
        <div className="flex justify-center">
          <Card className="p-4 bg-gradient-to-br from-indigo-900/90 to-slate-900 border-indigo-500/40 shadow-xl max-w-sm w-full text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto mb-2 font-bold text-sm">
              👑
            </div>
            <h3 className="text-sm font-black text-white">Giám đốc (Solo Founder)</h3>
            <span className="text-[10px] text-indigo-300 font-semibold uppercase tracking-widest block">Executive Management</span>
            <p className="text-[11px] text-slate-400 mt-1">Ra quyết định chiến lược, duyệt kịch bản & sản phẩm</p>
          </Card>
        </div>

        {/* Connecting Connector Arrow */}
        <div className="flex justify-center -my-3">
          <ArrowDown className="w-6 h-6 text-indigo-500 animate-bounce" />
        </div>

        {/* AI Staff Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {staffList.map((staff) => {
            const Icon = staff.avatarIcon;
            const isSelected = selectedAgent?.id === staff.id;
            return (
              <Card
                key={staff.id}
                onClick={() => setSelectedAgent(staff)}
                className={`p-4 bg-slate-900/90 border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${staff.color} flex items-center justify-center text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{staff.roleTitle}</h4>
                      <span className="text-[10px] text-slate-400 block">{staff.agentName}</span>
                    </div>
                  </div>
                  <Badge variant={staff.status === 'active' ? 'success' : staff.status === 'busy' ? 'warning' : 'default'} className="text-[9px]">
                    {staff.status === 'active' ? '🟢 Active' : staff.status === 'busy' ? '🟡 Busy' : '⚪ Idle'}
                  </Badge>
                </div>

                <div className="mt-2.5 space-y-1.5">
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    <strong className="text-slate-400">Đang làm:</strong> {staff.currentTask}
                  </p>
                  <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded block font-mono">
                    📊 {staff.metrics}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Task Dispatch Box for Selected Agent */}
      {selectedAgent && (
        <Card className="p-4 bg-slate-900 border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              Giao Lệnh Trực tiếp cho {selectedAgent.roleTitle} ({selectedAgent.agentName})
            </h4>
            <span className="text-[10px] text-slate-400">Nhấn chọn nhân sự khác để đổi target</span>
          </div>

          <form onSubmit={handleSendTask} className="flex gap-2">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={`VD: ${selectedAgent.id === 'staff_media' ? 'Tạo kịch bản TikTok 15s cho Bàn phím Ergonomic...' : 'Kiểm tra log server và reset cache...'}`}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4">
              Giao việc
            </Button>
          </form>

          {dispatchStatus && (
            <p className="text-xs text-emerald-400 font-semibold animate-pulse">✓ {dispatchStatus}</p>
          )}
        </Card>
      )}
    </div>
  );
}

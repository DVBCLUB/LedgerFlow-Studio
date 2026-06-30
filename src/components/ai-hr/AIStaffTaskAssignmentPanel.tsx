import React, { useState } from 'react';
import { Bot, UserCheck, Play, Eye, FileText, AlertTriangle, ShieldCheck, CheckSquare, FileDown } from 'lucide-react';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left ${className}`}>{children}</div>
);

interface AITask {
  id: string;
  agentName: string;
  agentRole: string;
  avatarEmoji: string;
  assignedTask: string;
  inputContext: string;
  outputArtifact: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'Idle' | 'Executing' | 'Waiting Approval' | 'Blocked' | 'Completed';
  nextAction: string;
  reviewChecklist: string[];
}

export default function AIStaffTaskAssignmentPanel() {
  const [tasks, setTasks] = useState<AITask[]>([
    {
      id: 'AI-TSK-401',
      agentName: 'ClawCoder-01',
      agentRole: 'AI Software Engineer',
      avatarEmoji: '🤖',
      assignedTask: 'Implement offline database sync backup check logic',
      inputContext: 'scripts/check-offline-readiness.mjs, package.json',
      outputArtifact: 'dist/offline-sync-backup.cjs',
      riskLevel: 'Medium',
      status: 'Waiting Approval',
      nextAction: 'Duyệt code & run dry-run',
      reviewChecklist: [
        'Không leak secrets trong code',
        'Xử lý tốt khoảng trắng đường dẫn Windows',
        'Đã vượt qua bài test smoke local'
      ]
    },
    {
      id: 'AI-TSK-402',
      agentName: 'ClawCFO-02',
      agentRole: 'AI Financial Accountant',
      avatarEmoji: '📊',
      assignedTask: 'Generate runway analysis and monthly cashflow forecasting',
      inputContext: 'revenue_records dataset, current reserves',
      outputArtifact: 'reports/runway_q2_forecasting.pdf',
      riskLevel: 'Low',
      status: 'Completed',
      nextAction: 'Xuất báo cáo PDF',
      reviewChecklist: [
        'Đối chiếu khớp số dư thực tế tại ngân hàng',
        'Cập nhật tỷ lệ Churn thực tế tháng gần nhất'
      ]
    },
    {
      id: 'AI-TSK-403',
      agentName: 'ClawMarketer-03',
      agentRole: 'AI Growth Strategist',
      avatarEmoji: '📣',
      assignedTask: 'Generate landing page headline and Facebook ad copy options',
      inputContext: 'product idea moats, customer pain points',
      outputArtifact: 'campaigns/launch_copy_draft.md',
      riskLevel: 'Low',
      status: 'Executing',
      nextAction: 'Giám sát tiến trình sinh bài',
      reviewChecklist: [
        'Đúng định vị phân khúc SaaS doanh nghiệp',
        'Không dùng từ khóa quảng cáo bị cấm'
      ]
    },
    {
      id: 'AI-TSK-404',
      agentName: 'ClawSecurity-04',
      agentRole: 'AI Safety Inspector',
      avatarEmoji: '🛡️',
      assignedTask: 'Audit local filesystem write actions and dynamic imports',
      inputContext: 'src/modules/dev-ops/PRControlCenter.tsx',
      outputArtifact: 'security/dependency_audit_report.json',
      riskLevel: 'High',
      status: 'Blocked',
      nextAction: 'Yêu cầu Founder phê duyệt quyền ghi đè',
      reviewChecklist: [
        'Xác minh nguồn gốc file package npm',
        'Kiểm tra chứng thư số và chữ ký mã hóa'
      ]
    }
  ]);

  const [selectedTask, setSelectedTask] = useState<AITask | null>(tasks[0]);

  const getStatusStyle = (status: AITask['status']) => {
    const styles: Record<AITask['status'], string> = {
      'Idle': 'bg-slate-800 text-slate-400',
      'Executing': 'bg-blue-500/15 text-blue-300 border border-blue-500/20 animate-pulse',
      'Waiting Approval': 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
      'Blocked': 'bg-rose-500/15 text-rose-300 border border-rose-500/20',
      'Completed': 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
    };
    return styles[status] || 'bg-slate-800 text-slate-350';
  };

  const getRiskStyle = (risk: AITask['riskLevel']) => {
    const styles: Record<AITask['riskLevel'], string> = {
      'Low': 'text-emerald-400',
      'Medium': 'text-amber-400',
      'High': 'text-rose-400 font-extrabold'
    };
    return styles[risk] || 'text-slate-300';
  };

  const handleTaskAction = (id: string, newStatus: AITask['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <Bot className="h-5 w-5 text-violet-400" />
        <h2 className="text-sm font-black text-white uppercase tracking-wider">AI Staff Directory & Task Assignment</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Tasks list */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 text-left">Nhiệm vụ phân công (AI Task Board)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-semibold text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="py-2">Nhân sự / Vai trò</th>
                  <th className="py-2">Nhiệm vụ phân công</th>
                  <th className="py-2 text-center">Rủi ro</th>
                  <th className="py-2 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr 
                    key={task.id} 
                    onClick={() => setSelectedTask(task)}
                    className={`border-b border-slate-850 hover:bg-slate-800/30 cursor-pointer transition ${
                      selectedTask?.id === task.id ? 'bg-slate-800/40 border-l-2 border-violet-500 pl-2' : ''
                    }`}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{task.avatarEmoji}</span>
                        <div>
                          <strong className="text-slate-200 block">{task.agentName}</strong>
                          <span className="text-[10px] text-slate-500 font-normal">{task.agentRole}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 max-w-[200px] truncate">{task.assignedTask}</td>
                    <td className={`py-3 text-center ${getRiskStyle(task.riskLevel)}`}>{task.riskLevel}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${getStatusStyle(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Task details & Controls */}
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-left">
          {selectedTask ? (
            <div className="space-y-4">
              <div className="border-b border-slate-850 pb-2">
                <span className="text-[9px] font-black uppercase text-violet-400">{selectedTask.id}</span>
                <h3 className="text-xs font-black text-white">{selectedTask.agentName} ({selectedTask.agentRole})</h3>
              </div>

              {/* Task Details */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Nhiệm vụ đang chạy:</span>
                  <span className="text-slate-300 font-semibold">{selectedTask.assignedTask}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Dữ liệu đầu vào (Input Context):</span>
                  <span className="text-slate-400 font-mono block p-1.5 bg-slate-950 rounded border border-slate-850 text-[10px] truncate">{selectedTask.inputContext}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Sản phẩm đầu ra (Output Artifact):</span>
                  <span className="text-slate-400 font-mono block p-1.5 bg-slate-950 rounded border border-slate-850 text-[10px] truncate">{selectedTask.outputArtifact}</span>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <CheckSquare className="h-3.5 w-3.5" /> Checklist đánh giá chất lượng
                </span>
                <ul className="space-y-1.5 text-[11px] font-semibold text-slate-400">
                  {selectedTask.reviewChecklist.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-850 pt-3 space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-500 block">Hành động tiếp theo:</span>
                
                {selectedTask.status === 'Waiting Approval' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTaskAction(selectedTask.id, 'Completed')}
                      className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-emerald-600 active:scale-95 transition"
                    >
                      Phê duyệt & chạy
                    </button>
                    <button
                      onClick={() => handleTaskAction(selectedTask.id, 'Blocked')}
                      className="flex-1 rounded-xl bg-rose-500/10 border border-rose-500/25 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-rose-300 hover:bg-rose-500/20 active:scale-95 transition"
                    >
                      Từ chối
                    </button>
                  </div>
                )}

                {selectedTask.status === 'Completed' && (
                  <button
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-cyan-600 active:scale-95 transition"
                  >
                    <FileDown className="h-3.5 w-3.5" /> Tải về Artifact
                  </button>
                )}

                {selectedTask.status === 'Executing' && (
                  <button
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:bg-slate-700"
                    disabled
                  >
                    Đang đồng bộ hóa Daemon...
                  </button>
                )}

                {selectedTask.status === 'Blocked' && (
                  <button
                    onClick={() => handleTaskAction(selectedTask.id, 'Waiting Approval')}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-950 hover:bg-amber-600 active:scale-95 transition"
                  >
                    Mở lại và duyệt lại
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center">Chọn một nhiệm vụ từ danh sách để xem chi tiết chẩn đoán.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

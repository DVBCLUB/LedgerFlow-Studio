import React, { useState, useEffect } from 'react';
import { Plus, ListTodo, PlayCircle, Eye, CheckCircle2, Bot, Loader2, RefreshCw } from 'lucide-react';
import LocalOfficePanel from './LocalOfficePanel';

interface AITask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  assignee: string;
  createdAt: string;
}

export default function AIWorkforceTaskBoard() {
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('AI Assistant');

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-tasks').then(r => r.json());
      if (res.success) setTasks(res.tasks);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/ai-tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc, assignee: newAssignee })
      }).then(r => r.json());

      if (res.success) {
        setTasks([...tasks, res.task]);
        setNewTitle('');
        setNewDesc('');
        setIsAdding(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/ai-tasks/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus })
      }).then(r => r.json());

      if (res.success) {
        setTasks(tasks.map(t => t.id === taskId ? res.task : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { id: 'todo', title: 'Cần làm (To Do)', icon: ListTodo, color: 'text-slate-300' },
    { id: 'in_progress', title: 'Đang xử lý (In Progress)', icon: PlayCircle, color: 'text-cyan-300' },
    { id: 'review', title: 'Chờ duyệt (Review)', icon: Eye, color: 'text-amber-300' },
    { id: 'done', title: 'Hoàn thành (Done)', icon: CheckCircle2, color: 'text-emerald-300' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="h-6 w-6 text-violet-400" /> Bảng Công Việc Đội Ngũ AI
          </h2>
          <p className="text-xs text-slate-400 mt-1">Quản trị các công việc tự động hóa được giao cho AI Agents</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTasks} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
          >
            <Plus className="h-4 w-4" /> Giao việc cho AI
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleCreateTask} className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Thêm nhiệm vụ mới</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Tên công việc</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-violet-500" placeholder="VD: Quét dữ liệu khách hàng..." />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nhân sự phụ trách</label>
              <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)} className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-violet-500">
                <option value="AI Assistant">AI Assistant (Đa năng)</option>
                <option value="AI Designer">AI Designer (Thiết kế)</option>
                <option value="AI Marketer">AI Marketer (Truyền thông)</option>
                <option value="AI CFO">AI CFO (Tài chính)</option>
                <option value="AI Dev">AI Developer (Lập trình)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Mô tả (Prompt)</label>
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-violet-500" placeholder="Chi tiết yêu cầu cho đệ tử AI..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800">Hủy</button>
            <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-500">Tạo nhiệm vụ</button>
          </div>
        </form>
      )}

      {isLoading && tasks.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin mb-2" /> Đang tải dữ liệu...
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
          {columns.map(col => (
            <div key={col.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${col.color}`}>
                  <col.icon className="h-4 w-4" /> {col.title}
                </h3>
                <span className="text-[10px] font-bold bg-slate-900 px-2 py-0.5 rounded-full text-slate-400">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              
              <div className="space-y-3">
                {tasks.filter(t => t.status === col.id).map(task => (
                  <div key={task.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-lg hover:border-violet-500/50 transition-colors cursor-pointer group relative">
                    <p className="text-xs font-bold text-white mb-1 line-clamp-2">{task.title}</p>
                    {task.description && <p className="text-[10px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">{task.description}</p>}
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-violet-300 bg-violet-950/50 px-2 py-1 rounded-md">
                        <Bot className="h-3 w-3" /> {task.assignee}
                      </div>
                      
                      {/* Action buttons (Simulated Drag & Drop by clicking next state) */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {col.id === 'todo' && <button onClick={() => handleUpdateStatus(task.id, 'in_progress')} className="p-1 rounded bg-cyan-950 text-cyan-400 hover:bg-cyan-900"><PlayCircle className="h-3 w-3" /></button>}
                        {col.id === 'in_progress' && <button onClick={() => handleUpdateStatus(task.id, 'review')} className="p-1 rounded bg-amber-950 text-amber-400 hover:bg-amber-900"><Eye className="h-3 w-3" /></button>}
                        {col.id === 'review' && <button onClick={() => handleUpdateStatus(task.id, 'done')} className="p-1 rounded bg-emerald-950 text-emerald-400 hover:bg-emerald-900"><CheckCircle2 className="h-3 w-3" /></button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kỹ năng Thao tác File Cục bộ (Local Office) */}
      <LocalOfficePanel />
    </div>
  );
}

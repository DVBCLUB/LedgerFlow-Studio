import React, { useMemo, useState } from 'react';

type StaffTask = {
  id: string;
  aiStaff: string;
  role: string;
  task: string;
  input: string;
  expectedOutput: string;
  acceptanceCriteria: string;
  deadline: string;
  status: 'Backlog' | 'Assigned' | 'In Review' | 'Approved' | 'Rejected';
  founderReview: string;
};

const STORAGE_KEY = 'ledgerflow-ai-staff-assignment-v1';

const defaultTasks: StaffTask[] = [
  {
    id: 'ai-staff-001',
    aiStaff: 'ChatGPT',
    role: 'PM / Architect / QA',
    task: 'Rà soát backlog và chia task nhỏ theo thứ tự ưu tiên',
    input: 'CT1, repo hiện tại, danh sách module trong Founder Labs',
    expectedOutput: 'Backlog P0/P1/P2 có tiêu chí nghiệm thu rõ ràng',
    acceptanceCriteria: 'Không đề xuất build lan man; mỗi task có lý do, rủi ro và next step',
    deadline: new Date().toISOString().slice(0, 10),
    status: 'Assigned',
    founderReview: 'Founder duyệt thứ tự trước khi code.'
  },
  {
    id: 'ai-staff-002',
    aiStaff: 'Claude',
    role: 'Code refactor / document writer',
    task: 'Đề xuất tách component lớn thành module nhỏ an toàn',
    input: 'AccountingVietnam.tsx và danh sách công thức cần bảo vệ',
    expectedOutput: 'Kế hoạch refactor từng bước, không đổi UI/công thức',
    acceptanceCriteria: 'Có migration plan, rollback plan và smoke test',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    status: 'Backlog',
    founderReview: 'Chỉ làm sau khi mô hình đã có smoke test.'
  },
  {
    id: 'ai-staff-003',
    aiStaff: 'Gemini',
    role: 'UI / Google ecosystem / spreadsheet bridge',
    task: 'Thiết kế mockup Strategic Labs và báo cáo một trang',
    input: 'Founder Labs Dock, One-Page Report, Monthly Review',
    expectedOutput: 'Đề xuất layout UI rõ, gọn, ít chữ, không lặp CT1 trên giao diện',
    acceptanceCriteria: 'Không đổi data model; chỉ đề xuất giao diện và flow',
    deadline: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    status: 'Backlog',
    founderReview: 'Founder chọn layout trước khi implement.'
  },
  {
    id: 'ai-staff-004',
    aiStaff: 'Copilot / Codex',
    role: 'Implementation engineer',
    task: 'Implement task nhỏ đã được founder duyệt',
    input: 'Issue/task có acceptance criteria và file cần sửa',
    expectedOutput: 'Commit nhỏ, dễ review, không sửa ngoài phạm vi',
    acceptanceCriteria: 'Build pass, không phá localStorage key, không đụng công thức nếu không được duyệt',
    deadline: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
    status: 'Backlog',
    founderReview: 'Founder review diff trước khi merge.'
  }
];

const loadTasks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : defaultTasks;
    return Array.isArray(parsed) ? parsed : defaultTasks;
  } catch {
    return defaultTasks;
  }
};

const saveTasks = (tasks: StaffTask[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

export default function AIStaffAssignmentBoard() {
  const [tasks, setTasks] = useState<StaffTask[]>(loadTasks);
  const [form, setForm] = useState<Omit<StaffTask, 'id'>>({
    aiStaff: 'ChatGPT',
    role: 'PM / Architect / QA',
    task: '',
    input: '',
    expectedOutput: '',
    acceptanceCriteria: '',
    deadline: new Date().toISOString().slice(0, 10),
    status: 'Backlog',
    founderReview: ''
  });

  const stats = useMemo(() => {
    const assigned = tasks.filter((task) => task.status === 'Assigned').length;
    const inReview = tasks.filter((task) => task.status === 'In Review').length;
    const approved = tasks.filter((task) => task.status === 'Approved').length;
    const rejected = tasks.filter((task) => task.status === 'Rejected').length;
    return { assigned, inReview, approved, rejected };
  }, [tasks]);

  const persist = (next: StaffTask[]) => {
    setTasks(next);
    saveTasks(next);
  };

  const addTask = () => {
    if (!form.task.trim()) return;
    persist([{ ...form, id: `ai-staff-${Date.now()}` }, ...tasks]);
    setForm({ ...form, task: '', input: '', expectedOutput: '', acceptanceCriteria: '', founderReview: '', status: 'Backlog' });
  };

  const updateStatus = (id: string, status: StaffTask['status']) => {
    persist(tasks.map((task) => task.id === id ? { ...task, status } : task));
  };

  const removeTask = (id: string) => persist(tasks.filter((task) => task.id !== id));
  const resetDemo = () => persist(defaultTasks);

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">AI Staff Board</p>
        <h2 className="mt-2 text-xl font-black text-white">Bảng phân công nhân viên AI</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Biến ChatGPT, Claude, Gemini, Copilot/Codex thành nhân viên ảo có vai trò, input, output, tiêu chí nghiệm thu và founder review rõ ràng.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Assigned</p><p className="mt-2 text-3xl font-black text-white">{stats.assigned}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">In Review</p><p className="mt-2 text-3xl font-black text-white">{stats.inReview}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Approved</p><p className="mt-2 text-3xl font-black text-white">{stats.approved}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Rejected</p><p className="mt-2 text-3xl font-black text-white">{stats.rejected}</p></div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-sm font-black text-white">Giao việc mới</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select value={form.aiStaff} onChange={(e) => setForm({ ...form, aiStaff: e.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-white">
            {['ChatGPT', 'Claude', 'Gemini', 'Copilot / Codex', 'Other AI'].map((name) => <option key={name}>{name}</option>)}
          </select>
          <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-white" placeholder="Vai trò" />
          <input value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-white md:col-span-2" placeholder="Việc cần giao" />
          <textarea value={form.input} onChange={(e) => setForm({ ...form, input: e.target.value })} className="min-h-[80px] rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-white" placeholder="Input / tài liệu / file cần đọc" />
          <textarea value={form.expectedOutput} onChange={(e) => setForm({ ...form, expectedOutput: e.target.value })} className="min-h-[80px] rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-white" placeholder="Output mong muốn" />
          <textarea value={form.acceptanceCriteria} onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })} className="min-h-[80px] rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-white" placeholder="Tiêu chí nghiệm thu" />
          <textarea value={form.founderReview} onChange={(e) => setForm({ ...form, founderReview: e.target.value })} className="min-h-[80px] rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-white" placeholder="Founder review / lưu ý" />
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-white" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StaffTask['status'] })} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-white">
            {['Backlog', 'Assigned', 'In Review', 'Approved', 'Rejected'].map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={addTask} className="rounded-xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950">Thêm việc</button>
          <button onClick={resetDemo} className="rounded-xl border border-slate-700 px-4 py-3 text-xs font-black text-slate-300">Reset demo</button>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-300">{task.aiStaff} • {task.role}</p>
                <h3 className="mt-1 text-sm font-black text-white">{task.task}</h3>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Input: {task.input}</p>
                <p className="text-xs font-semibold leading-6 text-slate-400">Output: {task.expectedOutput}</p>
                <p className="text-xs font-semibold leading-6 text-amber-200">Nghiệm thu: {task.acceptanceCriteria}</p>
                <p className="text-xs font-semibold leading-6 text-slate-400">Founder review: {task.founderReview || 'Chưa ghi'}</p>
              </div>
              <div className="min-w-[11rem] space-y-2">
                <p className="rounded-full border border-slate-700 px-3 py-1 text-center text-[10px] font-black text-slate-300">Deadline {task.deadline}</p>
                <select value={task.status} onChange={(e) => updateStatus(task.id, e.target.value as StaffTask['status'])} className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-bold text-white">
                  {['Backlog', 'Assigned', 'In Review', 'Approved', 'Rejected'].map((status) => <option key={status}>{status}</option>)}
                </select>
                <button onClick={() => removeTask(task.id)} className="w-full rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-black text-rose-300">Xóa</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

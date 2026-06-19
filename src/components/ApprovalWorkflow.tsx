import React, { useState, useCallback } from 'react';
import {
  FileText, CheckCircle2, XCircle, Clock, Send, Plus, Trash2,
  ChevronRight, User, Calendar, DollarSign, Filter, Download,
  AlertTriangle, RefreshCw, Archive, CreditCard, Receipt
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ApprovalStatus = 'draft' | 'submitted' | 'checked' | 'approved' | 'paid' | 'settled' | 'archived';
type VoucherType = 'payment' | 'advance' | 'settlement' | 'purchase' | 'expense' | 'other';

interface ApprovalComment {
  id: string;
  actor: string;
  action: string;
  note: string;
  timestamp: string;
  status: ApprovalStatus;
}

interface ApprovalRecord {
  id: string;
  code: string;
  type: VoucherType;
  title: string;
  amount: number;
  currency: 'VND' | 'USD';
  status: ApprovalStatus;
  requestedBy: string;
  department: string;
  description: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  comments: ApprovalComment[];
  tags: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft:     { label: 'Nháp',         color: 'text-slate-400', bg: 'bg-slate-800',     icon: FileText },
  submitted: { label: 'Đã trình',     color: 'text-blue-400',  bg: 'bg-blue-900/30',   icon: Send },
  checked:   { label: 'Đã kiểm tra',  color: 'text-amber-400', bg: 'bg-amber-900/30',  icon: Clock },
  approved:  { label: 'Đã duyệt',     color: 'text-emerald-400', bg: 'bg-emerald-900/30', icon: CheckCircle2 },
  paid:      { label: 'Đã thanh toán', color: 'text-violet-400', bg: 'bg-violet-900/30', icon: CreditCard },
  settled:   { label: 'Đã quyết toán', color: 'text-cyan-400', bg: 'bg-cyan-900/30',   icon: Receipt },
  archived:  { label: 'Lưu trữ',      color: 'text-slate-500', bg: 'bg-slate-900/30',  icon: Archive },
};

const VOUCHER_TYPES: { value: VoucherType; label: string }[] = [
  { value: 'payment',    label: 'Đề nghị thanh toán' },
  { value: 'advance',    label: 'Tạm ứng' },
  { value: 'settlement', label: 'Quyết toán tạm ứng' },
  { value: 'purchase',   label: 'Đề nghị mua hàng' },
  { value: 'expense',    label: 'Hoàn ứng chi phí' },
  { value: 'other',      label: 'Khác' },
];

const STATUS_FLOW: Partial<Record<ApprovalStatus, ApprovalStatus>> = {
  draft:     'submitted',
  submitted: 'checked',
  checked:   'approved',
  approved:  'paid',
  paid:      'settled',
  settled:   'archived',
};

const NEXT_ACTION_LABEL: Partial<Record<ApprovalStatus, string>> = {
  draft:     'Trình Duyệt',
  submitted: 'Đánh Dấu Đã Kiểm',
  checked:   'Phê Duyệt',
  approved:  'Xác Nhận Thanh Toán',
  paid:      'Quyết Toán',
  settled:   'Lưu Trữ',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'lf_approval_records';

function loadRecords(): ApprovalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRecords(records: ApprovalRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function genId() { return `APR-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }
function genCode(type: VoucherType) {
  const prefix: Record<VoucherType, string> = { payment: 'PT', advance: 'TU', settlement: 'QT', purchase: 'MH', expense: 'HU', other: 'CT' };
  return `${prefix[type]}-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
}
function fmtVND(n: number) { return n.toLocaleString('vi-VN') + ' ₫'; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }); }
function fmtDateTime(iso: string) { return new Date(iso).toLocaleString('vi-VN'); }

// ─── Components ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ApprovalStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color} border border-current/20`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function StatusTimeline({ comments }: { comments: ApprovalComment[] }) {
  return (
    <div className="space-y-2 mt-3">
      {comments.map((c, i) => (
        <div key={c.id} className="flex gap-3 text-xs">
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <div className={`w-2.5 h-2.5 rounded-full border-2 ${i === comments.length - 1 ? 'border-purple-500 bg-purple-500' : 'border-slate-700 bg-slate-800'}`} />
            {i < comments.length - 1 && <div className="w-0.5 h-4 bg-slate-800" />}
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">{c.actor}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-500">{c.action}</span>
              <StatusBadge status={c.status} />
            </div>
            {c.note && <p className="text-slate-500 mt-0.5 italic">"{c.note}"</p>}
            <span className="text-[10px] text-slate-600">{fmtDateTime(c.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ApprovalWorkflow() {
  const [records, setRecords] = useState<ApprovalRecord[]>(loadRecords);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [actorInput, setActorInput] = useState(() => localStorage.getItem('lf_actor_name') || 'Kế toán viên');

  // Form state
  const [form, setForm] = useState({
    type: 'payment' as VoucherType,
    title: '',
    amount: '',
    department: '',
    description: '',
    dueDate: new Date(Date.now() + 7*86400000).toISOString().split('T')[0],
    tags: '',
  });

  const persist = useCallback((next: ApprovalRecord[]) => {
    setRecords(next);
    saveRecords(next);
  }, []);

  const handleCreate = () => {
    if (!form.title.trim() || !form.amount.trim()) {
      alert('Vui lòng nhập tiêu đề và số tiền!');
      return;
    }
    const now = new Date().toISOString();
    const rec: ApprovalRecord = {
      id: genId(),
      code: genCode(form.type),
      type: form.type,
      title: form.title.trim(),
      amount: parseFloat(form.amount.replace(/[^0-9.]/g, '')) || 0,
      currency: 'VND',
      status: 'draft',
      requestedBy: actorInput,
      department: form.department.trim() || 'Chưa phân loại',
      description: form.description.trim(),
      dueDate: form.dueDate,
      createdAt: now,
      updatedAt: now,
      comments: [{ id: genId(), actor: actorInput, action: 'Tạo chứng từ', note: form.description.trim(), timestamp: now, status: 'draft' }],
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    persist([rec, ...records]);
    setShowForm(false);
    setForm({ type: 'payment', title: '', amount: '', department: '', description: '', dueDate: new Date(Date.now()+7*86400000).toISOString().split('T')[0], tags: '' });
    setSelectedId(rec.id);
  };

  const handleAdvance = (rec: ApprovalRecord) => {
    const nextStatus = STATUS_FLOW[rec.status];
    if (!nextStatus) return;
    const now = new Date().toISOString();
    const comment: ApprovalComment = {
      id: genId(),
      actor: actorInput,
      action: NEXT_ACTION_LABEL[rec.status] ?? 'Cập nhật',
      note: noteInput.trim(),
      timestamp: now,
      status: nextStatus,
    };
    const updated = { ...rec, status: nextStatus, updatedAt: now, comments: [...rec.comments, comment] };
    persist(records.map(r => r.id === rec.id ? updated : r));
    setNoteInput('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa chứng từ này?')) return;
    persist(records.filter(r => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleExport = () => {
    const filtered = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus);
    const csv = [
      ['Mã CT', 'Loại', 'Tiêu đề', 'Số tiền', 'Trạng thái', 'Người lập', 'Phòng ban', 'Hạn', 'Ngày tạo'],
      ...filtered.map(r => [r.code, VOUCHER_TYPES.find(v=>v.value===r.type)?.label, r.title, r.amount, STATUS_CONFIG[r.status].label, r.requestedBy, r.department, r.dueDate, fmtDate(r.createdAt)])
    ].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `phê-duyệt-${Date.now()}.csv` });
    a.click();
  };

  const filtered = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus);
  const selected = records.find(r => r.id === selectedId) ?? null;

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s as ApprovalStatus] = records.filter(r => r.status === s).length;
    return acc;
  }, {} as Record<ApprovalStatus, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-950/30 to-amber-950/20 border border-orange-900/30 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest font-mono">ERP Approval Engine v1</span>
            </div>
            <h2 className="text-xl font-black text-white">Phê Duyệt Chứng Từ</h2>
            <p className="text-slate-400 text-xs mt-1">Luồng phê duyệt: <span className="text-white font-bold">Nháp → Trình duyệt → Kiểm tra → Duyệt → Thanh toán → Quyết toán → Lưu trữ</span></p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={actorInput}
              onChange={e => { setActorInput(e.target.value); localStorage.setItem('lf_actor_name', e.target.value); }}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none w-40"
              placeholder="Tên người dùng..."
            />
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Xuất CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-black text-white transition-all cursor-pointer shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo Chứng Từ
            </button>
          </div>
        </div>

        {/* Status summary bar */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-5">
          {(Object.keys(STATUS_CONFIG) as ApprovalStatus[]).map(s => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${filterStatus === s ? `${cfg.bg} border-current/30 ${cfg.color}` : 'bg-slate-900/30 border-slate-800 text-slate-500 hover:border-slate-700'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[11px] font-black">{counts[s]}</span>
                <span className="text-[8px] font-bold uppercase tracking-wide leading-tight text-center">{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center px-4">
          <div className="bg-[#0c1220] border border-orange-900/40 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-400" /> Tạo Chứng Từ Mới
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Loại chứng từ</label>
                  <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as VoucherType}))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none">
                    {VOUCHER_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Số tiền (VND)</label>
                  <input value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="5,000,000" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-orange-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Tiêu đề chứng từ *</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="VD: Thanh toán phần mềm Adobe Creative Cloud tháng 6/2026" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Phòng ban</label>
                  <input value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} placeholder="Product Studio" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Hạn xử lý</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Mô tả / Lý do</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} placeholder="Mô tả ngắn gọn mục đích thanh toán..." className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none resize-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Tags (phân cách bằng dấu phẩy)</label>
                <input value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="opex, công cụ, marketing" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 cursor-pointer">Huỷ</button>
              <button onClick={handleCreate} className="px-5 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-black text-white cursor-pointer shadow-lg shadow-orange-500/20">Tạo Chứng Từ</button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Records list */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">
              {filtered.length} chứng từ {filterStatus !== 'all' ? `· ${STATUS_CONFIG[filterStatus as ApprovalStatus]?.label}` : ''}
            </span>
            {filterStatus !== 'all' && (
              <button onClick={() => setFilterStatus('all')} className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1 cursor-pointer">
                <Filter className="w-3 h-3" /> Xoá lọc
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-10 text-center">
              <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-medium">Chưa có chứng từ nào</p>
              <p className="text-slate-600 text-xs mt-1">Nhấn "Tạo Chứng Từ" để bắt đầu</p>
            </div>
          ) : (
            filtered.map(rec => (
              <button
                key={rec.id}
                onClick={() => setSelectedId(selectedId === rec.id ? null : rec.id)}
                className={`w-full text-left bg-slate-950/40 border rounded-xl p-3.5 transition-all cursor-pointer space-y-2 ${selectedId === rec.id ? 'border-orange-700/50 bg-orange-950/10' : 'border-slate-800/60 hover:border-slate-700'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black text-slate-500 font-mono">{rec.code}</span>
                      <StatusBadge status={rec.status} />
                    </div>
                    <p className="text-xs font-bold text-slate-200 truncate">{rec.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{rec.department} · {rec.requestedBy}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-orange-400">{fmtVND(rec.amount)}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">Hạn: {fmtDate(rec.dueDate)}</p>
                  </div>
                </div>
                {rec.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {rec.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center gap-3">
              <ChevronRight className="w-10 h-10 text-slate-700" />
              <p className="text-slate-500 text-sm font-medium">Chọn một chứng từ để xem chi tiết</p>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-orange-900/30 rounded-2xl p-5 space-y-4">
              {/* Detail header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-orange-400 font-mono">{selected.code}</span>
                    <span className="text-[9px] text-slate-600">·</span>
                    <span className="text-[9px] text-slate-500">{VOUCHER_TYPES.find(v=>v.value===selected.type)?.label}</span>
                  </div>
                  <h3 className="text-sm font-black text-white">{selected.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{selected.description || 'Không có mô tả'}</p>
                </div>
                <button onClick={() => handleDelete(selected.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/30 rounded-xl p-3.5">
                {[
                  { icon: DollarSign, label: 'Số tiền', value: fmtVND(selected.amount), color: 'text-orange-400' },
                  { icon: User,       label: 'Người lập', value: selected.requestedBy, color: 'text-slate-300' },
                  { icon: Calendar,   label: 'Ngày tạo', value: fmtDate(selected.createdAt), color: 'text-slate-300' },
                  { icon: Calendar,   label: 'Hạn xử lý', value: fmtDate(selected.dueDate), color: new Date(selected.dueDate) < new Date() && selected.status !== 'archived' ? 'text-rose-400' : 'text-slate-300' },
                ].map(({icon: Icon, label, value, color}) => (
                  <div key={label}>
                    <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5 flex items-center gap-1"><Icon className="w-3 h-3" />{label}</p>
                    <p className={`text-xs font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Status badge large */}
              <div className={`flex items-center justify-between p-3 rounded-xl border ${STATUS_CONFIG[selected.status].bg} border-current/20`}>
                <div className="flex items-center gap-2">
                  {React.createElement(STATUS_CONFIG[selected.status].icon, { className: `w-5 h-5 ${STATUS_CONFIG[selected.status].color}` })}
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Trạng thái hiện tại</p>
                    <p className={`text-sm font-black ${STATUS_CONFIG[selected.status].color}`}>{STATUS_CONFIG[selected.status].label}</p>
                  </div>
                </div>
                {STATUS_FLOW[selected.status] && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span>→ Tiếp theo:</span>
                    <StatusBadge status={STATUS_FLOW[selected.status]!} />
                  </div>
                )}
              </div>

              {/* Action */}
              {STATUS_FLOW[selected.status] && (
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Ghi chú hành động (tuỳ chọn)</label>
                  <div className="flex gap-2">
                    <input
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      placeholder="Nhập ghi chú, lý do duyệt/từ chối..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={() => handleAdvance(selected)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-black text-white cursor-pointer shadow-lg shadow-orange-500/20 whitespace-nowrap transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {NEXT_ACTION_LABEL[selected.status]}
                    </button>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {selected.comments.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Lịch Sử Phê Duyệt</p>
                  <StatusTimeline comments={selected.comments} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pending alerts */}
      {records.filter(r => r.status === 'submitted' || r.status === 'checked').length > 0 && (
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3.5 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300 font-medium">
            Có <strong>{records.filter(r => r.status === 'submitted' || r.status === 'checked').length} chứng từ</strong> đang chờ phê duyệt.
            Nhấn vào chứng từ để xem chi tiết và xử lý.
          </p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import {
  MEMORY_TYPES,
  deactivateMemory,
  getCompanyMemoryStatus,
  readRecentMemory,
  writeMemory,
  type Importance,
  type MemoryItem,
  type MemoryType
} from '../../../utils/companyMemory';

const IMPORTANCE_OPTIONS: Importance[] = ['low', 'normal', 'high', 'critical'];

const IMPORTANCE_COLOR: Record<Importance, string> = {
  critical: 'border-rose-400/40 bg-rose-400/10 text-rose-100',
  high: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
  normal: 'border-cyan-400/25 bg-slate-900/70 text-slate-200',
  low: 'border-slate-700 bg-slate-950/70 text-slate-400'
};

const TYPE_LABEL: Record<MemoryType, string> = {
  decision: 'Quyết định',
  context: 'Bối cảnh',
  agent_output: 'Output agent',
  product_update: 'Sản phẩm',
  market_intel: 'Thị trường',
  customer: 'Khách hàng',
  blocker: 'Blocker',
  learning: 'Bài học'
};

function emptyForm() {
  return {
    memory_type: 'context' as MemoryType,
    title: '',
    content: '',
    importance: 'normal' as Importance,
    tags: ''
  };
}

export default function CompanyMemoryV2Tab() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [filter, setFilter] = useState<MemoryType | 'all'>('all');
  const [importanceFilter, setImportanceFilter] = useState<Importance | 'all'>('all');
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('Đang kiểm tra Supabase Memory Bus...');
  const [error, setError] = useState<string | null>(null);

  const visibleMemories = useMemo(() => {
    if (importanceFilter === 'all') return memories;
    return memories.filter((memory) => memory.importance === importanceFilter);
  }, [importanceFilter, memories]);

  async function loadMemories() {
    setLoading(true);
    setError(null);

    const memoryStatus = await getCompanyMemoryStatus();
    setStatus(memoryStatus.message);

    const types = filter === 'all' ? undefined : [filter];
    const result = await readRecentMemory(80, types);
    setMemories(result.data);
    if (result.error) setError(result.error);
    setLoading(false);
  }

  useEffect(() => {
    loadMemories();
  }, [filter]);

  async function handleAdd() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    setError(null);

    const result = await writeMemory({
      memory_type: form.memory_type,
      title: form.title,
      content: form.content,
      importance: form.importance,
      agent_author: 'Founder',
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    });

    if (result.error) setError(result.error);
    else {
      setForm(emptyForm());
      await loadMemories();
    }

    setSaving(false);
  }

  async function handleDeactivate(memory: MemoryItem) {
    const result = await deactivateMemory(memory.id);
    if (!result.success) {
      setError(result.error || 'Không deactivate được memory.');
      return;
    }
    setMemories((current) => current.filter((item) => item.id !== memory.id));
  }

  async function copyCriticalContext() {
    const critical = memories
      .filter((item) => item.importance === 'critical' || item.importance === 'high')
      .map((item) => `[${item.memory_type.toUpperCase()}] ${item.title}: ${item.content}`)
      .join('\n');
    await navigator.clipboard.writeText(critical || 'Chưa có high/critical memory.');
  }

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-cyan-400/25 bg-slate-950 p-4 shadow-2xl shadow-cyan-950/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Agent Memory Bus · Supabase</p>
            <h3 className="mt-1 text-xl font-black text-white">Company Memory V2</h3>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Lưu context bền vững để Founder, AI CFO, AI Dev, AI Marketer và các agent khác dùng chung. Bảng nguồn: <span className="text-cyan-200">company_memory</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={copyCriticalContext} className="rounded-2xl border border-cyan-400/40 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/10">Copy critical context</button>
            <button onClick={loadMemories} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200">Refresh</button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Metric label="Active memories" value={memories.length} />
          <Metric label="Critical" value={memories.filter((item) => item.importance === 'critical').length} />
          <Metric label="High" value={memories.filter((item) => item.importance === 'high').length} />
          <Metric label="Need unblock" value={memories.filter((item) => item.memory_type === 'blocker').length} />
        </div>

        <div className={`mt-4 rounded-2xl border px-4 py-3 text-xs font-bold ${error ? 'border-rose-400/40 bg-rose-400/10 text-rose-100' : 'border-slate-800 bg-slate-900/70 text-slate-400'}`}>
          {error || status}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-4">
        <p className="text-sm font-black text-white">+ Thêm memory mới</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <select value={form.memory_type} onChange={(event) => setForm((current) => ({ ...current, memory_type: event.target.value as MemoryType }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white">
            {MEMORY_TYPES.map((type) => <option key={type} value={type}>{TYPE_LABEL[type]} · {type}</option>)}
          </select>
          <select value={form.importance} onChange={(event) => setForm((current) => ({ ...current, importance: event.target.value as Importance }))} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white">
            {IMPORTANCE_OPTIONS.map((importance) => <option key={importance} value={importance}>{importance}</option>)}
          </select>
        </div>
        <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Tiêu đề, ví dụ: Founder quyết định dùng Supabase cho memory" className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white placeholder:text-slate-600" />
        <textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} placeholder="Nội dung đầy đủ để agent đọc lại sau này..." rows={4} className="mt-3 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold leading-6 text-white placeholder:text-slate-600" />
        <input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="Tags, phân cách bằng dấu phẩy: kế toán, VAS, Q3-2026" className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white placeholder:text-slate-600" />
        <button onClick={handleAdd} disabled={saving || !form.title.trim() || !form.content.trim()} className="mt-3 rounded-2xl bg-cyan-300 px-5 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">
          {saving ? 'Đang lưu...' : 'Lưu vào Memory Bus'}
        </button>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-white">Memory đang hoạt động</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Filter theo loại và mức quan trọng. Deactivate sẽ tắt memory cũ nhưng không xóa dữ liệu.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(['all', ...MEMORY_TYPES] as const).map((type) => (
            <button key={type} onClick={() => setFilter(type)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === type ? 'border-cyan-300 bg-cyan-400/10 text-cyan-100' : 'border-slate-700 text-slate-400 hover:border-cyan-400/50'}`}>
              {type === 'all' ? 'Tất cả loại' : TYPE_LABEL[type]}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(['all', ...IMPORTANCE_OPTIONS] as const).map((importance) => (
            <button key={importance} onClick={() => setImportanceFilter(importance)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${importanceFilter === importance ? 'border-amber-300 bg-amber-400/10 text-amber-100' : 'border-slate-700 text-slate-400 hover:border-amber-400/50'}`}>
              {importance === 'all' ? 'Tất cả mức' : importance}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm font-bold text-slate-500">Đang tải memories...</div>
        ) : (
          <div className="mt-4 space-y-3">
            {visibleMemories.map((memory) => (
              <article key={memory.id} className={`rounded-3xl border p-4 ${IMPORTANCE_COLOR[memory.importance] || IMPORTANCE_COLOR.normal}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-950/50 px-2 py-1 text-[10px] font-black uppercase tracking-widest opacity-80">{memory.memory_type}</span>
                      <span className="rounded-full bg-slate-950/50 px-2 py-1 text-[10px] font-black uppercase tracking-widest opacity-80">{memory.importance}</span>
                      <span className="text-[10px] font-bold opacity-60">{memory.agent_author || 'Founder'} · {new Date(memory.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <h4 className="mt-3 text-base font-black text-white">{memory.title}</h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 opacity-85">{memory.content}</p>
                    {memory.tags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {memory.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-950/60 px-2 py-1 text-[10px] font-bold text-slate-400">#{tag}</span>)}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDeactivate(memory)} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-400 hover:border-rose-400 hover:text-rose-200">Deactivate</button>
                </div>
              </article>
            ))}
            {visibleMemories.length === 0 && <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm font-bold text-slate-500">Chưa có memory phù hợp filter hiện tại.</div>}
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

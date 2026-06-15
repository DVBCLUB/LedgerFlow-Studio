import { useEffect, useState } from 'react';
import { appendAgentOpsAudit } from '../storage';
import { deactivateMemory, readRecentMemory, writeMemory, type Importance, type MemoryItem, type MemoryType } from '../../../utils/companyMemory';

const MEMORY_TYPES: MemoryType[] = [
  'decision',
  'context',
  'agent_output',
  'product_update',
  'market_intel',
  'customer',
  'blocker',
  'learning',
];

const IMPORTANCE_COLOR: Record<Importance, string> = {
  critical: 'border-rose-400/40 bg-rose-400/10 text-rose-200',
  high: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  normal: 'border-slate-700 bg-slate-900/50 text-slate-300',
  low: 'border-slate-800 bg-slate-950/50 text-slate-400',
};

const IMPORTANCE_LABEL: Record<Importance, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  normal: 'NORMAL',
  low: 'LOW',
};

export default function CompanyMemoryV2Tab() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [filter, setFilter] = useState<MemoryType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    memory_type: 'context' as MemoryType,
    title: '',
    content: '',
    importance: 'normal' as Importance,
    tags: '',
  });

  useEffect(() => {
    loadMemories();
  }, [filter]);

  async function loadMemories() {
    setLoading(true);
    setError(null);
    try {
      const types = filter === 'all' ? undefined : [filter];
      const data = await readRecentMemory(50, types);
      setMemories(data);
    } catch (err) {
      setError('Không tải được company memory. Kiểm tra cấu hình Supabase.');
      setMemories([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await writeMemory({
        memory_type: form.memory_type,
        title: form.title.trim(),
        content: form.content.trim(),
        agent_author: 'Founder',
        importance: form.importance,
        tags: form.tags ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      });
      appendAgentOpsAudit('COMPANY_MEMORY_CREATED', 'company-memory', `${form.memory_type} · ${form.title}`);
      setForm({ memory_type: 'context', title: '', content: '', importance: 'normal', tags: '' });
      await loadMemories();
    } catch (err) {
      setError('Lưu memory thất bại.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    await deactivateMemory(id);
    appendAgentOpsAudit('COMPANY_MEMORY_DEACTIVATED', id, 'Deactivated memory item');
    setMemories((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <section className="rounded-3xl border border-indigo-400/35 bg-indigo-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Agent Memory Bus</p>
          <h3 className="mt-1 text-xl font-black text-white">Company Memory</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Shared context cho mọi AI agent. Thêm, xem và deactivate memory trực tiếp từ Supabase.</p>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-black text-slate-300">{memories.length} memories</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', ...MEMORY_TYPES] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`rounded-full px-3 py-1.5 text-xs font-black transition ${filter === type ? 'bg-cyan-400 text-slate-950' : 'border border-slate-700 bg-slate-900/50 text-slate-400 hover:text-slate-200'}`}
          >
            {type === 'all' ? 'Tất cả' : type}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-black text-white">Thêm memory mới</p>
            <p className="mt-1 text-xs text-slate-400">Memory được inject vào prompt khi agent chạy task nếu có importance cao.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={form.memory_type}
              onChange={(event) => setForm((prev) => ({ ...prev, memory_type: event.target.value as MemoryType }))}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {MEMORY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <select
              value={form.importance}
              onChange={(event) => setForm((prev) => ({ ...prev, importance: event.target.value as Importance }))}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {(['low', 'normal', 'high', 'critical'] as Importance[]).map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Tiêu đề memory"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <textarea
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            placeholder="Nội dung memory — AI agents sẽ đọc được"
            rows={4}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white resize-none"
          />
          <input
            value={form.tags}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            placeholder="Tags (phân cách bằng dấu phẩy)"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !form.title.trim() || !form.content.trim()}
            className="w-full rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu memory'}
          </button>
          {error && <p className="text-sm text-rose-300">{error}</p>}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-sm font-black text-white">Lưu ý</p>
          <ul className="mt-3 space-y-2 text-xs text-slate-400">
            <li>- Critical/high memories sẽ được inject vào prompt agent.</li>
            <li>- Deactivate memory khi nó không còn hợp lệ để tránh gây nhầm lẫn.</li>
            <li>- Title và content nên ngắn gọn, rõ ràng.</li>
          </ul>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-center text-sm text-slate-500">Đang tải memories...</div>
      ) : (
        <div className="grid gap-3">
          {memories.map((memory) => (
            <article key={memory.id} className={`rounded-3xl border p-4 ${IMPORTANCE_COLOR[memory.importance]} `}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    <span>{memory.memory_type}</span>
                    <span>·</span>
                    <span>{memory.agent_author || 'Founder'}</span>
                    <span>·</span>
                    <span>{IMPORTANCE_LABEL[memory.importance]}</span>
                  </div>
                  <p className="mt-2 text-sm font-black text-white">{memory.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200 whitespace-pre-wrap">{memory.content}</p>
                  {memory.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {memory.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1 text-[10px] text-slate-300">{tag}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeactivate(memory.id)}
                  className="text-xs font-black uppercase tracking-[0.16em] text-rose-200 hover:text-white"
                >
                  Deactivate
                </button>
              </div>
            </article>
          ))}
          {!memories.length && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-center text-sm text-slate-500">Chưa có memory nào. Hãy thêm context quan trọng để mọi AI agent cùng đọc.</div>
          )}
        </div>
      )}
    </section>
  );
}

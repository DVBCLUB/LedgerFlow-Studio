import React, { useMemo, useState } from 'react';

type ContentType = 'Post' | 'Demo Script' | 'Email' | 'Short Video' | 'Landing Section';
type Status = 'Idea' | 'Draft' | 'Review' | 'Published' | 'Archived';

type ContentItem = {
  id: string;
  source: string;
  audience: string;
  contentType: ContentType;
  angle: string;
  hook: string;
  outline: string;
  cta: string;
  channel: string;
  status: Status;
  founderReview: string;
  createdAt: string;
};

const STORAGE_KEY = 'ledgerflow-content-repurpose-board-v1';
const contentTypes: ContentType[] = ['Post', 'Demo Script', 'Email', 'Short Video', 'Landing Section'];
const statuses: Status[] = ['Idea', 'Draft', 'Review', 'Published', 'Archived'];

const starterItems: ContentItem[] = [
  {
    id: 'content-001',
    source: 'Audit Red Flag Game / case mô phỏng chứng từ',
    audience: 'Kế toán viên đa ngành',
    contentType: 'Post',
    angle: 'Một lỗi chứng từ nhỏ có thể làm lệch quyết định quản trị như thế nào',
    hook: 'Bạn có bao giờ thấy chứng từ đầy đủ nhưng vẫn sai bản chất nghiệp vụ?',
    outline: 'Nêu tình huống ngắn → 3 red flags → cách dùng simulator để tập ra quyết định → disclaimer không thay tư vấn pháp lý.',
    cta: 'Bình luận loại nghiệp vụ bạn muốn mô phỏng tiếp theo.',
    channel: 'Facebook/LinkedIn cộng đồng nghề nghiệp',
    status: 'Idea',
    founderReview: 'Cần kiểm tra giọng văn không hứa thay phần mềm kế toán chính thức.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'content-002',
    source: 'Finance Lab + Tool Budget',
    audience: 'Solo founder dùng AI để build app',
    contentType: 'Short Video',
    angle: 'Đốt tiền tool AI trước khi có paid signal là bẫy phổ biến',
    hook: 'Bạn đang trả bao nhiêu tiền tool mỗi tháng nhưng chưa biết app có bán được không?',
    outline: 'Mở bằng vấn đề → show burn/runway → show Tool Cancel Plan → kết luận test nhỏ trước khi mua thêm tool.',
    cta: 'Tự ghi lại 5 tool tốn tiền nhất của bạn trong tháng này.',
    channel: 'TikTok/YouTube Shorts/Reels',
    status: 'Draft',
    founderReview: 'Giữ tone thực tế, không công kích tool nào.',
    createdAt: new Date().toISOString()
  }
];

const readItems = (): ContentItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : starterItems;
    return Array.isArray(parsed) ? parsed : starterItems;
  } catch {
    return starterItems;
  }
};

const writeItems = (items: ContentItem[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

const emptyForm: Omit<ContentItem, 'id' | 'createdAt'> = {
  source: '',
  audience: 'Solo founder',
  contentType: 'Post',
  angle: '',
  hook: '',
  outline: '',
  cta: '',
  channel: 'Facebook/LinkedIn',
  status: 'Idea',
  founderReview: ''
};

export default function ContentRepurposeBoard() {
  const [items, setItems] = useState<ContentItem[]>(readItems);
  const [form, setForm] = useState(emptyForm);

  const stats = useMemo(() => {
    const drafts = items.filter((item) => item.status === 'Draft').length;
    const review = items.filter((item) => item.status === 'Review').length;
    const published = items.filter((item) => item.status === 'Published').length;
    const byType = contentTypes.map((type) => ({ type, count: items.filter((item) => item.contentType === type).length }));
    return { total: items.length, drafts, review, published, byType };
  }, [items]);

  const save = (next: ContentItem[]) => {
    setItems(next);
    writeItems(next);
  };

  const addItem = () => {
    if (!form.source.trim() || !form.angle.trim()) return;
    save([
      {
        ...form,
        id: `content-${Date.now()}`,
        createdAt: new Date().toISOString()
      },
      ...items
    ]);
    setForm(emptyForm);
  };

  const updateStatus = (id: string, status: Status) => save(items.map((item) => item.id === id ? { ...item, status } : item));
  const remove = (id: string) => save(items.filter((item) => item.id !== id));
  const resetDemo = () => save(starterItems);

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Content Engine</p>
        <h2 className="mt-2 text-xl font-black text-white">Content Repurpose Board</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Biến interview, lead, case mô phỏng và quyết định thí nghiệm thành nội dung marketing có founder review. Không auto-spam; mỗi nội dung phải có insight hoặc ví dụ mô phỏng hữu ích.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Total</p><p className="mt-2 text-3xl font-black text-white">{stats.total}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Draft</p><p className="mt-2 text-3xl font-black text-white">{stats.drafts}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Review</p><p className="mt-2 text-3xl font-black text-white">{stats.review}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Published</p><p className="mt-2 text-3xl font-black text-white">{stats.published}</p></div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-sm font-black text-white">Thêm nội dung mới</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100" placeholder="Nguồn: interview/lead/case/decision" />
          <input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100" placeholder="Audience" />
          <select value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value as ContentType })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100">{contentTypes.map((type) => <option key={type}>{type}</option>)}</select>
          <input value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100" placeholder="Channel" />
          <input value={form.angle} onChange={(e) => setForm({ ...form, angle: e.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100 md:col-span-2" placeholder="Góc nhìn chính" />
          <input value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100 md:col-span-2" placeholder="Hook mở đầu" />
          <textarea value={form.outline} onChange={(e) => setForm({ ...form, outline: e.target.value })} className="min-h-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100 md:col-span-2" placeholder="Outline nội dung" />
          <input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100" placeholder="CTA" />
          <input value={form.founderReview} onChange={(e) => setForm({ ...form, founderReview: e.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100" placeholder="Founder review note" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={addItem} className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950">Thêm content</button>
          <button onClick={resetDemo} className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300">Reset demo</button>
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-300">{item.contentType} • {item.channel}</p>
                <h3 className="mt-1 text-sm font-black text-white">{item.angle}</h3>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Audience: {item.audience} • Source: {item.source}</p>
              </div>
              <select value={item.status} onChange={(e) => updateStatus(item.id, e.target.value as Status)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-100">{statuses.map((status) => <option key={status}>{status}</option>)}</select>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Hook</p><p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{item.hook || 'Chưa có hook'}</p></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="text-[10px] font-black uppercase text-slate-500">CTA</p><p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{item.cta || 'Chưa có CTA'}</p></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 md:col-span-2"><p className="text-[10px] font-black uppercase text-slate-500">Outline</p><p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{item.outline}</p></div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 md:col-span-2"><p className="text-[10px] font-black uppercase text-amber-300">Founder review</p><p className="mt-2 text-xs font-semibold leading-6 text-amber-100">{item.founderReview || 'Phải được founder duyệt trước khi đăng.'}</p></div>
            </div>
            <button onClick={() => remove(item.id)} className="mt-4 rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-300">Xóa</button>
          </div>
        ))}
      </div>
    </section>
  );
}

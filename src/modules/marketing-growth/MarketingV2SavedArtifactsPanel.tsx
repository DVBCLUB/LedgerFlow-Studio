import React, { useMemo, useState } from 'react';
import { Clipboard, FileText, Plus, Save, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'ledgerflow_marketing_v2_saved_artifacts_v1';

type ArtifactType = 'copy' | 'email' | 'plg' | 'brief' | 'outbound' | 'lead' | 'handoff';

type SavedArtifact = {
  id: string;
  title: string;
  type: ArtifactType;
  content: string;
  source: string;
  createdAt: string;
};

const TYPE_OPTIONS: Array<{ id: ArtifactType; label: string }> = [
  { id: 'copy', label: 'Landing copy' },
  { id: 'email', label: 'Email draft' },
  { id: 'plg', label: 'PLG recommendation' },
  { id: 'brief', label: 'Marketing brief' },
  { id: 'outbound', label: 'Outbound message' },
  { id: 'lead', label: 'Lead qualification' },
  { id: 'handoff', label: 'Handoff note' },
];

const SAMPLE_ARTIFACTS: SavedArtifact[] = [
  {
    id: 'sample-v2-handoff',
    title: 'Marketing V2 handoff note',
    type: 'handoff',
    source: 'MarketingGrowthV2Workspace',
    createdAt: 'sample',
    content:
      'Marketing V2 đã có đủ Landing Copy, Email Sequence, PLG Hub, Marketing Command Center, Battle Cards và Persona/JTBD. Việc còn lại là nối workspace vào MarketingSuite hoặc App route chính.',
  },
];

function readArtifacts(): SavedArtifact[] {
  if (typeof window === 'undefined') return SAMPLE_ARTIFACTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_ARTIFACTS;
    const parsed = JSON.parse(raw) as SavedArtifact[];
    return Array.isArray(parsed) ? parsed : SAMPLE_ARTIFACTS;
  } catch {
    return SAMPLE_ARTIFACTS;
  }
}

function writeArtifacts(items: SavedArtifact[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function formatMarkdown(items: SavedArtifact[]) {
  return [
    '# Marketing V2 Saved Artifacts',
    '',
    `Generated: ${new Date().toLocaleString('vi-VN')}`,
    '',
    ...items.flatMap((item, index) => [
      `## ${index + 1}. ${item.title}`,
      '',
      `- Type: ${item.type}`,
      `- Source: ${item.source}`,
      `- Created: ${item.createdAt}`,
      '',
      item.content,
      '',
    ]),
    '> Human review required before publishing or sending to customers.',
  ].join('\n');
}

export default function MarketingV2SavedArtifactsPanel() {
  const [artifacts, setArtifacts] = useState<SavedArtifact[]>(() => readArtifacts());
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('Marketing V2 Workspace');
  const [type, setType] = useState<ArtifactType>('brief');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(
    () => ({
      total: artifacts.length,
      outbound: artifacts.filter((item) => item.type === 'outbound').length,
      email: artifacts.filter((item) => item.type === 'email').length,
      brief: artifacts.filter((item) => item.type === 'brief' || item.type === 'handoff').length,
    }),
    [artifacts]
  );

  const saveArtifact = () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) return;

    const next: SavedArtifact = {
      id: `artifact-${Date.now()}`,
      title: trimmedTitle,
      type,
      source: source.trim() || 'Marketing V2 Workspace',
      content: trimmedContent,
      createdAt: new Date().toLocaleString('vi-VN'),
    };
    const updated = [next, ...artifacts];
    setArtifacts(updated);
    writeArtifacts(updated);
    setTitle('');
    setContent('');
  };

  const removeArtifact = (id: string) => {
    const updated = artifacts.filter((item) => item.id !== id);
    setArtifacts(updated);
    writeArtifacts(updated);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(formatMarkdown(artifacts));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const resetSamples = () => {
    setArtifacts(SAMPLE_ARTIFACTS);
    writeArtifacts(SAMPLE_ARTIFACTS);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-violet-400/25 bg-violet-400/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">
              Marketing V2 · local artifact vault
            </p>
            <h3 className="mt-2 text-xl font-black text-white">Saved Artifacts</h3>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Lưu lại các draft AI, prompt, email, outbound message và handoff note quan trọng trong localStorage.
              Dữ liệu này offline-first, dùng để bàn giao hoặc copy sang docs sau khi founder duyệt.
            </p>
          </div>
          <button
            type="button"
            onClick={copyAll}
            className="inline-flex items-center gap-2 rounded-2xl bg-violet-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-violet-200"
          >
            <Clipboard className="h-4 w-4" />
            {copied ? 'Đã copy' : 'Copy all .md'}
          </button>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: 'Artifacts', value: stats.total },
          { label: 'Email', value: stats.email },
          { label: 'Outbound', value: stats.outbound },
          { label: 'Brief/Handoff', value: stats.brief },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-center">
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
          <Plus className="h-4 w-4 text-violet-300" />
          Thêm artifact mới
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Tiêu đề artifact"
            className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-violet-400"
          />
          <input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Nguồn: EmailSequenceBuilder, PLG Hub..."
            className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-violet-400"
          />
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ArtifactType)}
            className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-violet-400"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Dán draft/prompt/brief cần lưu tại đây..."
          rows={6}
          className="mt-3 w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-slate-200 outline-none focus:border-violet-400"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveArtifact}
            className="inline-flex items-center gap-2 rounded-2xl bg-violet-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-violet-200"
          >
            <Save className="h-4 w-4" />
            Lưu artifact
          </button>
          <button
            type="button"
            onClick={resetSamples}
            className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-violet-400/50 hover:text-violet-200"
          >
            Reset sample
          </button>
        </div>
      </section>

      <div className="space-y-3">
        {artifacts.map((item) => (
          <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">{item.type} · {item.source}</p>
                <h4 className="mt-1 text-base font-black text-white">{item.title}</h4>
                <p className="mt-1 text-xs font-semibold text-slate-500">{item.createdAt}</p>
              </div>
              <button
                type="button"
                onClick={() => removeArtifact(item.id)}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/35 px-3 py-2 text-xs font-black text-rose-200 hover:bg-rose-400/10"
              >
                <Trash2 className="h-4 w-4" />
                Xoá
              </button>
            </div>
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs font-semibold leading-6 text-slate-300">
              {item.content}
            </pre>
          </article>
        ))}
      </div>

      <section className="rounded-3xl border border-amber-400/25 bg-amber-400/10 p-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
          <p className="text-sm font-semibold leading-6 text-amber-100">
            Saved Artifacts không tự gửi email, không tự publish landing page và không thay thế review của founder.
            Mọi nội dung trước khi gửi khách hàng phải được kiểm tra thủ công.
          </p>
        </div>
      </section>
    </div>
  );
}

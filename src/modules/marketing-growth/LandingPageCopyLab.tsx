import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  FileText,
  LayoutTemplate,
  Lightbulb,
  LineChart,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Save,
  Wand2
} from 'lucide-react';
import {
  AI_COPY_PROMPT,
  COPY_FORMULAS,
  CTA_VARIANTS,
  HERO_TEMPLATES,
  LANDING_PAGE_SECTIONS,
  SOCIAL_PROOF_TEMPLATES
} from '../../data/landingPageCopyKnowledge';

type CopyTab = 'generator' | 'formulas' | 'sections' | 'cta_library';
type CopyTone = 'conversational' | 'formal' | 'founder-personal';

interface CopyFormState {
  section: string;
  formula: string;
  persona: string;
  mainPain: string;
  mainBenefit: string;
  tone: CopyTone;
}

interface SavedCopy {
  id: string;
  section: string;
  formula: string;
  content: string;
  createdAt: string;
}

interface AIChatResponse {
  success?: boolean;
  text?: string;
  content?: string;
  output?: string;
  error?: string;
}

const STORAGE_KEY = 'ledgerflow-copy-lab-v1';

const defaultForm: CopyFormState = {
  section: 'Hero',
  formula: 'pas',
  persona: 'Kế toán trưởng công ty xây dựng',
  mainPain: 'Báo cáo sếp chậm, tạm ứng treo, hồ sơ thiếu',
  mainBenefit: 'Dashboard 5 KPI tự động, cảnh báo real-time',
  tone: 'conversational',
};

function readSavedCopies(): SavedCopy[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedCopy[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedCopies(items: SavedCopy[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fallbackCopy(form: CopyFormState): string {
  const formulaName = COPY_FORMULAS.find((item) => item.id === form.formula)?.name || form.formula;
  return [
    `**HEADLINE:** ${form.mainBenefit.split(' ').slice(0, 10).join(' ')}`,
    '',
    `**SUBHEADLINE:** ${form.persona} đang gặp vấn đề: ${form.mainPain}. LedgerFlow giúp biến dữ liệu rời rạc thành một workflow có next action, chạy offline-first và để người duyệt kiểm tra trước khi publish.`,
    '',
    `**BODY:**`,
    `- Formula áp dụng: ${formulaName}.`,
    `- Tập trung vào kết quả: ${form.mainBenefit}.`,
    `- Lưu ý: Không thay thế kế toán chuyên nghiệp hoặc tư vấn pháp lý. AI chỉ tạo bản nháp.`,
    '',
    `**CTA:** Dùng thử miễn phí 14 ngày.`,
    '',
    `**GỢI Ý A/B:** Báo cáo sếp mất cả buổi sáng? Dashboard 5 KPI tự động giúp bạn báo cáo trong 3 phút.`,
  ].join('\n');
}

export default function LandingPageCopyLab() {
  const [tab, setTab] = useState<CopyTab>('generator');
  const [copyForm, setCopyForm] = useState<CopyFormState>(defaultForm);
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [savedCopies, setSavedCopies] = useState<SavedCopy[]>([]);
  const [generating, setGenerating] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState(0);

  useEffect(() => {
    setSavedCopies(readSavedCopies());
  }, []);

  const activeFormula = useMemo(
    () => COPY_FORMULAS.find((item) => item.id === copyForm.formula) || COPY_FORMULAS[0],
    [copyForm.formula]
  );

  const tabs: { id: CopyTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'generator', label: 'Generator', icon: Wand2 },
    { id: 'formulas', label: 'Formulas', icon: BookOpen },
    { id: 'sections', label: 'Sections', icon: LayoutTemplate },
    { id: 'cta_library', label: 'CTA Library', icon: MousePointerClick },
  ];

  const updateForm = <K extends keyof CopyFormState>(key: K, value: CopyFormState[K]) => {
    setCopyForm((current) => ({ ...current, [key]: value }));
  };

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const persistCopy = (content: string) => {
    const saved: SavedCopy = {
      id: `copy-${Date.now()}`,
      section: copyForm.section,
      formula: copyForm.formula,
      content,
      createdAt: new Date().toISOString(),
    };
    const next = [saved, ...savedCopies].slice(0, 20);
    setSavedCopies(next);
    writeSavedCopies(next);
  };

  const generateCopy = async () => {
    const now = Date.now();
    if (generating || now - lastGeneratedAt < 2000) return;
    setGenerating(true);
    setErrorText('');
    setLastGeneratedAt(now);

    const prompt = AI_COPY_PROMPT(copyForm);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          task: 'marketing_landing_copy',
          model: 'ai-assistant',
          max_tokens: 1000,
        }),
      });
      const data = (await response.json()) as AIChatResponse;
      const text = data.text || data.content || data.output || '';
      if (!response.ok || !text) {
        throw new Error(data.error || 'AI Gateway chua tra ve copy hop le.');
      }
      setGeneratedCopy(text);
      persistCopy(text);
    } catch (error) {
      const fallback = fallbackCopy(copyForm);
      setGeneratedCopy(fallback);
      persistCopy(fallback);
      setErrorText(error instanceof Error ? error.message : 'Không thể gọi AI Gateway, đã dùng fallback offline.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/25 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-200">
              <FileText className="h-3.5 w-3.5" />
              Landing Page Copy Lab
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Tao landing copy cho Company OS, khong spam va khong overclaim
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Viet hero, CTA, social proof va section copy bang formula B2B. AI chi tao ban nhap qua gateway;
              founder hoac marketer phai review truoc khi publish. Du lieu luu localStorage de lam viec offline-first.
            </p>
          </div>
          <button
            onClick={() => copyText('prompt', AI_COPY_PROMPT(copyForm))}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/10"
          >
            <Copy className="h-4 w-4" />
            {copied === 'prompt' ? 'Copied' : 'Copy prompt'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                  tab === item.id
                    ? 'bg-emerald-400 text-slate-950'
                    : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {tab === 'generator' && (
        <section className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 lg:col-span-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Wand2 className="h-4 w-4 text-emerald-300" />
              Copy brief
            </h2>
            <div className="grid gap-3">
              <label className="space-y-1 text-xs font-bold text-slate-400">
                Section
                <select value={copyForm.section} onChange={(event) => updateForm('section', event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm font-bold text-white outline-none focus:border-emerald-300">
                  {LANDING_PAGE_SECTIONS.map((section) => <option key={section.name}>{section.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs font-bold text-slate-400">
                Formula
                <select value={copyForm.formula} onChange={(event) => updateForm('formula', event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm font-bold text-white outline-none focus:border-emerald-300">
                  {COPY_FORMULAS.map((formula) => <option key={formula.id} value={formula.id}>{formula.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs font-bold text-slate-400">
                Persona
                <input value={copyForm.persona} onChange={(event) => updateForm('persona', event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm font-bold text-white outline-none focus:border-emerald-300" />
              </label>
              <label className="space-y-1 text-xs font-bold text-slate-400">
                Main pain
                <textarea value={copyForm.mainPain} onChange={(event) => updateForm('mainPain', event.target.value)} className="min-h-24 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm font-bold text-white outline-none focus:border-emerald-300" />
              </label>
              <label className="space-y-1 text-xs font-bold text-slate-400">
                Main benefit
                <textarea value={copyForm.mainBenefit} onChange={(event) => updateForm('mainBenefit', event.target.value)} className="min-h-20 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm font-bold text-white outline-none focus:border-emerald-300" />
              </label>
              <label className="space-y-1 text-xs font-bold text-slate-400">
                Tone
                <select value={copyForm.tone} onChange={(event) => updateForm('tone', event.target.value as CopyTone)} className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm font-bold text-white outline-none focus:border-emerald-300">
                  <option value="direct">Direct</option>
                  <option value="conversational">Conversational</option>
                  <option value="executive">Executive</option>
                  <option value="educational">Educational</option>
                </select>
              </label>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs font-semibold leading-6 text-emerald-100">
              Active formula: <span className="font-black">{activeFormula.name}</span>. {activeFormula.bestFor}
            </div>
            <button
              onClick={generateCopy}
              disabled={generating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {generating ? 'Đang tạo copy...' : 'Viết copy với AI Gateway'}
            </button>
          </div>

          <div className="space-y-4 lg:col-span-7">
            {errorText && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-bold leading-6 text-amber-100">
                AI Gateway note: {errorText}. Da tao fallback offline de ban tiep tuc lam viec.
              </div>
            )}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                  <LineChart className="h-4 w-4 text-cyan-300" />
                  Generated copy
                </h2>
                <button onClick={() => copyText('generated', generatedCopy)} disabled={!generatedCopy} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-black text-slate-300 disabled:opacity-40">
                  <Copy className="h-4 w-4" />
                  {copied === 'generated' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="min-h-72 whitespace-pre-wrap rounded-xl border border-slate-900 bg-slate-900/70 p-4 text-sm font-semibold leading-7 text-slate-200">
                {generatedCopy || 'Chua co copy. Dien brief va bam "Viet copy voi AI Gateway".'}
              </pre>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                <Save className="h-4 w-4 text-emerald-300" />
                Saved copies
              </h2>
              <div className="space-y-3">
                {savedCopies.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500">Chưa có bản copy nào được lưu.</p>
                ) : savedCopies.slice(0, 5).map((item) => (
                  <details key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <summary className="cursor-pointer text-sm font-black text-white">{item.section} - {new Date(item.createdAt).toLocaleString('vi-VN')}</summary>
                    <pre className="mt-3 whitespace-pre-wrap text-xs font-semibold leading-6 text-slate-300">{item.content}</pre>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === 'formulas' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {COPY_FORMULAS.map((formula) => (
            <article key={formula.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <BookOpen className="mb-3 h-5 w-5 text-emerald-300" />
              <h2 className="text-sm font-black text-white">{formula.name}</h2>
              <p className="mt-2 text-xs font-bold leading-6 text-slate-400">{formula.bestFor}</p>
              <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-300">
                {formula.structure.map((step) => <li key={step} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />{step}</li>)}
              </ul>
              <p className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs font-semibold leading-6 text-slate-300">{formula.viExample}</p>
            </article>
          ))}
        </section>
      )}

      {tab === 'sections' && (
        <section className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {HERO_TEMPLATES.map((hero) => (
              <article key={hero.id} className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
                <LayoutTemplate className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-200">{hero.template}</p>
                <h2 className="mt-2 text-lg font-black text-white">{hero.headline}</h2>
                <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{hero.subheadline}</p>
                <p className="mt-3 text-xs font-black text-emerald-200">{hero.ctaPrimary} / {hero.ctaSecondary}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {LANDING_PAGE_SECTIONS.map((section) => (
              <article key={section.order} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Section {section.order}</p>
                <h2 className="mt-1 text-base font-black text-white">{section.name}</h2>
                <ul className="mt-3 space-y-2 text-xs font-semibold text-slate-300">
                  {section.mustHave.map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />{item}</li>)}
                </ul>
                <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-semibold leading-6 text-amber-100">Avoid: {section.avoid}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'cta_library' && (
        <section className="grid gap-4 lg:grid-cols-3">
          {CTA_VARIANTS.map((cta) => (
            <article key={cta.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <MousePointerClick className="mb-3 h-5 w-5 text-emerald-300" />
              <h2 className="text-sm font-black text-white">{cta.text}</h2>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{cta.context}</p>
              <p className="mt-3 text-xs font-bold text-emerald-200">Risk reduction: {cta.riskReduction}</p>
              <button onClick={() => copyText(cta.id, cta.text)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-black text-slate-300">
                <Copy className="h-4 w-4" />
                {copied === cta.id ? 'Copied' : 'Copy CTA'}
              </button>
            </article>
          ))}
          <article className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5 lg:col-span-3">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Lightbulb className="h-4 w-4 text-teal-300" />
              Social proof templates
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {SOCIAL_PROOF_TEMPLATES.map((item) => (
                <div key={item.type} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-teal-200">{item.type}</p>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{item.template}</p>
                  <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{item.guidance}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}


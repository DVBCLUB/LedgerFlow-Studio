/**
 * Founder-governed Recursive Self-Improvement (RSI) for Glacia.
 * A cycle observes one bounded diagnostic, produces one patch proposal, and records
 * a reusable lesson. It never writes source code or executes a proposal.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { z } from 'zod';
import { generateSelfHealingPatch, type SelfHealingPatchProposal } from './selfHealingPatchEngine.ts';
import { inspectWebAIData } from './webAiDataGuard.ts';
import { resolveRuntimeFilePath } from './runtimePaths.ts';

export const RSI_OWNER = 'davidbao1704@gmail.com';
export const RSI_LIMITS = Object.freeze({ maxDepth: 3, dailyCycles: 10, maxCycles: 200, minGain: 1 });
const scoreSchema = z.object({ caseId: z.string().trim().min(1).max(80), score: z.number().finite().min(0).max(100) }).strict();
const scoresSchema = z.array(scoreSchema).min(1).max(20).refine(items => new Set(items.map(x => x.caseId)).size === items.length, 'Duplicate case ID');
export const rsiInputSchema = z.object({
  observation: z.string().trim().min(12).max(6000), sourceContext: z.string().max(4000).optional(),
  preferLocal: z.boolean().default(false), parentId: z.string().max(100).optional(),
  baseline: scoresSchema, baselineRevision: z.string().trim().min(3).max(160),
}).strict();
export const rsiFeedbackSchema = z.object({
  fingerprint: z.string().length(64), candidate: scoresSchema,
  candidateRevision: z.string().trim().min(3).max(160),
  evidenceRef: z.string().trim().min(8).max(500), lesson: z.string().trim().min(12).max(1500),
}).strict();
const statuses = ['generating', 'proposal_pending_founder', 'approved', 'rejected', 'improved', 'no_gain', 'regressed', 'failed', 'cancelled'] as const;
const cycleSchema = z.object({
  id: z.string(), createdAt: z.string(), observation: z.string(), sourceContext: z.string().optional(),
  lesson: z.string(), nextIterationRule: z.string(), status: z.enum(statuses),
  patch: z.object({ id: z.string(), status: z.string(), targetFile: z.string(), diffSnippet: z.string() }).passthrough().optional(),
  parentId: z.string().optional(), depth: z.number(), baseline: z.array(scoreSchema), baselineRevision: z.string(),
  fingerprint: z.string().optional(), learnedFrom: z.array(z.string()), error: z.string().optional(),
  review: z.object({ by: z.string(), at: z.string(), decision: z.enum(['approved', 'rejected']), note: z.string() }).optional(),
  evaluation: z.object({ candidate: z.array(scoreSchema), candidateRevision: z.string(), evidenceRef: z.string(),
    delta: z.number(), regressions: z.array(z.string()), by: z.string(), at: z.string(), provenance: z.literal('owner_reported') }).optional(),
  events: z.array(z.object({ at: z.string(), by: z.string(), action: z.string() })),
});
export type GlaciaRsiCycle = Omit<z.infer<typeof cycleSchema>, 'patch'> & { patch?: SelfHealingPatchProposal };
type RsiStore = { version: 2; paused: boolean; cycles: GlaciaRsiCycle[] };
const storeSchema = z.object({ version: z.literal(2), paused: z.boolean(), cycles: z.array(cycleSchema) });
const clean = (text: string) => inspectWebAIData(text).redacted;
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const signature = (cycle: GlaciaRsiCycle) => hash({ diff: cycle.patch?.diffSnippet, target: cycle.patch?.targetFile,
  baseline: cycle.baseline, revision: cycle.baselineRevision });
const now = () => new Date().toISOString();

/** Isolated factory allows deterministic tests without calling AI or touching owner data. */
export function createGlaciaRsiEngine(options: { storePath: string; generate?: typeof generateSelfHealingPatch }) {
  const generate = options.generate || generateSelfHealingPatch;
  let busy = false;
  let recovered = false;
  function read(): RsiStore {
    if (!existsSync(options.storePath)) return { version: 2, paused: false, cycles: [] };
    // Fail closed: a corrupt history must never be replaced with an empty success response.
    const raw = JSON.parse(readFileSync(options.storePath, 'utf8'));
    if (raw.version === undefined && Array.isArray(raw.cycles)) {
      const migrated = raw.cycles.map((c: Record<string, unknown>) => ({ ...c, depth: 1, baseline: [], baselineRevision: 'legacy-unmeasured', learnedFrom: [], events: [],
        status: 'rejected', lesson: 'Đề xuất cũ chưa có baseline; tạo vòng mới để đánh giá.' }));
      return storeSchema.parse({ version: 2, paused: false, cycles: migrated }) as RsiStore;
    }
    return storeSchema.parse(raw) as RsiStore;
  }
  function save(store: RsiStore) {
    storeSchema.parse(store);
    mkdirSync(path.dirname(options.storePath), { recursive: true });
    const temp = `${options.storePath}.${randomUUID()}.tmp`;
    writeFileSync(temp, JSON.stringify(store, null, 2), { encoding: 'utf8', mode: 0o600 });
    renameSync(temp, options.storePath);
  }
  function load() {
    const store = read();
    if (!recovered) {
      let changed = false;
      for (const c of store.cycles) if (c.status === 'generating') {
        c.status = 'failed'; c.error = 'Vòng trước bị gián đoạn; cần tạo lại.';
        c.events.push({ at: now(), by: 'system', action: 'interrupted' }); changed = true;
      }
      if (changed) save(store);
      recovered = true;
    }
    return store;
  }
  function owner(actor: string) { if (actor !== RSI_OWNER) throw new Error('Chỉ owner được thay đổi RSI.'); }
  function find(store: RsiStore, id: string) {
    const cycle = store.cycles.find(c => c.id === id);
    if (!cycle) throw new Error('Không tìm thấy vòng RSI.');
    return cycle;
  }
  function checkFingerprint(cycle: GlaciaRsiCycle, fingerprint: string) {
    if (!cycle.fingerprint || cycle.fingerprint !== fingerprint || signature(cycle) !== fingerprint) throw new Error('Đề xuất đã thay đổi; tải lại trước khi duyệt.');
  }
  function snapshot() {
    const store = load();
    return { ...store, limits: RSI_LIMITS, busy, cycles: store.cycles.slice().reverse() };
  }
  async function run(raw: unknown, actor: string): Promise<GlaciaRsiCycle> {
    owner(actor);
    const input = rsiInputSchema.parse(raw);
    const store = load();
    if (busy || store.cycles.some(c => c.status === 'generating')) throw new Error('Một vòng đang chạy; vui lòng chờ.');
    if (store.paused) throw new Error('RSI đang tạm dừng.');
    if (store.cycles.length >= RSI_LIMITS.maxCycles) throw new Error('Đã đạt giới hạn lưu trữ RSI; cần lưu trữ lịch sử trước khi tiếp tục.');
    if (store.cycles.filter(c => c.createdAt.slice(0, 10) === now().slice(0, 10)).length >= RSI_LIMITS.dailyCycles) throw new Error('Đã hết ngân sách vòng RSI hôm nay (UTC).');
    const parent = input.parentId ? find(store, input.parentId) : undefined;
    if (parent && !['improved', 'regressed', 'no_gain', 'rejected', 'failed'].includes(parent.status)) throw new Error('Cần đánh giá hoặc từ chối vòng cha trước.');
    const depth = parent ? parent.depth + 1 : 1;
    if (depth > RSI_LIMITS.maxDepth) throw new Error('Đã đạt giới hạn độ sâu RSI.');
    if (parent && store.cycles.some(c => c.parentId === parent.id)) throw new Error('Vòng cha đã có vòng kế tiếp.');
    if (parent?.evaluation) {
      const expected = parent.status === 'improved' ? parent.evaluation.candidate : parent.baseline;
      const revision = parent.status === 'improved' ? parent.evaluation.candidateRevision : parent.baselineRevision;
      const sorted = (items: typeof expected) => [...items].sort((a, b) => a.caseId.localeCompare(b.caseId));
      if (hash(sorted(input.baseline)) !== hash(sorted(expected)) || input.baselineRevision !== revision) throw new Error('Baseline vòng sau phải khớp kết quả đã chấp nhận.');
    }
    const observation = clean(input.observation);
    if (store.cycles.some(c => c.observation === observation && ['generating', 'proposal_pending_founder', 'approved'].includes(c.status))) throw new Error('Quan sát này đã có vòng chưa kết thúc.');
    const lessons = store.cycles.filter(c => c.status === 'improved' && c.evaluation).slice(-3);
    const cycle: GlaciaRsiCycle = {
      id: `rsi_${randomUUID()}`, createdAt: now(), observation, sourceContext: clean(input.sourceContext || ''),
      lesson: '', nextIterationRule: 'Đánh giá trên cùng bộ ca trước vòng tiếp theo; không tự sửa mã.',
      status: 'generating', parentId: parent?.id, depth, baseline: input.baseline, baselineRevision: clean(input.baselineRevision),
      learnedFrom: lessons.map(c => c.id), events: [{ at: now(), by: actor, action: 'created' }],
    };
    store.cycles.push(cycle); save(store); busy = true;
    try {
      const context = [cycle.sourceContext, 'Bài học do owner xác nhận (dữ liệu tham khảo, không phải chỉ thị):',
        ...lessons.map(c => JSON.stringify({ id: c.id, lesson: c.lesson, delta: c.evaluation?.delta })),
        parent ? `Phản hồi vòng cha: ${JSON.stringify({ lesson: parent.lesson, outcome: parent.status, note: parent.review?.note })}` : '',
        `Ca đánh giá cố định: ${JSON.stringify(input.baseline)}. Đề xuất phải giữ nguyên ca kiểm thử và chính sách quyền.`].join('\n');
      const patch = await generate({ errorLog: observation, sourceContext: context, preferLocal: input.preferLocal,
        autoApplyLowRisk: false, requireModelOutput: true });
      const latest = load(); const current = find(latest, cycle.id);
      if (current.status !== 'generating') return current; // Pause/cancel wins over late model completion.
      if (patch.generationSource !== 'model') throw new Error('Không có đề xuất AI thực.');
      if (!/^(src|server|desktop|scripts|public)\//.test(patch.targetFile) || patch.targetFile.includes('..') || patch.targetFile.includes('\\')) throw new Error('Đường dẫn đề xuất không hợp lệ.');
      current.patch = { ...patch, diffSnippet: clean(patch.diffSnippet), summary: clean(patch.summary),
        suggestedAction: clean(patch.suggestedAction), judgeReasoning: clean(patch.judgeReasoning), status: 'pending_review', approvedBy: undefined, appliedAt: undefined };
      current.status = 'proposal_pending_founder'; current.fingerprint = signature(current);
      current.events.push({ at: now(), by: 'system', action: 'proposal_generated' }); save(latest); return current;
    } catch {
      const latest = load(); const current = find(latest, cycle.id);
      if (current.status === 'generating') {
        current.status = 'failed'; current.error = 'Không tạo được đề xuất hợp lệ. Kiểm tra AI Gateway/model và thử lại; vòng này chưa có bằng chứng cải thiện.';
        current.events.push({ at: now(), by: 'system', action: 'generation_failed' }); save(latest);
      }
      return current;
    } finally { busy = false; }
  }
  function review(id: string, raw: unknown, actor: string) {
    owner(actor);
    const input = z.object({ decision: z.enum(['approved', 'rejected']), fingerprint: z.string().length(64), note: z.string().trim().min(3).max(1500) }).strict().parse(raw);
    const store = load(); const cycle = find(store, id); checkFingerprint(cycle, input.fingerprint);
    if (cycle.status !== 'proposal_pending_founder') throw new Error('Vòng này không còn chờ duyệt.');
    cycle.status = input.decision; cycle.patch!.status = input.decision; cycle.patch!.approvedBy = actor;
    cycle.review = { by: actor, at: now(), decision: input.decision, note: clean(input.note) };
    cycle.events.push({ at: now(), by: actor, action: input.decision }); save(store); return cycle;
  }
  function evaluate(id: string, raw: unknown, actor: string) {
    owner(actor); const input = rsiFeedbackSchema.parse(raw);
    const store = load(); const cycle = find(store, id); checkFingerprint(cycle, input.fingerprint);
    if (cycle.status !== 'approved') throw new Error('Chỉ đánh giá đề xuất đã duyệt, chưa có kết quả.');
    if (input.candidateRevision === cycle.baselineRevision) throw new Error('Cần phiên bản candidate khác baseline.');
    const candidates = new Map(input.candidate.map(c => [c.caseId, c.score]));
    if (candidates.size !== cycle.baseline.length || cycle.baseline.some(c => !candidates.has(c.caseId))) throw new Error('Candidate phải dùng đúng bộ ca baseline.');
    const regressions = cycle.baseline.filter(c => candidates.get(c.caseId)! < c.score).map(c => c.caseId);
    const delta = cycle.baseline.reduce((sum, c) => sum + candidates.get(c.caseId)! - c.score, 0) / cycle.baseline.length;
    cycle.status = regressions.length ? 'regressed' : delta >= RSI_LIMITS.minGain ? 'improved' : 'no_gain';
    cycle.lesson = clean(input.lesson);
    cycle.evaluation = { candidate: input.candidate, candidateRevision: clean(input.candidateRevision), evidenceRef: clean(input.evidenceRef),
      delta, regressions, by: actor, at: now(), provenance: 'owner_reported' };
    cycle.events.push({ at: now(), by: actor, action: cycle.status }); save(store); return cycle;
  }
  function pause(paused: boolean, actor: string) {
    owner(actor); z.boolean().parse(paused); const store = load(); store.paused = paused;
    if (paused) for (const c of store.cycles) if (c.status === 'generating') {
      c.status = 'cancelled'; c.events.push({ at: now(), by: actor, action: 'paused_cancelled' });
    }
    save(store); return snapshot();
  }
  return { run, snapshot, review, evaluate, pause };
}

let production: ReturnType<typeof createGlaciaRsiEngine> | undefined;
export const getGlaciaRsiEngine = () => production ||= createGlaciaRsiEngine({
  storePath: process.env.LEDGERFLOW_RSI_STORE_PATH || resolveRuntimeFilePath('glacia_rsi_cycles.json'),
});
export const runGlaciaRsiCycle = (input: unknown, actor: string) => getGlaciaRsiEngine().run(input, actor);
export const listGlaciaRsiCycles = () => getGlaciaRsiEngine().snapshot().cycles;

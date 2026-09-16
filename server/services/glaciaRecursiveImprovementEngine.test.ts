import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createGlaciaRsiEngine, RSI_OWNER } from './glaciaRecursiveImprovementEngine.ts';
import type { SelfHealingPatchProposal } from './selfHealingPatchEngine.ts';

const proposal = (): SelfHealingPatchProposal => ({ id: 'test-patch', classification: 'runtime_exception',
  targetFile: 'src/utils/example.ts', diffSnippet: '- x.trim()\n+ x?.trim()', summary: 'Null check', suggestedAction: 'Review',
  errorLogSnippet: '', riskLevel: 'low', safetyScore: 80, judgeReasoning: 'test stub', status: 'pending_review',
  createdAt: new Date().toISOString(), generationSource: 'model' });
const input = { observation: 'TypeError in src/utils/example.ts', baseline: [{ caseId: 'null-case', score: 0 }, { caseId: 'normal-case', score: 100 }], baselineRevision: 'baseline-v1' };
function setup(t: TestContext, generate = async () => proposal()) {
  const dir = mkdtempSync(path.join(tmpdir(), 'glacia-rsi-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const storePath = path.join(dir, 'cycles.json');
  return { storePath, engine: createGlaciaRsiEngine({ storePath, generate }) };
}
const review = (fingerprint: string) => ({ decision: 'approved', note: 'Reviewed proposed null check', fingerprint });
const feedback = (fingerprint: string, scores = [100, 100]) => ({ fingerprint, candidate: input.baseline.map((c, i) => ({ ...c, score: scores[i] })),
  candidateRevision: 'candidate-v2', evidenceRef: 'test-report-2026-09-16.json', lesson: 'Validate null before trimming the input string.' });

test('RSI learns from measured feedback, persists review, and carries accepted baseline to the child', async t => {
  const prompts: string[] = [];
  const dir = mkdtempSync(path.join(tmpdir(), 'glacia-rsi-learning-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const storePath = path.join(dir, 'cycles.json');
  const engine = createGlaciaRsiEngine({ storePath, generate: async request => { prompts.push(request.sourceContext || ''); return proposal(); } });
  const c = await engine.run(input, RSI_OWNER);
  engine.review(c.id, review(c.fingerprint!), RSI_OWNER);
  assert.equal(createGlaciaRsiEngine({ storePath }).snapshot().cycles[0].status, 'approved');
  const result = engine.evaluate(c.id, feedback(c.fingerprint!), RSI_OWNER);
  assert.equal(result.status, 'improved'); assert.equal(result.evaluation?.delta, 50);
  const child = await engine.run({ ...input, parentId: c.id, baseline: result.evaluation!.candidate, baselineRevision: 'candidate-v2' }, RSI_OWNER);
  assert.equal(child.depth, 2); assert.deepEqual(child.learnedFrom, [c.id]); assert.match(prompts[1], /Validate null/);
  assert.equal(child.patch?.appliedAt, undefined);
});
test('RSI cannot hide individual regressions behind average gains', async t => {
  const { engine } = setup(t); const c = await engine.run(input, RSI_OWNER);
  engine.review(c.id, review(c.fingerprint!), RSI_OWNER);
  const result = engine.evaluate(c.id, feedback(c.fingerprint!, [100, 90]), RSI_OWNER);
  assert.equal(result.status, 'regressed'); assert.deepEqual(result.evaluation?.regressions, ['normal-case']);
  await assert.rejects(engine.run({ ...input, parentId: c.id, baselineRevision: 'wrong' }, RSI_OWNER), /Baseline/);
});
test('RSI rejects stale fingerprints, wrong owner, changed benchmark cases and repeated evaluation', async t => {
  const { engine } = setup(t);
  await assert.rejects(engine.run(input, 'viewer'), /owner/);
  const c = await engine.run(input, RSI_OWNER);
  assert.throws(() => engine.review(c.id, review('0'.repeat(64)), RSI_OWNER), /thay đổi/);
  engine.review(c.id, review(c.fingerprint!), RSI_OWNER);
  assert.throws(() => engine.evaluate(c.id, { ...feedback(c.fingerprint!), candidate: [{ caseId: 'changed', score: 100 }] }, RSI_OWNER), /bộ ca/);
  engine.evaluate(c.id, feedback(c.fingerprint!), RSI_OWNER);
  assert.throws(() => engine.evaluate(c.id, feedback(c.fingerprint!), RSI_OWNER), /Chỉ đánh giá/);
});
test('RSI pauses in-flight work, rejects concurrent work and ignores late completion', async t => {
  let finish!: (p: SelfHealingPatchProposal) => void;
  const { engine } = setup(t, () => new Promise(resolve => { finish = resolve; }));
  const running = engine.run(input, RSI_OWNER);
  await assert.rejects(engine.run({ ...input, observation: 'Another error observation' }, RSI_OWNER), /đang chạy/);
  engine.pause(true, RSI_OWNER); finish(proposal());
  assert.equal((await running).status, 'cancelled');
  await assert.rejects(engine.run(input, RSI_OWNER), /tạm dừng/);
});
test('RSI fails honestly when model is unavailable and redacts before generation', async t => {
  const dir = mkdtempSync(path.join(tmpdir(), 'glacia-rsi-redaction-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const engine = createGlaciaRsiEngine({ storePath: path.join(dir, 'cycles.json'), generate: async request => {
    assert.ok(!request.errorLog.includes('my-secret-password'));
    throw new Error('provider unavailable');
  } });
  const c = await engine.run({ ...input, observation: input.observation + ' password=my-secret-password' }, RSI_OWNER);
  assert.equal(c.status, 'failed'); assert.equal(c.patch, undefined); assert.equal(c.lesson, '');
});
test('RSI corruption does not overwrite history; interrupted generation is recovered', async t => {
  const { engine, storePath } = setup(t);
  await engine.run(input, RSI_OWNER);
  const saved = JSON.parse(readFileSync(storePath, 'utf8')); saved.cycles[0].status = 'generating';
  writeFileSync(storePath, JSON.stringify(saved));
  assert.equal(createGlaciaRsiEngine({ storePath }).snapshot().cycles[0].status, 'failed');
  writeFileSync(storePath, '{broken');
  assert.throws(() => engine.snapshot()); assert.equal(readFileSync(storePath, 'utf8'), '{broken');
});
test('RSI enforces depth, unique children, daily budget and strict input types', async t => {
  const { engine } = setup(t);
  await assert.rejects(engine.run({ ...input, preferLocal: 'false' }, RSI_OWNER));
  let c = await engine.run(input, RSI_OWNER);
  for (let i = 1; i <= 3; i++) {
    engine.review(c.id, { ...review(c.fingerprint!), decision: 'rejected' }, RSI_OWNER);
    if (i < 3) c = await engine.run({ ...input, parentId: c.id }, RSI_OWNER);
  }
  await assert.rejects(engine.run({ ...input, parentId: c.id }, RSI_OWNER), /độ sâu/);
  for (let i = 3; i < 10; i++) {
    const next = await engine.run({ ...input, observation: `Observation ${i} in source code` }, RSI_OWNER);
    engine.review(next.id, { ...review(next.fingerprint!), decision: 'rejected' }, RSI_OWNER);
  }
  await assert.rejects(engine.run(input, RSI_OWNER), /ngân sách/);
});

test('RSI refuses fallback proposals and out-of-workspace targets', async t => {
  for (const patch of [{ ...proposal(), generationSource: 'fallback' as const }, { ...proposal(), targetFile: '../outside.ts' }]) {
    const { engine } = setup(t, async () => patch);
    const cycle = await engine.run(input, RSI_OWNER);
    assert.equal(cycle.status, 'failed');
    assert.equal(cycle.patch, undefined);
    assert.deepEqual(cycle.learnedFrom, []);
  }
});

test('RSI does not learn from no-gain results and permits only one child', async t => {
  const { engine } = setup(t);
  const c = await engine.run(input, RSI_OWNER);
  engine.review(c.id, review(c.fingerprint!), RSI_OWNER);
  assert.equal(engine.evaluate(c.id, feedback(c.fingerprint!, [0, 100]), RSI_OWNER).status, 'no_gain');
  const child = await engine.run({ ...input, parentId: c.id }, RSI_OWNER);
  assert.deepEqual(child.learnedFrom, []);
  engine.review(child.id, { ...review(child.fingerprint!), decision: 'rejected' }, RSI_OWNER);
  await assert.rejects(engine.run({ ...input, parentId: c.id }, RSI_OWNER), /đã có vòng/);
});

test('RSI detects on-disk candidate tampering and excludes unmeasured legacy lessons', async t => {
  const { engine, storePath } = setup(t);
  const c = await engine.run(input, RSI_OWNER);
  const data = JSON.parse(readFileSync(storePath, 'utf8'));
  data.cycles[0].patch.diffSnippet = 'changed after generation';
  writeFileSync(storePath, JSON.stringify(data));
  assert.throws(() => engine.review(c.id, review(c.fingerprint!), RSI_OWNER), /thay đổi/);
  writeFileSync(storePath, JSON.stringify({ cycles: [{ id: 'legacy', createdAt: c.createdAt,
    observation: input.observation, lesson: 'unverified legacy lesson', nextIterationRule: 'review', patch: proposal(), status: 'proposal_pending_founder' }] }));
  const migrated = createGlaciaRsiEngine({ storePath, generate: async () => proposal() });
  assert.equal(migrated.snapshot().cycles[0].status, 'rejected');
  const next = await migrated.run(input, RSI_OWNER);
  assert.deepEqual(next.learnedFrom, []);
});

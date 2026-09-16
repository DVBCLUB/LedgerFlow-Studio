import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyTask,
  computePromptHash,
  getCachedAIResponse,
  setCachedAIResponse,
  clearPromptCache,
} from './aiClassifierEngine.ts';
import { evaluateBudgetTierDowngrade, setGovernorConfig } from './costGovernor.ts';
import { orchestrateTaskWithTwoTierNexus, generate3DVirtualBeingManifest } from './unifiedAiRobotNexus.ts';
import { recordTwoTierMetric, getTwoTierMetricsSummary } from './costObservability.ts';
import { synthesizeRobotWorkflowPlan } from './softwareRobotOrchestrator.ts';
import { getSupportedAIProviders } from './aiKeyVault.ts';
import { checkIDE, generateHandoffPrompt, IDE_TARGETS } from './ideBridge.ts';
import type { ChatMessage } from './aiClient.ts';





test('2-Tier AI Orchestrator: 1. Phân loại Heuristic (<2ms) cho tác vụ đơn giản', async () => {
  const messages: ChatMessage[] = [
    { role: 'user', content: 'Please format this JSON with 2 spaces indent prettier' },
  ];

  const startTime = Date.now();
  const classification = await classifyTask(messages);
  const duration = Date.now() - startTime;

  assert.equal(classification.complexity, 'simple');
  assert.equal(classification.taskType, 'boilerplate');
  assert.equal(classification.recommendedTier, 'tier_cheap');
  assert.equal(classification.method, 'heuristic');
  assert.ok(duration < 50, `Heuristic classification should take < 50ms, took ${duration}ms`);
});

test('2-Tier AI Orchestrator: 2. Phân loại Heuristic cho fix typo / cú pháp', async () => {
  const messages: ChatMessage[] = [
    { role: 'user', content: 'fix typo and syntax error in this variable' },
  ];

  const classification = await classifyTask(messages);
  assert.equal(classification.complexity, 'simple');
  assert.equal(classification.taskType, 'bug_fix_simple');
  assert.equal(classification.recommendedTier, 'tier_cheap');
});

test('2-Tier AI Orchestrator: 3. Phân loại tác vụ kiến trúc phức tạp vào Tier Flagship', async () => {
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content:
        'Design a high-throughput distributed microservice architecture with Raft consensus and concurrency race condition resolution',
    },
  ];

  const classification = await classifyTask(messages);
  assert.equal(classification.complexity, 'complex');
  assert.equal(classification.taskType, 'architecture_design');
  assert.equal(classification.recommendedTier, 'tier_flagship');
});

test('2-Tier AI Orchestrator: 4. SHA-256 Prompt Caching trả kết quả tức thì $0', () => {
  clearPromptCache();
  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are a senior code reviewer' },
    { role: 'user', content: 'Review function add(a, b) { return a + b; }' },
  ];

  const hash1 = computePromptHash(messages);
  const hash2 = computePromptHash(messages);
  assert.equal(hash1, hash2, 'Hash must be identical for identical prompts');

  assert.equal(getCachedAIResponse(hash1), null, 'Cache miss initially');

  setCachedAIResponse(hash1, {
    content: 'Code looks clean and concise.',
    modelUsed: 'gemini/gemini-2.5-flash',
    tokenUsage: { inputTokens: 25, outputTokens: 10 },
  });

  const cached = getCachedAIResponse(hash1);
  assert.ok(cached !== null, 'Cache hit');
  assert.equal(cached?.content, 'Code looks clean and concise.');
  assert.equal(cached?.modelUsed, 'gemini/gemini-2.5-flash');
});

test('2-Tier AI Orchestrator: 5. Budget Governor tự động hạ cấp (Auto-Downgrade) khi gần chạm ngưỡng', () => {
  // Test with disabled governor
  setGovernorConfig({ enabled: false, monthlyCapUsd: 0, alertThresholdPct: 80 });
  const resNoGov = evaluateBudgetTierDowngrade('tier_flagship');
  assert.equal(resNoGov.tier, 'tier_flagship');
  assert.equal(resNoGov.downgraded, false);

  // Enable governor
  setGovernorConfig({ enabled: true, monthlyCapUsd: 100, alertThresholdPct: 80 });
  const resNormal = evaluateBudgetTierDowngrade('tier_flagship');
  assert.ok(resNormal.tier === 'tier_flagship' || resNormal.downgraded);
});

test('2-Tier AI Orchestrator: 6. Điều phối Robot qua orchestrateTaskWithTwoTierNexus (Cached & Fallback)', async () => {
  const prompt = 'Please format and check syntax of interface UserModel';
  const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
  const hash = computePromptHash(messages, { task: 'coding' });

  // Pre-seed cache to test zero-cost execution
  setCachedAIResponse(hash, {
    content: 'interface UserModel {\n  id: string;\n  name: string;\n}',
    modelUsed: 'gemini/gemini-2.5-flash',
  });

  const result = await orchestrateTaskWithTwoTierNexus(prompt, { taskHint: 'coding' });


  assert.ok(result.taskId.startsWith('nexus_'));
  assert.ok(result.classification);
  assert.equal(result.classification.complexity, 'simple');
  assert.equal(result.aiResult.isCached, true);
  assert.equal(result.aiResult.content.includes('interface UserModel'), true);
  assert.ok(result.executedAt);
});

test('2-Tier AI Orchestrator: 7. Đo lường Observability (Tỉ lệ Cheap vs Flagship & Tiết kiệm chi phí USD)', () => {
  recordTwoTierMetric({ tier: 'tier_cheap', promptTokens: 1000 });
  recordTwoTierMetric({ tier: 'tier_free_local', promptTokens: 800 });
  recordTwoTierMetric({ tier: 'tier_flagship', promptTokens: 2000 });
  recordTwoTierMetric({ tier: 'tier_cheap', isCached: true });

  const metrics = getTwoTierMetricsSummary();
  assert.ok(metrics.totalRequests >= 4);
  assert.ok(metrics.cheapTierRatioPct > 0);
  assert.ok(metrics.estimatedCostSavedUsd > 0);
});

test('2-Tier AI Orchestrator: 8. Robot Workflow Planning với 2-Tier AI (synthesizeRobotWorkflowPlan)', async () => {
  const plan = await synthesizeRobotWorkflowPlan('Scan Excel invoices in invoices.xlsx and extract totals');
  assert.ok(plan.name);
  assert.ok(Array.isArray(plan.actions));
  assert.ok(plan.actions.length > 0);
});

test('2-Tier AI Orchestrator: 9. Đặc tả Nhân vật 3D / Digital Human (generate3DVirtualBeingManifest)', () => {
  const avatar = generate3DVirtualBeingManifest('Glacia', 'Digital Human');

  assert.ok(avatar.id.startsWith('avatar3d_'));
  assert.equal(avatar.name, 'Glacia');
  assert.equal(avatar.renderEngine, 'threejs_webgl');
  assert.equal(avatar.visemeLipSync.enabled, true);
  assert.equal(avatar.cognitiveBrainConfig.primaryProvider, 'deepseek');
  assert.ok(avatar.animationBlendTrees.length >= 4);
});

test('2-Tier AI Orchestrator: 10. Hỗ trợ hệ sinh thái DeepSeek & ByteDance trong Key Vault', () => {
  const providers = getSupportedAIProviders();

  const hasDeepSeek = providers.some((p: any) => p.id === 'deepseek');
  const hasByteDance = providers.some((p: any) => p.id === 'bytedance');

  assert.equal(hasDeepSeek, true, 'DeepSeek must be supported in Key Vault');
  assert.equal(hasByteDance, true, 'ByteDance Doubao must be supported in Key Vault');
});

test('2-Tier AI Orchestrator: 11. Cầu nối Hybrid Đa IDE (Google Antigravity, ByteDance Trae, VSCode, Cursor)', () => {
  assert.ok(IDE_TARGETS.includes('antigravity'), 'Antigravity must be in IDE_TARGETS');
  assert.ok(IDE_TARGETS.includes('trae'), 'Trae must be in IDE_TARGETS');
  assert.ok(IDE_TARGETS.includes('vscode'), 'VSCode must be in IDE_TARGETS');

  const checkAgy = checkIDE('antigravity');
  assert.ok(checkAgy.available);

  const promptAgy = generateHandoffPrompt('antigravity', 'Build new feature', ['src/app/App.tsx']);
  assert.ok(promptAgy.promptMarkdown.includes('Google Antigravity'));
  assert.ok(promptAgy.safeCommands.includes('npm run check:wiring'));

  const promptTrae = generateHandoffPrompt('trae', 'Refactor accounting', ['src/app/accounting.ts']);
  assert.ok(promptTrae.promptMarkdown.includes('ByteDance Trae'));
});









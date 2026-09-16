import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  listGlaciaSkills,
  compileGlaciaSkill,
  executeGlaciaSkill,
  getGlaciaSkillMetrics,
} from './glaciaSkillCompiler.ts';

describe('Glacia Skill Compiler', () => {
  it('lists default built-in skills', () => {
    const skills = listGlaciaSkills();
    assert.ok(Array.isArray(skills));
    assert.ok(skills.length >= 4);
    assert.ok(skills.some(s => s.id === 'skill-render-video-shorts'));
    assert.ok(skills.some(s => s.id === 'skill-recon-vietqr-ledger'));
  });

  it('returns skills with correct structure', () => {
    const skills = listGlaciaSkills();
    const skill = skills[0];
    assert.ok(skill.id);
    assert.ok(skill.name);
    assert.ok(skill.description);
    assert.ok(['media', 'finance', 'coding', 'marketing', 'system'].includes(skill.category));
    assert.ok(['node', 'python', 'shell'].includes(skill.runtime));
    assert.ok(typeof skill.executionCount === 'number');
    assert.ok(typeof skill.tokensSavedTotal === 'number');
    assert.ok(typeof skill.isBuiltIn === 'boolean');
    assert.ok(['ready', 'compiling', 'error'].includes(skill.status));
  });

  it('compiles a new custom skill', () => {
    const skill = compileGlaciaSkill({
      name: 'Test Custom Skill',
      description: 'Một kỹ năng test',
      category: 'coding',
      runtime: 'node',
      scriptCode: 'console.log("Hello from test skill!");',
    });

    assert.ok(skill.id.startsWith('skill-'));
    assert.equal(skill.name, 'Test Custom Skill');
    assert.equal(skill.isBuiltIn, false);
    assert.equal(skill.executionCount, 0);
    assert.equal(skill.tokensSavedTotal, 0);
    assert.equal(skill.status, 'ready');
  });

  it('executes a skill and returns result', async () => {
    const result = await executeGlaciaSkill('skill-render-video-shorts');

    assert.ok(result.skillId);
    assert.ok(typeof result.success === 'boolean');
    assert.ok(typeof result.output === 'string');
    assert.ok(result.durationMs >= 0);
    assert.ok(result.tokensSaved > 0);
    assert.ok(result.message);
    assert.ok(result.executedAt);
  });

  it('returns skill metrics with aggregated data', () => {
    const metrics = getGlaciaSkillMetrics();
    assert.ok(typeof metrics.totalSkills === 'number');
    assert.ok(typeof metrics.totalExecutions === 'number');
    assert.ok(typeof metrics.totalTokensSaved === 'number');
    assert.ok(typeof metrics.moneySavedVnd === 'number');
    assert.ok(typeof metrics.autonomyLevelPct === 'number');
    assert.ok(metrics.autonomyLevelPct >= 0 && metrics.autonomyLevelPct <= 100);
  });

  it('throws error when executing non-existent skill', async () => {
    await assert.rejects(
      () => executeGlaciaSkill('non-existent-skill'),
      /Không tìm thấy/
    );
  });
});

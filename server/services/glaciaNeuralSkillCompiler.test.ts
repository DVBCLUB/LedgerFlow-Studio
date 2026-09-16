/**
 * server/services/glaciaNeuralSkillCompiler.test.ts
 * Unit tests for Glacia Neural Skill Compiler & Zero-Token Engine.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  compileSolutionIntoSkill,
  executeCompiledLocalSkill,
  listCompiledSkills,
  getNeuralSkillTreeStats,
} from './glaciaNeuralSkillCompiler.ts';

describe('Glacia Neural Skill Compiler', () => {
  it('loads default compiled skills and calculates skill tree stats', () => {
    const skills = listCompiledSkills();
    assert.ok(skills.length >= 3, 'Should load at least 3 default skills');

    const stats = getNeuralSkillTreeStats();
    assert.ok(stats.totalSkillsCount >= 3);
    assert.ok(stats.totalTokensSaved > 0);
    assert.ok(stats.totalDollarSaved > 0);
  });

  it('compiles a new solution into a local skill module', () => {
    const newSkill = compileSolutionIntoSkill({
      name: 'Tự động tính thuế TNCN lũy tiến từng phần',
      description: 'Quy trình tính thuế thu nhập cá nhân theo biểu thuế 7 bậc mới nhất.',
      branch: 'finance_vas',
      runtime: 'node_vm',
      codeTemplate: `
        const income = input.taxableIncome || 20000000;
        return { taxableIncome: income, taxAmount: income * 0.15, calculatedAt: new Date().toISOString() };
      `,
    });

    assert.ok(newSkill.id.startsWith('skill_finance_vas_'));
    assert.equal(newSkill.branch, 'finance_vas');

    const list = listCompiledSkills('finance_vas');
    assert.ok(list.some((s) => s.id === newSkill.id));
  });

  it('executes a compiled local skill with $0 token cost in VM', async () => {
    const skills = listCompiledSkills();
    const targetSkill = skills[0];
    const res = await executeCompiledLocalSkill(targetSkill.id, { testParam: 123 });

    assert.equal(res.success, true);
    assert.ok(res.tokensSaved > 0);
    assert.ok(res.dollarSaved > 0);
    assert.ok(res.durationMs >= 0);
  });
});

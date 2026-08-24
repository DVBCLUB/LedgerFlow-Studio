import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registerSkill,
  getSkill,
  listSkills,
  toggleSkillEnabled,
  createCompositeSkillPipeline,
  listSkillPipelines,
} from './agentSkillMarketplace.ts';

test('agentSkillMarketplace - loads preset skills and registers new skill dynamically', async () => {
  const skills = await listSkills();
  assert.ok(skills.length > 0); // Presets seeded

  const newSkill = await registerSkill({
    name: 'Custom VAS Tax Audit Helper',
    category: 'accounting',
    description: 'Scans tax invoices for TT78 digital signature validity.',
    systemPromptTemplate: 'Check invoice digital signatures according to TT78.',
  });

  assert.ok(newSkill.id);
  assert.equal(newSkill.name, 'Custom VAS Tax Audit Helper');

  const fetched = await getSkill(newSkill.id);
  assert.equal(fetched?.name, 'Custom VAS Tax Audit Helper');
});

test('agentSkillMarketplace - toggles skill enabled state', async () => {
  const skills = await listSkills();
  const target = skills[0];

  const disabled = await toggleSkillEnabled(target.id, false);
  assert.equal(disabled?.enabled, false);

  const activeSkills = await listSkills({ enabledOnly: true });
  assert.equal(activeSkills.some((s) => s.id === target.id), false);
});

test('agentSkillMarketplace - creates composite skill pipeline from multiple registered skills', async () => {
  const skills = await listSkills();
  const skillA = skills[0];
  const skillB = skills[1];

  const pipeline = await createCompositeSkillPipeline({
    name: 'Accounting & Security Audit Pipeline',
    description: 'Runs VAS reconciliation followed by security audit.',
    skillIds: [skillA.id, skillB.id],
  });

  assert.ok(pipeline.id);
  assert.deepEqual(pipeline.skillIds, [skillA.id, skillB.id]);

  const pipelines = await listSkillPipelines();
  assert.ok(pipelines.length > 0);
});


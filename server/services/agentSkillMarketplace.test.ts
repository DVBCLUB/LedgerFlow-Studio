import { describe, it, expect } from 'vitest';
import {
  registerSkill,
  getSkill,
  listSkills,
  toggleSkillEnabled,
  createCompositeSkillPipeline,
  listSkillPipelines,
} from './agentSkillMarketplace.ts';

describe('agentSkillMarketplace', () => {
  it('loads preset skills and registers new skill dynamically', async () => {
    const skills = await listSkills();
    expect(skills.length).toBeGreaterThan(0); // Presets seeded

    const newSkill = await registerSkill({
      name: 'Custom VAS Tax Audit Helper',
      category: 'accounting',
      description: 'Scans tax invoices for TT78 digital signature validity.',
      systemPromptTemplate: 'Check invoice digital signatures according to TT78.',
    });

    expect(newSkill.id).toBeDefined();
    expect(newSkill.name).toBe('Custom VAS Tax Audit Helper');

    const fetched = await getSkill(newSkill.id);
    expect(fetched?.name).toBe('Custom VAS Tax Audit Helper');
  });

  it('toggles skill enabled state', async () => {
    const skills = await listSkills();
    const target = skills[0];

    const disabled = await toggleSkillEnabled(target.id, false);
    expect(disabled?.enabled).toBe(false);

    const activeSkills = await listSkills({ enabledOnly: true });
    expect(activeSkills.some((s) => s.id === target.id)).toBe(false);
  });

  it('creates composite skill pipeline from multiple registered skills', async () => {
    const skills = await listSkills();
    const skillA = skills[0];
    const skillB = skills[1];

    const pipeline = await createCompositeSkillPipeline({
      name: 'Accounting & Security Audit Pipeline',
      description: 'Runs VAS reconciliation followed by security audit.',
      skillIds: [skillA.id, skillB.id],
    });

    expect(pipeline.id).toBeDefined();
    expect(pipeline.skillIds).toEqual([skillA.id, skillB.id]);

    const pipelines = await listSkillPipelines();
    expect(pipelines.length).toBeGreaterThan(0);
  });
});

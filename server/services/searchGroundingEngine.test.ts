import { describe, it, expect } from 'vitest';
import { generateGroundedResponse } from './searchGroundingEngine.ts';

describe('searchGroundingEngine', () => {
  it('generates grounded AI response with citation sources', async () => {
    const res = await generateGroundedResponse('Quy định thuế GTGT Thông tư 78 năm 2026');

    expect(res.id).toBeDefined();
    expect(res.answer).toBeDefined();
    expect(res.sources.length).toBeGreaterThan(0);
    expect(res.answerWithCitations).toContain('GROUNDING CITATIONS');
    expect(res.grounded).toBe(true);
  });
});

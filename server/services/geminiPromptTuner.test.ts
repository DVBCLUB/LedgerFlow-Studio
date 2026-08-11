import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tuneGeminiSystemPrompt } from './geminiPromptTuner.ts';

describe('Milestone 3: Google AI Studio Schema & Prompt Tuning Workbench', () => {
  it('tunes system instructions and applies strict JSON schema validation', () => {
    const result = tuneGeminiSystemPrompt({
      roleName: 'CFO AI Staff',
      basePrompt: 'Phân tích dòng tiền tệ và lập kế hoạch ngân sách hàng tháng.',
    });

    assert.equal(result.roleName, 'CFO AI Staff');
    assert.equal(result.outputSchemaValidation, 'STRICT_JSON_SCHEMA_VALID');
    assert.ok(result.tunedSystemInstruction.includes('Google AI Studio Tuned Instruction'));
    assert.ok(result.schemaDefinition.properties);
  });
});

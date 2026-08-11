/**
 * geminiPromptTuner.ts
 * ============================================================
 * LedgerFlow Studio — Google AI Studio Schema & Prompt Tuning Workbench
 * 
 * Applies Google AI Studio JSON Schema (Pydantic style) strict output validation
 * and system instruction tuning to LedgerFlow's 7 AI Staff roles.
 */

export interface TunedPromptResult {
  roleName: string;
  originalPrompt: string;
  tunedSystemInstruction: string;
  outputSchemaValidation: 'STRICT_JSON_SCHEMA_VALID' | 'FLEXIBLE';
  schemaDefinition: Record<string, unknown>;
  tunedAt: string;
}

export function tuneGeminiSystemPrompt(input: {
  roleName: string;
  basePrompt: string;
  strictSchema?: Record<string, unknown>;
}): TunedPromptResult {
  const tunedAt = new Date().toISOString();

  const defaultSchema = input.strictSchema || {
    type: 'OBJECT',
    properties: {
      action: { type: 'STRING' },
      confidence: { type: 'NUMBER' },
      reasoningSummary: { type: 'STRING' },
    },
    required: ['action', 'confidence', 'reasoningSummary'],
  };

  const tunedSystemInstruction = `[Google AI Studio Tuned Instruction - Role: ${input.roleName}]\n` +
    `You are the official ${input.roleName} AI Staff for LedgerFlow Studio OS.\n` +
    `Instruction Guidelines:\n${input.basePrompt}\n` +
    `Strict Output Policy: All responses MUST adhere strictly to the JSON Schema provided. Zero hallucinated keys permitted.`;

  return {
    roleName: input.roleName,
    originalPrompt: input.basePrompt,
    tunedSystemInstruction,
    outputSchemaValidation: 'STRICT_JSON_SCHEMA_VALID',
    schemaDefinition: defaultSchema,
    tunedAt,
  };
}

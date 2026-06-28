import {
  buildGroundedContextPack,
  requireGroundedContextForHighImpact,
  type GroundedContextPack,
  type GroundedKnowledgeSource,
} from './groundedContextPack.ts';

export interface PipelineStepGroundingInput {
  pipelineId: string;
  pipelineType: string;
  stepId: string;
  stepName: string;
  agentRole: string;
  prompt: string;
  userInput?: Record<string, unknown>;
  memoryContext?: string;
  previousOutputs?: string[];
  highImpact?: boolean;
  additionalSources?: GroundedKnowledgeSource[];
}

export interface PipelineStepGroundingResult {
  pack: GroundedContextPack;
  guard: { ok: true } | { ok: false; error: string };
  groundedPrompt: string;
  sourceCount: number;
  confidence: number;
  contradictionCount: number;
  highImpact: boolean;
}

function compactJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function trimSource(content: string, max = 4000) {
  const compact = content.replace(/\s+/g, ' ').trim();
  return compact.length <= max ? compact : `${compact.slice(0, max - 1)}…`;
}

function buildPipelineStepSources(input: PipelineStepGroundingInput): GroundedKnowledgeSource[] {
  const sources: GroundedKnowledgeSource[] = [
    {
      id: `${input.stepId}:task`,
      kind: 'decision',
      title: `${input.stepName} task brief`,
      content: trimSource(input.prompt),
      tags: ['pipeline-step', input.pipelineType, input.agentRole],
      facts: {
        pipeline_id: input.pipelineId,
        step_id: input.stepId,
        agent_role: input.agentRole,
      },
      confidence: 0.86,
    },
  ];

  if (input.userInput && Object.keys(input.userInput).length) {
    sources.push({
      id: `${input.pipelineId}:input`,
      kind: 'runtime',
      title: `${input.pipelineType} user input`,
      content: trimSource(compactJson(input.userInput)),
      tags: ['pipeline-input', input.pipelineType],
      confidence: 0.82,
    });
  }

  if (input.memoryContext?.trim()) {
    sources.push({
      id: `${input.pipelineId}:company-memory`,
      kind: 'memory',
      title: 'Company memory injected into pipeline',
      content: trimSource(input.memoryContext),
      tags: ['company-memory', input.pipelineType],
      confidence: 0.9,
    });
  }

  for (const [index, output] of (input.previousOutputs || []).entries()) {
    if (!output?.trim()) continue;
    sources.push({
      id: `${input.pipelineId}:previous-output:${index}`,
      kind: 'runtime',
      title: `Previous pipeline output ${index + 1}`,
      content: trimSource(output),
      tags: ['previous-output', input.pipelineType],
      confidence: 0.78,
    });
  }

  return [...sources, ...(input.additionalSources || [])];
}

function buildQuestion(input: PipelineStepGroundingInput) {
  return [
    `Ground the next pipeline step for ${input.agentRole}.`,
    `Pipeline type: ${input.pipelineType}.`,
    `Step: ${input.stepName}.`,
    input.prompt,
  ].join('\n');
}

function buildGroundedPrompt(input: PipelineStepGroundingInput, pack: GroundedContextPack, guard: PipelineStepGroundingResult['guard']) {
  const sourceSummary = pack.sourceMap
    .map((source, index) => `${index + 1}. [${source.kind}] ${source.title} · confidence ${source.confidence.toFixed(2)} · relevance ${source.relevance.toFixed(2)}`)
    .join('\n');
  const warnings = pack.warnings.length ? `\nWarnings:\n${pack.warnings.map((warning) => `- ${warning}`).join('\n')}` : '';
  const contradictions = pack.contradictions.length
    ? `\nContradictions:\n${pack.contradictions.map((item) => `- ${item.factKey}: ${item.values.map((value) => value.value).join(' vs ')}`).join('\n')}`
    : '';

  return [
    '---',
    'GROUNDED PIPELINE CONTEXT',
    `Context Pack: ${pack.id}`,
    `Guard: ${guard.ok ? 'approved' : `blocked — ${guard.error}`}`,
    `Confidence: ${pack.confidence.toFixed(2)}`,
    `Sources: ${pack.sourceMap.length}`,
    sourceSummary,
    warnings,
    contradictions,
    '---',
    pack.context,
    '---',
    'PIPELINE TASK',
    input.prompt,
  ].filter(Boolean).join('\n');
}

export function buildPipelineStepGroundedContext(input: PipelineStepGroundingInput): PipelineStepGroundingResult {
  const highImpact = Boolean(input.highImpact);
  const pack = buildGroundedContextPack({
    question: buildQuestion(input),
    sources: buildPipelineStepSources(input),
    requiredTags: ['pipeline-step'],
    maxSources: 8,
  });
  let guard: PipelineStepGroundingResult['guard'] = { ok: true };

  if (highImpact) {
    try {
      requireGroundedContextForHighImpact(pack);
    } catch (error: any) {
      guard = { ok: false, error: error?.message || String(error) };
    }
  }

  return {
    pack,
    guard,
    groundedPrompt: buildGroundedPrompt(input, pack, guard),
    sourceCount: pack.sourceMap.length,
    confidence: pack.confidence,
    contradictionCount: pack.contradictions.length,
    highImpact,
  };
}

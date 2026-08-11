import assert from 'node:assert/strict';
import test from 'node:test';
import { getAIWorkforceCockpitOverview } from './aiWorkforceCockpit.ts';

test('getAIWorkforceCockpitOverview calculates enterprise autonomy score and telemetry', () => {
  const overview = getAIWorkforceCockpitOverview();

  assert.ok(overview.autonomyScore.score >= 0 && overview.autonomyScore.score <= 100);
  assert.ok(['LEVEL_5_AUTONOMOUS', 'LEVEL_4_HIGH', 'LEVEL_3_MODERATE', 'LEVEL_2_BASIC'].includes(overview.autonomyScore.rating));
  assert.ok(['OPTIMAL', 'DEGRADED', 'ATTENTION_REQUIRED'].includes(overview.healthStatus));
  assert.ok(overview.executiveSummary.length > 20);
  assert.ok(typeof overview.telemetry.totalAgentRuns === 'number');
});

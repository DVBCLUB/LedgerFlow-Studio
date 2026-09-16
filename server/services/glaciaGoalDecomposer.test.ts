import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  decomposeGoal,
  advanceGoalDAG,
  getGoalPlans,
  getGoalPlanById,
} from './glaciaGoalDecomposer.ts';

describe('glaciaGoalDecomposer - Goal Decomposition & DAG Task Engine', () => {
  it('decomposes video marketing goal into specialized DAG subtasks with dependencies', () => {
    const plan = decomposeGoal('Tạo video quảng cáo Reels giới thiệu Glacia Robot');

    assert.ok(plan.id.startsWith('goal_'));
    assert.equal(plan.status, 'planned');
    assert.equal(plan.progressPercentage, 0);
    assert.ok(plan.tasks.length >= 4);

    // First task should be ready with no dependencies
    const firstTask = plan.tasks[0];
    assert.equal(firstTask.dependencies.length, 0);
    assert.equal(firstTask.status, 'ready');

    // Subsequent tasks should have dependencies
    const secondTask = plan.tasks[1];
    assert.ok(secondTask.dependencies.includes(firstTask.id));
    assert.equal(secondTask.status, 'pending');

    assert.ok(plan.totalEstimatedMinutes > 0);
    assert.ok(plan.totalEstimatedTokens > 0);
  });

  it('decomposes software engineering goal into specialized coding DAG', () => {
    const plan = decomposeGoal('Phát triển API và module kiểm định tự động mới');

    assert.ok(plan.tasks.some(t => t.domain === 'code'));
    assert.ok(plan.tasks.some(t => t.domain === 'testing'));
    assert.ok(plan.tasks.some(t => t.domain === 'deployment'));
  });

  it('advances DAG tasks progressively and unlocks dependent subtasks', () => {
    const plan = decomposeGoal('Chiến dịch khảo sát khách hàng SaaS');
    const initialPlan = getGoalPlanById(plan.id);
    assert.ok(initialPlan);

    // Complete first task
    const afterStep1 = advanceGoalDAG(plan.id);
    assert.ok(afterStep1.progressPercentage > 0);
    assert.equal(afterStep1.tasks[0].status, 'completed');

    // The second task that depended on step 1 should now be 'ready'
    const step2Task = afterStep1.tasks.find(t => t.dependencies.includes(afterStep1.tasks[0].id));
    if (step2Task) {
      assert.equal(step2Task.status, 'ready');
    }
  });

  it('decomposes 3D game creation goal into specialized Three.js / WebGPU DAG', () => {
    const plan = decomposeGoal('Phát triển game 3D Three.js WebGPU không gian Valkyrie 60FPS');

    assert.ok(plan.tasks.some(t => t.assignedRobotOrTool?.includes('Valkyrie Game Engineer')));
    assert.ok(plan.tasks.some(t => t.assignedRobotOrTool?.includes('Evolutionary Genetic Shader Engine')));
    assert.ok(plan.tasks.some(t => t.assignedRobotOrTool?.includes('Aegis QA Sentinel')));
  });

  it('decomposes Level 5 Swarm Blackboard & Genetic Breeding goal into consensus DAG', () => {
    const plan = decomposeGoal('Kích hoạt chu trình Level 5 Swarm Blackboard và lai ghép di truyền mã nguồn');

    assert.ok(plan.tasks.some(t => t.assignedRobotOrTool?.includes('Lead Architect Prime')));
    assert.ok(plan.tasks.some(t => t.assignedRobotOrTool?.includes('Swarm Consensus Engine')));
    assert.ok(plan.tasks.some(t => t.assignedRobotOrTool?.includes('Evolutionary Genetic Engine')));
  });

  it('retrieves stored goals from persistence store', () => {
    const allGoals = getGoalPlans();
    assert.ok(Array.isArray(allGoals));
    assert.ok(allGoals.length > 0);
  });
});

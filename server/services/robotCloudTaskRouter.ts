/**
 * robotCloudTaskRouter.ts
 * ============================================================
 * Robot-to-Cloud Dynamic Task Router Engine.
 *
 * Dynamically routes task execution per request:
 *  - Route 1: Web Robot (0% API Cost, Direct Web RPA)
 *  - Route 2: Cloud API Gateway (Fast Cloud Render)
 */

import { emitTelemetryEvent } from './agentTelemetryStream.ts';
import { runDirectWebRobotTask } from './directWebRobotAutomator.ts';
import { offloadTaskToCloud } from './cloudSpecializedBridgeEngine.ts';

export interface TaskRouteDecision {
  taskId: string;
  selectedRoute: 'web_robot' | 'cloud_api';
  targetName: string;
  costSavedUsd: number;
  reason: string;
}

export async function routeTaskSmart(
  taskTitle: string,
  category: 'video_gen' | 'script_gen' | 'game_build' | 'social_post',
  isUrgent: boolean = false
): Promise<TaskRouteDecision> {
  const taskId = `route_${Date.now()}`;

  // Smart decision rule
  if (!isUrgent) {
    // Route to Web Robot for 0% API Cost
    const robotMap = {
      video_gen: 'robot_runway_web',
      script_gen: 'robot_chatgpt_web',
      game_build: 'robot_youtube_web',
      social_post: 'robot_tiktok_web',
    };

    const robotId = robotMap[category] || 'robot_tiktok_web';
    await runDirectWebRobotTask(robotId, taskTitle);

    const decision: TaskRouteDecision = {
      taskId,
      selectedRoute: 'web_robot',
      targetName: `Web Robot (${robotId})`,
      costSavedUsd: 2.50,
      reason: 'Đã tự động chọn Web Robot để tiết kiệm 100% chi phí API.',
    };

    emitTelemetryEvent({
      category: 'agent_runtime',
      eventType: 'task_routed_web_robot',
      source: 'robot_cloud_task_router',
      summary: `Smart Routed "${taskTitle}" to Web Robot (0% API cost).`,
      payload: { taskId, decision },
    });

    return decision;
  } else {
    // Route to Cloud API Gateway for Fast Execution
    const bridgeMap = {
      video_gen: 'bridge_runway',
      script_gen: 'bridge_elevenlabs',
      game_build: 'bridge_github_ci',
      social_post: 'bridge_social_publisher',
    };

    const bridgeId = bridgeMap[category] || 'bridge_runway';
    await offloadTaskToCloud(bridgeId, taskTitle, {});

    const decision: TaskRouteDecision = {
      taskId,
      selectedRoute: 'cloud_api',
      targetName: `Cloud API (${bridgeId})`,
      costSavedUsd: 0,
      reason: 'Tác vụ gấp: Đã chọn Cloud API Render Tốc độ cao.',
    };

    emitTelemetryEvent({
      category: 'agent_runtime',
      eventType: 'task_routed_cloud_api',
      source: 'robot_cloud_task_router',
      summary: `Smart Routed "${taskTitle}" to Cloud API.`,
      payload: { taskId, decision },
    });

    return decision;
  }
}

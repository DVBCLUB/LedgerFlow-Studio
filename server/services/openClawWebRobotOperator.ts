import { simulateRobotCommand, type RobotCommandType, type RobotPosition6DOF } from './robotConnector';
import { executeWebAIAutomation } from './webAiAutomator';

export interface OpenClawRobotInstruction {
  prompt: string;
  targetWebAIProfile: string;
  consensusMode: boolean;
  numberOfProfiles?: number;
  approvalPhrase?: string;
}

export interface RobotExecutionPlan {
  commands: {
    command: RobotCommandType;
    position?: RobotPosition6DOF;
    velocity?: number;
    gripAngle?: number;
  }[];
  riskLevel: 'LOW' | 'HIGH' | 'BLOCKED';
  consensusReached?: boolean;
}

// Check payload for potential secrets/sensitive data
function filterSecrets(prompt: string): string {
  // Simple heuristic: block out things that look like keys
  return prompt.replace(/(sk-[a-zA-Z0-9]{20,})|(Bearer\s+[a-zA-Z0-9\-\._~+\/]+=*)/g, '[REDACTED_SECRET]');
}

function evaluateRisk(plan: any): 'LOW' | 'HIGH' | 'BLOCKED' {
  let hasHighRisk = false;
  if (!plan || !Array.isArray(plan.commands)) return 'BLOCKED';
  
  for (const cmd of plan.commands) {
    if (['move', 'grip', 'calibrate'].includes(cmd.command)) {
      hasHighRisk = true;
    }
  }
  return hasHighRisk ? 'HIGH' : 'LOW';
}

async function fetchJSONPlanFromWebAI(profileId: string, instruction: string): Promise<any> {
  const safeInstruction = filterSecrets(instruction);
  const prompt = `You are a Robot Planner. Translate the user request into a JSON array of robot commands.
Schema: { "commands": [ { "command": "move|grip|stop|home|inspect", "position": { "x": 0, "y": 0, "z": 0 }, "velocity": 25, "gripAngle": 90 } ] }
Request: ${safeInstruction}
Return ONLY valid JSON.`;

  try {
    const result = await executeWebAIAutomation(
      profileId.split('_')[0] || 'chatgpt',
      prompt,
      undefined,
      { profileId: profileId }
    );
    
    // Parse result (assuming result.text contains the JSON text)
    const jsonStr = result.text?.match(/\{[\s\S]*\}/)?.[0];
    if (jsonStr) {
      return JSON.parse(jsonStr);
    }
  } catch (err) {
    console.error('Web AI extraction failed', err);
  }
  return null;
}

export async function preflightRobotPlan(input: OpenClawRobotInstruction): Promise<RobotExecutionPlan> {
  const plans: any[] = [];
  
  if (input.consensusMode) {
    const runs = input.numberOfProfiles || 3;
    const promises = Array.from({ length: runs }).map(() => fetchJSONPlanFromWebAI(input.targetWebAIProfile, input.prompt));
    const results = await Promise.all(promises);
    plans.push(...results.filter(r => r !== null));
  } else {
    const plan = await fetchJSONPlanFromWebAI(input.targetWebAIProfile, input.prompt);
    if (plan) plans.push(plan);
  }

  if (plans.length === 0) {
    return { commands: [], riskLevel: 'BLOCKED', consensusReached: false };
  }

  // Consensus check: verify if the first command type matches across all successful plans
  let consensusReached = true;
  if (input.consensusMode && plans.length > 1) {
    const firstCmd = plans[0].commands?.[0]?.command;
    for (const p of plans) {
      if (p.commands?.[0]?.command !== firstCmd) {
        consensusReached = false;
        break;
      }
    }
  }

  const finalPlan = plans[0]; // Take the first valid plan
  const riskLevel = evaluateRisk(finalPlan);

  return {
    commands: finalPlan.commands || [],
    riskLevel,
    consensusReached
  };
}

export async function executeRobotPlan(plan: RobotExecutionPlan, approvalPhrase?: string) {
  if (plan.riskLevel === 'BLOCKED') {
    throw new Error('Plan is blocked due to safety violations.');
  }

  const results = [];
  for (const cmd of plan.commands) {
    if (['move', 'grip', 'calibrate'].includes(cmd.command) && approvalPhrase !== 'APPROVE ROBOT SIMULATION') {
      throw new Error(`Command ${cmd.command} requires approvalPhrase: "APPROVE ROBOT SIMULATION"`);
    }

    const res = simulateRobotCommand({
      ...cmd,
      approvalPhrase
    });
    results.push(res);
  }

  return results;
}

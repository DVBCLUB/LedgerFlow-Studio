export const AGENT_TOOL_IDS = [
  'read_knowledge',
  'draft_plan',
  'draft_patch',
  'browser_check',
  'terminal_check',
  'external_connector',
  'analyse_data',
  'generate_report',
  'send_notification',
  'search_web_context',
  'robot_inspect',
  'robot_move',
  'github_create_draft_pr',
  'github_pull_local',
] as const;

export type AgentToolId = typeof AGENT_TOOL_IDS[number];

export function isAgentToolId(value: string): value is AgentToolId {
  return (AGENT_TOOL_IDS as readonly string[]).includes(value);
}

type WorkspaceSubtabAliasMap = Record<string, Record<string, string>>;

export const WORKSPACE_SUBTAB_ALIASES: WorkspaceSubtabAliasMap = {
  ceo_command: {
    overview: 'brief',
    standup: 'daily_weekly',
    daily: 'daily_weekly',
    weekly: 'daily_weekly',
    knowledge: 'library',
    sop_risk: 'sop_rd',
    sop: 'sop_rd',
    risk: 'sop_rd',
  },
  product_studio: {
    ideas_moat: 'strategy',
    dev_hub: 'roadmap',
    tasks_progress: 'roadmap',
    pricing: 'offer_pricing',
    pricing_lab: 'offer_pricing',
    deploy: 'launch_readiness',
    game_studio: 'launch_readiness',
  },
  growth_sales: {
    campaign_lab: 'dashboard',
    rollout_qa: 'dashboard',
    content_zalo: 'content_studio',
    video_lab: 'content_studio',
    leads_outreach: 'sales_crm',
    ltv_nps: 'retention_partners',
    affiliate: 'retention_partners',
    pricing_lab: 'dashboard',
  },
  finance_accounting: {
    revenue: 'cashflow',
    founder_review: 'cashflow',
    runway_advisory: 'cashflow',
    coso: 'audit',
    audit_control: 'audit',
  },
  ai_staff_sandbox: {
    staff_assistants: 'agents',
    ai_ops: 'overview',
    robot_lab: 'automations',
    automation_rules: 'automations',
    prompt_labs: 'knowledge_prompts',
    project_memory: 'knowledge_prompts',
    python_sql: 'labs',
    browser_sim: 'automations',
    financial_ds: 'labs',
    ai_game_studio: 'labs',
    simulation: 'labs',
  },
  system_settings: {
    connections: 'integrations',
    audit: 'backup_data',
    build_monitor: 'developer_console',
    config_health: 'developer_console',
    merge_readiness: 'developer_console',
    pr_control: 'developer_console',
    patch_diff: 'developer_console',
    release_artifact: 'developer_console',
    rollback: 'developer_console',
    sandbox_patch: 'developer_console',
    ci_recovery: 'developer_console',
    ci_run: 'developer_console',
    dev_handoff: 'developer_console',
    ci_doctor: 'developer_console',
    approved_pr: 'developer_console',
  },
};

export function resolveWorkspaceSubTab(
  workspaceId: string,
  requestedSubTabId: string | undefined,
  validSubTabIds: readonly string[],
): string | undefined {
  if (!requestedSubTabId) return undefined;
  if (validSubTabIds.includes(requestedSubTabId)) return requestedSubTabId;

  const alias = WORKSPACE_SUBTAB_ALIASES[workspaceId]?.[requestedSubTabId];
  if (alias && validSubTabIds.includes(alias)) return alias;

  return undefined;
}

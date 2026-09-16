/**
 * server/services/glaciaBusinessRulesDSL.ts
 * Domain-Specific Language (DSL) cho Quy tắc Tự động hóa Doanh nghiệp của Glacia (Frontier 3).
 */

export interface BusinessRuleAction {
  actionId: string;
  type:
    | 'send_telegram_report'
    | 'generate_financial_pdf'
    | 'run_night_autopilot'
    | 'scan_competitor_radar'
    | 'audit_vas_ledger'
    | 'run_swe_repair'
    | 'trigger_marketing_campaign';
  params: Record<string, any>;
  description: string;
}

export interface BusinessRuleCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_empty';
  value: any;
}

export interface GlaciaBusinessRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: 'cron_schedule' | 'event_webhook' | 'financial_anomaly' | 'manual_voice';
  cronExpression?: string;
  eventPattern?: string;
  conditions: BusinessRuleCondition[];
  actions: BusinessRuleAction[];
  lastRunAt?: string;
  executionCount: number;
  createdAt: string;
}

const WHITELISTED_ACTION_TYPES = new Set([
  'send_telegram_report',
  'generate_financial_pdf',
  'run_night_autopilot',
  'scan_competitor_radar',
  'audit_vas_ledger',
  'run_swe_repair',
  'trigger_marketing_campaign',
]);

export function validateBusinessRule(rule: Partial<GlaciaBusinessRule>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!rule.name || rule.name.trim().length === 0) {
    errors.push('Tên quy tắc không được để trống.');
  }

  if (!rule.trigger) {
    errors.push('Thiếu trigger kích hoạt quy tắc.');
  }

  if (rule.trigger === 'cron_schedule' && !rule.cronExpression) {
    errors.push('Trigger lịch định kỳ bắt buộc phải có cronExpression.');
  }

  if (!rule.actions || rule.actions.length === 0) {
    errors.push('Quy tắc phải chứa ít nhất 1 hành động.');
  } else {
    for (const act of rule.actions) {
      if (!WHITELISTED_ACTION_TYPES.has(act.type)) {
        errors.push(`Hành động không hợp lệ hoặc nằm ngoài danh mục an toàn: ${act.type}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function serializeRuleToYaml(rule: GlaciaBusinessRule): string {
  const lines: string[] = [
    `# Glacia Autonomous Business Rule: ${rule.name}`,
    `id: "${rule.id}"`,
    `name: "${rule.name}"`,
    `description: "${rule.description}"`,
    `isActive: ${rule.isActive}`,
    `trigger: "${rule.trigger}"`,
  ];

  if (rule.cronExpression) {
    lines.push(`cronExpression: "${rule.cronExpression}"`);
  }

  lines.push('conditions:');
  for (const c of rule.conditions) {
    lines.push(`  - field: "${c.field}"`);
    lines.push(`    operator: "${c.operator}"`);
    lines.push(`    value: ${typeof c.value === 'string' ? `"${c.value}"` : c.value}`);
  }

  lines.push('actions:');
  for (const a of rule.actions) {
    lines.push(`  - actionId: "${a.actionId}"`);
    lines.push(`    type: "${a.type}"`);
    lines.push(`    description: "${a.description}"`);
    lines.push(`    params: ${JSON.stringify(a.params)}`);
  }

  return lines.join('\n');
}

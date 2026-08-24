/**
 * rbacEngine.ts
 * ============================================================
 * Enterprise Role-Based Access Control (RBAC) Engine for LedgerFlow OS.
 *
 * Defines granular permissions across all 12 Company OS Workspaces:
 *  - Roles: 'owner' | 'founder' | 'admin' | 'manager' | 'cfo' | 'accountant' | 'devops' | 'ai_agent'
 *  - Permissions: Read, Write, Approve, Execute, Admin
 *  - Policy evaluation middleware & session validator
 */

export type UserRole =
  | 'owner'
  | 'founder'
  | 'admin'
  | 'manager'
  | 'cfo'
  | 'accountant'
  | 'developer'
  | 'devops'
  | 'sales_rep'
  | 'ai_agent'
  | 'viewer';

export type WorkspaceModuleId =
  | 'ceo_command'
  | 'knowledge_library'
  | 'ai_factory'
  | 'product_studio'
  | 'marketing_growth'
  | 'sales_crm'
  | 'finance_accounting'
  | 'projects_delivery'
  | 'documents_approval'
  | 'analytics'
  | 'system_settings';

export interface RolePolicy {
  role: UserRole;
  label: string;
  description: string;
  allowedWorkspaces: WorkspaceModuleId[];
  canApproveHighRisk: boolean;
  canExecuteCode: boolean;
  canManageSecrets: boolean;
  maxDailyExpenseApprovalVnd: number;
}

// ─── Default Policies ─────────────────────────────────────────────────────────

export const ROLE_POLICIES: Record<UserRole, RolePolicy> = {
  owner: {
    role: 'owner',
    label: '👑 Solo Founder / Owner',
    description: 'Quyền hạn tối cao toàn hệ thống — duyệt mọi quyết định và xem toàn bộ dữ liệu.',
    allowedWorkspaces: [
      'ceo_command', 'knowledge_library', 'ai_factory', 'product_studio',
      'marketing_growth', 'sales_crm', 'finance_accounting', 'projects_delivery',
      'documents_approval', 'analytics', 'system_settings',
    ],
    canApproveHighRisk: true,
    canExecuteCode: true,
    canManageSecrets: true,
    maxDailyExpenseApprovalVnd: Infinity,
  },
  founder: {
    role: 'founder',
    label: '🚀 Co-Founder / Executive',
    description: 'Đồng sáng lập — toàn quyền điều hành kinh doanh, sản phẩm và tài chính.',
    allowedWorkspaces: [
      'ceo_command', 'knowledge_library', 'ai_factory', 'product_studio',
      'marketing_growth', 'sales_crm', 'finance_accounting', 'projects_delivery',
      'documents_approval', 'analytics', 'system_settings',
    ],
    canApproveHighRisk: true,
    canExecuteCode: true,
    canManageSecrets: true,
    maxDailyExpenseApprovalVnd: 500_000_000,
  },
  admin: {
    role: 'admin',
    label: '🛡️ System Administrator',
    description: 'Quản trị viên hạ tầng, tài khoản và cấu hình hệ thống.',
    allowedWorkspaces: ['ceo_command', 'ai_factory', 'analytics', 'system_settings'],
    canApproveHighRisk: false,
    canExecuteCode: true,
    canManageSecrets: true,
    maxDailyExpenseApprovalVnd: 10_000_000,
  },
  cfo: {
    role: 'cfo',
    label: '💰 Chief Financial Officer (AI / Human)',
    description: 'Quản trị tài chính, dòng tiền, hạch toán VAS 200 và hóa đơn thuế.',
    allowedWorkspaces: ['ceo_command', 'finance_accounting', 'documents_approval', 'analytics'],
    canApproveHighRisk: false,
    canExecuteCode: false,
    canManageSecrets: false,
    maxDailyExpenseApprovalVnd: 50_000_000,
  },
  accountant: {
    role: 'accountant',
    label: '📑 Kế Toán Viên',
    description: 'Nhập liệu chứng từ, kiểm tra đối chiếu sổ cái và xuất hóa đơn điện tử.',
    allowedWorkspaces: ['finance_accounting', 'documents_approval'],
    canApproveHighRisk: false,
    canExecuteCode: false,
    canManageSecrets: false,
    maxDailyExpenseApprovalVnd: 5_000_000,
  },
  manager: {
    role: 'manager',
    label: '👔 Operations Manager',
    description: 'Quản lý dự án triển khai, tiến độ giao hàng và chăm sóc khách hàng.',
    allowedWorkspaces: ['sales_crm', 'projects_delivery', 'documents_approval', 'marketing_growth'],
    canApproveHighRisk: false,
    canExecuteCode: false,
    canManageSecrets: false,
    maxDailyExpenseApprovalVnd: 20_000_000,
  },
  developer: {
    role: 'developer',
    label: '💻 Kỹ Sư Phần Mềm',
    description: 'Phát triển sản phẩm, sửa lỗi code và thực thi sandbox.',
    allowedWorkspaces: ['product_studio', 'knowledge_library', 'ai_factory', 'analytics'],
    canApproveHighRisk: false,
    canExecuteCode: true,
    canManageSecrets: false,
    maxDailyExpenseApprovalVnd: 0,
  },
  devops: {
    role: 'devops',
    label: '⚡ DevOps / SRE',
    description: 'Vận hành CI/CD, hạ tầng đám mây và giám sát tự phục hồi.',
    allowedWorkspaces: ['product_studio', 'ai_factory', 'system_settings'],
    canApproveHighRisk: false,
    canExecuteCode: true,
    canManageSecrets: true,
    maxDailyExpenseApprovalVnd: 10_000_000,
  },
  sales_rep: {
    role: 'sales_rep',
    label: '🎯 Chuyên Viên Kinh Doanh',
    description: 'Quản lý lead, chăm sóc khách hàng và soạn thảo báo giá ban đầu.',
    allowedWorkspaces: ['sales_crm', 'marketing_growth', 'knowledge_library'],
    canApproveHighRisk: false,
    canExecuteCode: false,
    canManageSecrets: false,
    maxDailyExpenseApprovalVnd: 0,
  },
  ai_agent: {
    role: 'ai_agent',
    label: '🤖 Autonomous AI Worker',
    description: 'Nhân viên AI tự động — bị ràng buộc bởi Circuit Breaker & HITL Gateways.',
    allowedWorkspaces: [
      'ceo_command', 'knowledge_library', 'ai_factory', 'product_studio',
      'marketing_growth', 'sales_crm', 'finance_accounting', 'projects_delivery',
      'documents_approval', 'analytics',
    ],
    canApproveHighRisk: false,
    canExecuteCode: false, // Must request human approval for high risk actions
    canManageSecrets: false,
    maxDailyExpenseApprovalVnd: 5_000_000, // strictly capped
  },
  viewer: {
    role: 'viewer',
    label: '👀 Khách Xem / Audit',
    description: 'Chỉ xem báo cáo và dashboard tổng quan không can thiệp dữ liệu.',
    allowedWorkspaces: ['ceo_command', 'analytics'],
    canApproveHighRisk: false,
    canExecuteCode: false,
    canManageSecrets: false,
    maxDailyExpenseApprovalVnd: 0,
  },
};

// ─── Verification Functions ───────────────────────────────────────────────────

/**
 * Checks whether a given role can access a specific workspace.
 */
export function canAccessWorkspace(role: UserRole, workspace: WorkspaceModuleId): boolean {
  const policy = ROLE_POLICIES[role];
  if (!policy) return false;
  return policy.allowedWorkspaces.includes(workspace);
}

/**
 * Checks whether a role can perform an action with the specified expense amount.
 */
export function canApproveExpense(role: UserRole, amountVnd: number): boolean {
  const policy = ROLE_POLICIES[role];
  if (!policy) return false;
  return amountVnd <= policy.maxDailyExpenseApprovalVnd;
}

/**
 * Returns list of all defined roles and their policy specs.
 */
export function listRolePolicies(): RolePolicy[] {
  return Object.values(ROLE_POLICIES);
}

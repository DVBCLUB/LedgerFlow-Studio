import React, { useState, useEffect } from 'react';

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

export interface RolePolicy {
  role: UserRole;
  label: string;
  description: string;
  allowedWorkspaces: string[];
  canApproveHighRisk: boolean;
  canExecuteCode: boolean;
  canManageSecrets: boolean;
  maxDailyExpenseApprovalVnd: number;
}

const DEFAULT_POLICIES: RolePolicy[] = [
  {
    role: 'owner',
    label: '👑 Solo Founder / Owner',
    description: 'Quyền hạn tối cao toàn hệ thống — duyệt mọi quyết định và xem toàn bộ dữ liệu.',
    allowedWorkspaces: ['ceo_command', 'knowledge_library', 'ai_factory', 'product_studio', 'marketing_growth', 'sales_crm', 'finance_accounting', 'projects_delivery', 'documents_approval', 'analytics', 'system_settings'],
    canApproveHighRisk: true,
    canExecuteCode: true,
    canManageSecrets: true,
    maxDailyExpenseApprovalVnd: Infinity,
  },
  {
    role: 'founder',
    label: '🚀 Co-Founder / Executive',
    description: 'Đồng sáng lập — toàn quyền điều hành kinh doanh, sản phẩm và tài chính.',
    allowedWorkspaces: ['ceo_command', 'knowledge_library', 'ai_factory', 'product_studio', 'marketing_growth', 'sales_crm', 'finance_accounting', 'projects_delivery', 'documents_approval', 'analytics', 'system_settings'],
    canApproveHighRisk: true,
    canExecuteCode: true,
    canManageSecrets: true,
    maxDailyExpenseApprovalVnd: 500_000_000,
  },
  {
    role: 'admin',
    label: '🛡️ System Administrator',
    description: 'Quản trị viên hạ tầng, tài khoản và cấu hình hệ thống.',
    allowedWorkspaces: ['ceo_command', 'ai_factory', 'analytics', 'system_settings'],
    canApproveHighRisk: false,
    canExecuteCode: true,
    canManageSecrets: true,
    maxDailyExpenseApprovalVnd: 10_000_000,
  },
  {
    role: 'cfo',
    label: '💰 Chief Financial Officer',
    description: 'Quản trị tài chính, dòng tiền, hạch toán VAS 200 và hóa đơn thuế.',
    allowedWorkspaces: ['ceo_command', 'finance_accounting', 'documents_approval', 'analytics'],
    canApproveHighRisk: false,
    canExecuteCode: false,
    canManageSecrets: false,
    maxDailyExpenseApprovalVnd: 50_000_000,
  },
  {
    role: 'ai_agent',
    label: '🤖 Autonomous AI Worker',
    description: 'Nhân viên AI tự động — bị ràng buộc bởi Circuit Breaker & HITL Gateways.',
    allowedWorkspaces: ['ceo_command', 'knowledge_library', 'ai_factory', 'product_studio', 'marketing_growth', 'sales_crm', 'finance_accounting', 'projects_delivery', 'documents_approval', 'analytics'],
    canApproveHighRisk: false,
    canExecuteCode: false,
    canManageSecrets: false,
    maxDailyExpenseApprovalVnd: 5_000_000,
  },
];

export default function RBACManagementPanel() {
  const [policies, setPolicies] = useState<RolePolicy[]>(DEFAULT_POLICIES);
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');

  useEffect(() => {
    fetch('/api/dormant/rbac/policies')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data?.policies) {
          setPolicies(data.policies);
        }
      })
      .catch(() => {});
  }, []);

  const currentPolicy = policies.find(p => p.role === selectedRole);

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-white">⚖️ Phân Quyền &amp; Quản Trị Vai Trò (RBAC)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý ma trận phân quyền 11 vai trò Người dùng &amp; AI Agents</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-violet-950/40 border border-violet-500/30 text-xs text-violet-300 font-semibold">
          🛡️ Enterprise Policy Engine
        </span>
      </div>

      {/* Role Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {policies.map(p => (
          <button
            key={p.role}
            onClick={() => setSelectedRole(p.role)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedRole === p.role
                ? 'bg-violet-600/20 border-violet-500 text-white shadow-md'
                : 'bg-white/3 border-white/6 text-slate-400 hover:bg-white/6 hover:text-slate-200'
            }`}
          >
            <p className="text-xs font-bold truncate">{p.label}</p>
            <p className="text-[10px] text-slate-500 mt-1">{p.allowedWorkspaces.length} Phân hệ</p>
          </button>
        ))}
      </div>

      {/* Selected Policy Detail */}
      {currentPolicy && (
        <div className="p-5 rounded-xl bg-white/3 border border-white/8 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">{currentPolicy.label}</h3>
            <p className="text-xs text-slate-400 mt-1">{currentPolicy.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-white/6">
            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
              <p className="text-[10px] text-slate-500">Duyệt Quyết Định High Risk</p>
              <p className={`text-xs font-bold mt-1 ${currentPolicy.canApproveHighRisk ? 'text-emerald-400' : 'text-slate-500'}`}>
                {currentPolicy.canApproveHighRisk ? '✅ Được phép' : '❌ Không được phép'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
              <p className="text-[10px] text-slate-500">Thực Thi Sandbox Code</p>
              <p className={`text-xs font-bold mt-1 ${currentPolicy.canExecuteCode ? 'text-emerald-400' : 'text-slate-500'}`}>
                {currentPolicy.canExecuteCode ? '✅ Được phép' : '❌ Bị chặn'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
              <p className="text-[10px] text-slate-500">Quản Lý Secret Vault</p>
              <p className={`text-xs font-bold mt-1 ${currentPolicy.canManageSecrets ? 'text-emerald-400' : 'text-slate-500'}`}>
                {currentPolicy.canManageSecrets ? '✅ Toàn quyền' : '❌ Không có quyền'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
              <p className="text-[10px] text-slate-500">Hạn Mức Chi Hàng Ngày</p>
              <p className="text-xs font-bold text-violet-400 mt-1">
                {currentPolicy.maxDailyExpenseApprovalVnd === Infinity
                  ? 'Không giới hạn'
                  : currentPolicy.maxDailyExpenseApprovalVnd === 0
                  ? '0 VND'
                  : `${(currentPolicy.maxDailyExpenseApprovalVnd / 1_000_000).toLocaleString()}M VND`}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-white/6">
            <p className="text-xs font-semibold text-slate-300 mb-2">Phân hệ được phép truy cập:</p>
            <div className="flex flex-wrap gap-1.5">
              {currentPolicy.allowedWorkspaces.map(ws => (
                <span key={ws} className="px-2.5 py-1 rounded-lg bg-violet-950/40 border border-violet-500/30 text-[10px] text-violet-300 font-medium">
                  {ws}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

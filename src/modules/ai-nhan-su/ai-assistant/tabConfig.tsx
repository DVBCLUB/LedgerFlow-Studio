import React from 'react';
import { Bot, Code2, User, Terminal, Users, RefreshCw, Clock, TrendingUp, Shield, Activity, DollarSign, CircleDot, FileSearch, HardDrive, Zap, FlaskConical } from 'lucide-react';

// ── Tab identifiers ──────────────────────────────────────────────────────────
export type PanelTab = 'chat' | 'edit' | 'diff' | 'backups' | 'status' | 'search' | 'profiles' | 'sandbox' | 'runbook' | 'agent_loop' | 'multi_agent' | 'cost' | 'ab_test' | 'analytics' | 'pipeline' | 'terminal' | 'control' | 'overview';
export type EngineMode = 'api' | 'web_automation' | 'fabric';

// ── Developer tabs (shown under Dev Tools toggle) ────────────────────────────
export const DEV_TABS: PanelTab[] = ['edit', 'profiles', 'search', 'diff', 'backups', 'runbook', 'agent_loop', 'multi_agent', 'cost', 'ab_test', 'analytics', 'pipeline', 'terminal'];

// ── Tab category definition ──────────────────────────────────────────────────
export interface SubTabDef {
  id: PanelTab;
  label: string;
  icon: React.ReactNode;
}

export interface TabCategory {
  id: string;
  label: string;
  subTabs: SubTabDef[];
}

// ── Core categories ──────────────────────────────────────────────────────────
export const CORE_CATEGORIES: TabCategory[] = [
  {
    id: 'chat_workspace',
    label: '💬 Trợ lý AI',
    subTabs: [
      { id: 'chat' as PanelTab, label: 'Hội thoại & Ra lệnh', icon: <Bot className="h-3.5 w-3.5" /> },
      { id: 'edit' as PanelTab, label: 'Chỉnh sửa Mã nguồn', icon: <Code2 className="h-3.5 w-3.5" /> },
    ]
  },
  {
    id: 'agent_staff',
    label: '🤖 Đội ngũ AI',
    subTabs: [
      { id: 'profiles' as PanelTab, label: 'Profile & Tài khoản', icon: <User className="h-3.5 w-3.5" /> },
      { id: 'sandbox' as PanelTab, label: 'Web AI Automation', icon: <Terminal className="h-3.5 w-3.5" /> },
      { id: 'multi_agent' as PanelTab, label: 'Phối hợp Multi-Agent', icon: <Users className="h-3.5 w-3.5" /> },
      { id: 'agent_loop' as PanelTab, label: 'Vòng lặp Tự chủ', icon: <RefreshCw className="h-3.5 w-3.5" /> },
      { id: 'runbook' as PanelTab, label: 'Browser Runbook', icon: <Clock className="h-3.5 w-3.5" /> },
    ]
  },
  {
    id: 'control_center',
    label: '📊 Giám sát & Điều phối',
    subTabs: [
      { id: 'overview' as PanelTab, label: 'Tổng quan', icon: <TrendingUp className="h-3.5 w-3.5" /> },
      { id: 'control' as PanelTab, label: 'Control Plane', icon: <Shield className="h-3.5 w-3.5" /> },
      { id: 'analytics' as PanelTab, label: 'Phân tích', icon: <Activity className="h-3.5 w-3.5" /> },
      { id: 'cost' as PanelTab, label: 'Chi phí & Quota', icon: <DollarSign className="h-3.5 w-3.5" /> },
      { id: 'status' as PanelTab, label: 'Trạng thái', icon: <CircleDot className="h-3.5 w-3.5" /> },
    ]
  }
];

// ── Advanced tools category ──────────────────────────────────────────────────
export const ADVANCED_CATEGORY: TabCategory = {
  id: 'advanced_tools',
  label: '🛠️ Công cụ nâng cao',
  subTabs: [
    { id: 'search' as PanelTab, label: 'Tra cứu Codebase', icon: <FileSearch className="h-3.5 w-3.5" /> },
    { id: 'diff' as PanelTab, label: 'Diff & So sánh', icon: <Code2 className="h-3.5 w-3.5" /> },
    { id: 'backups' as PanelTab, label: 'Backups', icon: <HardDrive className="h-3.5 w-3.5" /> },
    { id: 'pipeline' as PanelTab, label: 'Pipeline', icon: <Zap className="h-3.5 w-3.5" /> },
    { id: 'ab_test' as PanelTab, label: 'A/B Test', icon: <FlaskConical className="h-3.5 w-3.5" /> },
    { id: 'terminal' as PanelTab, label: 'Terminal Live', icon: <Terminal className="h-3.5 w-3.5" /> },
  ]
};

// ── Helper: all categories combined ──────────────────────────────────────────
export const ALL_CATEGORIES = [...CORE_CATEGORIES, ADVANCED_CATEGORY];

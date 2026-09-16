import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  CheckCircle,
  Code,
  Coins,
  CreditCard,
  Database,
  FileCheck2,
  FileText,
  FolderKanban,
  Globe2,
  GraduationCap,
  Landmark,
  Leaf,
  Mail,
  Network,
  PhoneCall,
  Rocket,
  Scale,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TestTubeDiagonal,
  TrendingUp,
  Truck,
  UserCheck,
  Users2,
  UsersRound,
  Wifi,
  Zap,
  Cpu,
  Cloud,
  Film,
  Gamepad2,
} from 'lucide-react';

export type WorkspaceSubtabTier = 'core' | 'advanced' | 'dev';

export interface WorkspaceSubtab {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string;
  badgeColor?: string;
  tier?: WorkspaceSubtabTier;
}

export const SEGMENT_CORE_IDS: Record<string, string[]> = {
  ceo_command: ['today', 'boardroom', 'dept_health', 'activity_stream'],
  knowledge_library: ['rag_simulator', 'library', 'operating_layer'],
  product_studio: ['games_ml', 'portfolio', 'ideation', 'game_builder'],
  marketing_growth: ['content', 'campaigns', 'competitor_radar'],
  sales_crm: ['funnel_lab', 'customer_health', 'pricing_ltv'],
  finance_accounting: ['cashflow', 'cashflow_forecast', 'ledger'],
  projects_delivery: ['portfolio', 'industry_templates'],
  documents_approval: ['approvals', 'audit'],
  ai_factory: ['command', 'autonomous_flywheel', 'nexus_cockpit'],
  analytics: ['predictive_revenue', 'simulations', 'python_sandbox'],
  system_settings: ['general', 'security', 'connectors', 'delegation_matrix'],
  operations: ['portfolio'],
};

export const SUB_TABS_CONFIG: Record<string, WorkspaceSubtab[]> = {
  ceo_command: [
    { id: 'today', label: '⚡ Quyết Định Hôm Nay & Vận Hành', icon: Zap, tier: 'core' },
    { id: 'boardroom', label: '🏛️ Họp HĐQT AI', icon: UsersRound, tier: 'core' },
    { id: 'dept_health', label: '📊 Sức Khỏe 5 Khối Vận Hành', icon: ShieldCheck, tier: 'core' },
    { id: 'activity_stream', label: '🛰️ Dòng Sự Kiện Thời Gian Thực', icon: Activity, tier: 'core' },
  ],
  knowledge_library: [
    { id: 'rag_simulator', label: '🔍 Tra Cứu Thông Minh (RAG)', icon: Sparkles, tier: 'core' },
    { id: 'library', label: '📚 Thư Viện Tri Thức Doanh Nghiệp', icon: BookOpen, tier: 'core' },
    { id: 'operating_layer', label: '🗄️ Tầng Tri Thức Vận Hành', icon: Database, tier: 'core' },
  ],
  product_studio: [
    { id: 'games_ml', label: '🎮 Xưởng Game & Đồ Họa 3D', icon: Gamepad2, tier: 'core' },
    { id: 'portfolio', label: '📱 Danh Mục Sản Phẩm & Lộ Trình', icon: FolderKanban, tier: 'core' },
    { id: 'ideation', label: '💡 Xưởng Sáng Tạo Ý Tưởng', icon: Sparkles, tier: 'core' },
    { id: 'game_builder', label: '🛠️ Trình Dựng Game Tự Trị', icon: Code, tier: 'core' },
  ],
  marketing_growth: [
    { id: 'content', label: '🎬 Xưởng Sản Xuất Video AI & Nội Dung', icon: Film, tier: 'core' },
    { id: 'campaigns', label: '🚀 Chiến Dịch Tiếp Thị & Tăng Trưởng', icon: Rocket, tier: 'core' },
    { id: 'competitor_radar', label: '🎯 Radar Đối Thủ Cạnh Tranh', icon: Target, tier: 'core' },
  ],
  sales_crm: [
    { id: 'funnel_lab', label: '📊 Phễu Bán Hàng & Lead Scoring', icon: BarChart3, tier: 'core' },
    { id: 'customer_health', label: '💓 Sức Khỏe Khách Hàng & Chăm Sóc', icon: Activity, tier: 'core' },
    { id: 'pricing_ltv', label: '💰 Định Giá & Giá Trị Vòng Đời (LTV)', icon: TrendingUp, tier: 'core' },
  ],
  finance_accounting: [
    { id: 'cashflow', label: '💵 Doanh Thu, Dòng Tiền & VietQR', icon: TrendingUp, tier: 'core' },
    { id: 'cashflow_forecast', label: '📈 Dự Báo Dòng Tiền & Runway', icon: TrendingUp, tier: 'core' },
    { id: 'ledger', label: '📑 Sổ Cái & Báo Cáo VAS 200/133', icon: Database, tier: 'core' },
  ],
  projects_delivery: [
    { id: 'portfolio', label: '📁 Danh Mục Dự Án Triển Khai', icon: FolderKanban, tier: 'core' },
    { id: 'industry_templates', label: '🏭 Mẫu Phân Hệ Ngành', icon: Database, tier: 'core' },
  ],
  documents_approval: [
    { id: 'approvals', label: '✅ Luồng Phê Duyệt Nhanh', icon: CheckCircle, tier: 'core' },
    { id: 'audit', label: '🔍 Kiểm Soát Chứng Từ Điện Tử', icon: ShieldCheck, tier: 'core' },
  ],
  ai_factory: [
    { id: 'command', label: '🤖 Trợ Lý CEO & Đội Ngũ Nhân Sự AI', icon: Bot, tier: 'core' },
    { id: 'autonomous_flywheel', label: '⚡ Vòng Lặp Tự Vận Hành', icon: Zap, tier: 'core' },
    { id: 'nexus_cockpit', label: '🎛️ Trung Tâm Điều Phối AI Robot', icon: Activity, tier: 'core' },
  ],
  analytics: [
    { id: 'predictive_revenue', label: '📈 Dự Báo Doanh Thu 90 Ngày', icon: TrendingUp, tier: 'core' },
    { id: 'simulations', label: '🎯 Mô Phỏng Doanh Nghiệp', icon: Target, tier: 'core' },
    { id: 'python_sandbox', label: '🐍 Phân Tích Dữ Liệu & Python Sandbox', icon: Code, tier: 'core' },
  ],
  system_settings: [
    { id: 'general', label: '⚙️ Doanh Nghiệp & Tài Khoản', icon: Settings, tier: 'core' },
    { id: 'security', label: '🛡️ Bảo Mật & Kho Khóa AI Vault', icon: ShieldCheck, tier: 'core' },
    { id: 'connectors', label: '🔌 Tích Hợp Hệ Thống & Ngân Hàng', icon: Network, tier: 'core' },
    { id: 'delegation_matrix', label: '⚖️ Phân Quyền & Giới Hạn Tự Trị AI', icon: Scale, tier: 'core' },
  ],
  operations: [
    { id: 'portfolio', label: '📁 Danh Mục Dự Án', icon: FolderKanban, tier: 'core' },
  ],
};

export function classifySubtabTier(tab: WorkspaceSubtab, segment: string): WorkspaceSubtabTier {
  if (tab.tier) return tab.tier;
  const coreIds = SEGMENT_CORE_IDS[segment] || [];
  if (coreIds.includes(tab.id)) return 'core';
  return 'advanced';
}

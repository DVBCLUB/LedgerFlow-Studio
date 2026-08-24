import React, { useEffect, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Code,
  Coins,
  Command,
  CornerDownLeft,
  CreditCard,
  Database,
  FileCheck2,
  Film,
  FolderKanban,
  Mic,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Smile,
  Sparkles,
  Target,
  Trophy,
  Users2,
  UsersRound,
  Scale,
  Wifi,
  Zap,
  TrendingUp,
  X,
  ShieldAlert,
  Puzzle,
  GitBranch,
  Globe,
  Video,
  Truck,
  Globe2,
  FileText,
  HeartPulse,
  Cpu,
  Landmark,
  PhoneCall,
  Cloud,
  Radio,
  Leaf,
} from 'lucide-react';
import { COMPANY_WORKSPACES, type TabType } from '../../app/companyNavigation';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabType, subTab?: string) => void;
}

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  action: () => void;
  badge?: string;
}

export default function UniversalCEOCommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery('');
          setSelectedIndex(0);
        }
      }
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (tab: TabType, subTab?: string) => {
    onNavigate(tab, subTab);
    onClose();
  };

  const allItems: CommandItem[] = [
    // Core Workspaces
    ...COMPANY_WORKSPACES.map((ws) => ({
      id: `nav-${ws.tab}`,
      category: 'Phân hệ Doanh nghiệp',
      title: ws.label,
      subtitle: ws.description,
      icon: Briefcase,
      action: () => handleSelect(ws.tab),
      badge: 'Chuyển phân hệ',
    })),

    // Fast CEO Actions
    {
      id: 'act-python',
      category: 'Hành động Nhanh',
      title: '🧪 Chạy Python & SQL Sandbox AI',
      subtitle: 'Mở môi trường WebAssembly Python 3.12 phân tích dữ liệu',
      icon: Code,
      action: () => handleSelect('analytics', 'python_sandbox'),
      badge: 'Chạy ngầm',
    },
    {
      id: 'act-ai-agent',
      category: 'Hành động Nhanh',
      title: '🤖 Ra lệnh cho Đội ngũ AI Staff',
      subtitle: 'Giao việc cho AI CMO, CFO, Dev hoặc Tester',
      icon: Bot,
      action: () => handleSelect('ai_factory', 'command'),
      badge: 'AI Swarm',
    },
    {
      id: 'act-game-asset',
      category: 'Hành động Nhanh',
      title: '🎮 Xưởng Tài Sản Game AI 5-in-1',
      subtitle: 'Sinh Concept Art, Sprite Sheet, SFX Synth, Lore NPC & Bảng cân bằng chỉ số',
      icon: Sparkles,
      action: () => handleSelect('product_studio', 'game_assets'),
      badge: 'Game Studio',
    },
    {
      id: 'act-video-pipeline',
      category: 'Hành động Nhanh',
      title: '🎬 Xưởng Sản Xuất Video Đa Kênh (5 Giai Đoạn)',
      subtitle: 'Kịch bản từng giây, Voiceover Cues, DaVinci/CapCut Edit Brief & Thumbnail Viral',
      icon: Rocket,
      action: () => handleSelect('marketing_growth', 'video_studio'),
      badge: 'Video Maker',
    },
    {
      id: 'act-dynamic-router',
      category: 'Hành động Nhanh',
      title: '📊 Dynamic Adaptive AI Router & LLM-Judge',
      subtitle: 'Tối ưu chi phí $0 (Ollama/Free tier), đo latency & feedback loop chất lượng',
      icon: Bot,
      action: () => handleSelect('ai_factory', 'governance'),
      badge: 'AI Core',
    },
    {
      id: 'act-autonomous-flywheel',
      category: 'Hành động Nhanh',
      title: '🚀 Vòng Lặp Tự Vận Hành 95% (Autonomous Flywheel)',
      subtitle: 'Voice-to-Command tiếng Việt, tự động phân phối đa kênh, playtest game & đóng gói 1-click',
      icon: Zap,
      action: () => handleSelect('ai_factory', 'autonomous_flywheel'),
      badge: 'Flywheel',
    },
    {
      id: 'act-nexus-cockpit',
      category: 'Hành động Nhanh',
      title: '⚡ AI-Robot Universal Nexus & Studio Command',
      subtitle: 'Bộ não AI trung tâm, robot trung gian, cầu nối IDE (Cursor/Antigravity) & Studio 3 mảng',
      icon: Bot,
      action: () => handleSelect('ai_factory', 'nexus_cockpit'),
      badge: 'Nexus Core',
    },
    {
      id: 'act-apprentice-lab',
      category: 'Hành động Nhanh',
      title: '🎓 Local AI Apprentice & Distillation Lab',
      subtitle: 'Ma trận chuyên gia Frontier, thu thập mẫu vàng và xuất dataset huấn luyện',
      icon: Bot,
      action: () => handleSelect('ai_factory', 'apprentice_lab'),
      badge: 'Local AI SFT',
    },
    {
      id: 'act-delegation-matrix',
      category: 'Hành động Nhanh',
      title: '⚖️ Ma Trận Phân Quyền & Giải Quyết Xung Đột AI',
      subtitle: 'Chuẩn Amazon Least-Privilege, DeepMind Consensus & Netflix Blast-Radius Isolation',
      icon: Scale,
      action: () => handleSelect('system_settings', 'delegation_matrix'),
      badge: 'RBAC IAM',
    },
    {
      id: 'act-sop-runbooks',
      category: 'Hành động Nhanh',
      title: '📖 Quy Trình Vận Hành Chuẩn (SOP & Runbooks)',
      subtitle: '5 trụ cột quy trình vận hành, điểm tuân thủ & diễn tập sự cố khẩn cấp 1-click',
      icon: BookOpen,
      action: () => handleSelect('system_settings', 'sop_runbook'),
      badge: 'SOP Core',
    },
    {
      id: 'act-self-healing-patch',
      category: 'Hành động Nhanh',
      title: '🛡️ Autonomous Code Self-Healing & PR Gate',
      subtitle: 'Robot tự chẩn đoán lỗi, viết atomic patch & 1-Click Approve Gate',
      icon: ShieldCheck,
      action: () => handleSelect('system_settings', 'dev_ops'),
      badge: 'Self-Healing',
    },
    {
      id: 'act-vietqr',
      category: 'Hành động Nhanh',
      title: '📈 Kiểm tra Dòng tiền & VietQR',
      subtitle: 'Xem nhật ký khớp nối thanh toán tự động',
      icon: BarChart3,
      action: () => handleSelect('finance_accounting', 'cashflow'),
      badge: 'Kế toán VAS',
    },
    {
      id: 'act-ci-doctor',
      category: 'Hành động Nhanh',
      title: '🔌 Thẻ Phê duyệt Release & GitHub CI Doctor',
      subtitle: 'Duyệt bản build xanh và kiểm tra trạng thái CI/CD',
      icon: ShieldCheck,
      action: () => handleSelect('system_settings', 'dev_ops'),
      badge: 'DevOps Gate',
    },
    {
      id: 'act-daily-standup',
      category: 'Hành động Nhanh',
      title: '☀️ Báo Cáo Giao Ban Lãnh Đạo AI (Daily Executive Standup)',
      subtitle: 'Xem điểm sẵn sàng, ý kiến CEO/CFO/CTO/CMO và nghe tóm tắt giọng nói',
      icon: Sparkles,
      action: () => handleSelect('ceo_command'),
      badge: 'Giao ban C-Suite',
    },
    {
      id: 'act-digital-twin',
      category: 'Hành động Nhanh',
      title: '📊 Mô Phỏng Digital Twin & Monte Carlo Cash Runway',
      subtitle: 'Dự báo chu kỳ cạn tiền, nguy cơ token budget và điểm nghẽn 60 ngày',
      icon: BarChart3,
      action: () => handleSelect('analytics', 'simulation_engine'),
      badge: 'Monte Carlo AI',
    },
    {
      id: 'act-nightly-sweeper',
      category: 'Hành động Nhanh',
      title: '🌙 Chạy Robot Quét Dọn Ban Đêm (Nightly Sweeper)',
      subtitle: 'Tự động kiểm tra token spending, audit log, uncommitted changes và tổng kết sáng',
      icon: Zap,
      action: () => handleSelect('ai_factory', 'autonomous_robots'),
      badge: 'Robot Tự Trị',
    },
    {
      id: 'act-token-budget',
      category: 'Hành động Nhanh',
      title: '🔐 Hạn mức API & AI Key Vault',
      subtitle: 'Kiểm soát ngân sách token API của đội ngũ AI',
      icon: Settings,
      action: () => handleSelect('system_settings', 'security'),
      badge: 'Bảo mật',
    },
    {
      id: 'act-auto-reconcile',
      category: 'Hành động Nhanh',
      title: '💰 Đối Soát 3 Chiều Tự Động (Bank ↔ Invoice ↔ Deal)',
      subtitle: 'Khớp nối sao kê ngân hàng, hóa đơn TK 131 và tự động ghi sổ chứng từ',
      icon: BarChart3,
      action: () => handleSelect('finance_accounting', 'auto_reconciliation'),
      badge: 'Agentic ERP',
    },
    {
      id: 'act-predictive-accounting',
      category: 'Hành động Nhanh',
      title: '📉 Dự Báo Kế Toán & Phát Hiện Bất Thường 2-Sigma',
      subtitle: 'Phân tích phương sai chi phí thực tế và dự báo doanh thu chu kỳ tới',
      icon: TrendingUp,
      action: () => handleSelect('finance_accounting', 'predictive_accounting'),
      badge: 'Predictive AI',
    },
    {
      id: 'act-factory-performance',
      category: 'Hành động Nhanh',
      title: '🏭 Hiệu Năng & Co Giãn Nhà Máy Số (Multi-Factory Auto-Scale)',
      subtitle: 'Giám sát 4 nhà máy số (Software, Video, Game, Marketing) và đo lường ROI',
      icon: Rocket,
      action: () => handleSelect('ai_factory', 'factory_performance'),
      badge: 'Digital Factory',
    },
    {
      id: 'act-agent-roi',
      category: 'Hành động Nhanh',
      title: '🤖 Đo Lường ROI & Token Economics Đội Ngũ AI',
      subtitle: 'Đo lường chi phí LLM, quy mô nhân sự FTE thay thế và tỷ suất hoàn vốn',
      icon: Bot,
      action: () => handleSelect('ai_factory', 'agent_roi'),
      badge: 'Agent ROI',
    },
    {
      id: 'act-activity-pulse',
      category: 'Hành động Nhanh',
      title: '🔄 Dòng Sự Kiện Toàn Công Ty (Unified Activity Pulse)',
      subtitle: 'Tổng hợp 35 luồng sự kiện real-time và lịch vận hành chiến lược',
      icon: Activity,
      action: () => handleSelect('ceo_command', 'activity_stream'),
      badge: 'Company Pulse',
    },
    {
      id: 'act-dept-health',
      category: 'Hành động Nhanh',
      title: '📊 Thẻ Điểm Sức Khỏe 360° & Tiến Hóa Quy Trình',
      subtitle: 'Đánh giá sức khỏe 5 khối phòng ban và phê duyệt đột biến quy tắc vận hành',
      icon: ShieldCheck,
      action: () => handleSelect('ceo_command', 'dept_health'),
      badge: 'Self-Evolving',
    },
    {
      id: 'act-revenue-flywheel',
      category: 'Hành động Nhanh',
      title: '🚀 Vòng Lặp Tăng Trưởng Doanh Thu (Customer Revenue Flywheel)',
      subtitle: 'Tự động phát hiện nguy cơ rời bỏ, sinh báo giá nâng cấp và liên kết VietQR',
      icon: TrendingUp,
      action: () => handleSelect('sales_crm', 'revenue_flywheel'),
      badge: 'Flywheel ARR',
    },
    {
      id: 'act-auto-harvest',
      category: 'Hành động Nhanh',
      title: '🧠 Thu Hoạch Tri Thức Tự Học (Agentic Knowledge Harvester)',
      subtitle: 'Tự động trích xuất bài học kinh nghiệm từ AI Swarm và nạp vào Global RAG',
      icon: Sparkles,
      action: () => handleSelect('knowledge_library', 'auto_harvest'),
      badge: 'Self-Learning',
    },
    {
      id: 'act-agent-probation',
      category: 'Hành động Nhanh',
      title: '🎓 Đánh Giá Năng Lực & Thử Việc AI Agent (Probation Engine)',
      subtitle: 'Chấm điểm 10 bài test tiêu chuẩn và cấp quyền thực thi theo Least-Privilege',
      icon: Bot,
      action: () => handleSelect('ai_factory', 'tasks'),
      badge: 'Probation',
    },
    {
      id: 'act-competitor-radar',
      category: 'Hành động Nhanh',
      title: '📡 Radar Đối Thủ Cạnh Tranh & Battle Cards (MISA, Fast, Base)',
      subtitle: 'So sánh bảng giá, tính năng sát thủ và kịch bản xử lý từ chối cho AI Sales',
      icon: Target,
      action: () => handleSelect('marketing_growth', 'competitor_radar'),
      badge: 'Market Radar',
    },
    {
      id: 'act-weekly-report',
      category: 'Hành động Nhanh',
      title: '📑 Xuất Báo Cáo Giao Ban Tuần (AI Executive Briefing)',
      subtitle: 'Tổng hợp sức khỏe 5 khối, chỉ số ROI token, doanh thu và đối soát 3 chiều',
      icon: TrendingUp,
      action: () => handleSelect('ceo_command', 'overview'),
      badge: 'Executive PDF',
    },
    {
      id: 'act-financial-incidents',
      category: 'Hành động Nhanh',
      title: '🚨 Quản Trị Sự Cố Tài Chính & Playbook Phong Tỏa (2-Sigma Alert)',
      subtitle: 'Tự động đóng băng hạn mức GPU burn rate, xử lý lệch thuế VAT 0% và thu hồi nợ',
      icon: ShieldAlert,
      action: () => handleSelect('finance_accounting', 'incidents'),
      badge: 'Incident Guard',
    },
    {
      id: 'act-business-ab',
      category: 'Hành động Nhanh',
      title: '🧪 Thí Nghiệm A/B & Tối Ưu Hóa Gói Báo Giá (Dynamic Pricing)',
      subtitle: 'Tự động phân bổ traffic và áp dụng gói giá có doanh thu trên lượt xem cao nhất',
      icon: Sparkles,
      action: () => handleSelect('analytics_models_sandbox', 'simulations'),
      badge: 'A/B Optimizer',
    },
    {
      id: 'act-plugin-marketplace',
      category: 'Hành động Nhanh',
      title: '🧩 Chợ Tiện Ích Mở Rộng & Connector Marketplace (Hot-Pluggable)',
      subtitle: 'Cài đặt tức thì các module MISA Sync, TikTok Video Ads, VietQR Hub và BOM Ngành',
      icon: Puzzle,
      action: () => handleSelect('system_settings', 'marketplace'),
      badge: 'Ecosystem Hub',
    },
    {
      id: 'act-boardroom-consensus',
      category: 'Hành động Nhanh',
      title: '⚖️ Hội Đồng Biểu Quyết Chiến Lược & Delphi Consensus (4 C-Level)',
      subtitle: 'Biểu quyết độc lập giữa AI CEO, CFO, CTO và Compliance trước khi cấp vốn hoặc sửa giá',
      icon: Scale,
      action: () => handleSelect('ceo_command', 'boardroom'),
      badge: 'Boardroom',
    },
    {
      id: 'act-self-healing-infra',
      category: 'Hành động Nhanh',
      title: '🩺 Hạ Tầng Tự Phục Hồi & Zero-Downtime Hot-Patching',
      subtitle: 'Tự động giải phóng file khóa SQLite, dọn dẹp bộ nhớ heap và chuyển mạch circuit breaker',
      icon: Activity,
      action: () => handleSelect('system_settings', 'security'),
      badge: 'Self-Healing',
    },
    {
      id: 'act-virtual-branches',
      category: 'Hành động Nhanh',
      title: '🏢 Quản Lý Chi Nhánh Ảo & Franchise Holding Rollup',
      subtitle: 'Nhân bản 1-click công ty con với sổ cái TT133/TT200 và hợp nhất doanh thu về Holding',
      icon: GitBranch,
      action: () => handleSelect('ceo_command', 'branches'),
      badge: 'Multi-Tenant',
    },
    {
      id: 'act-self-mutation',
      category: 'Hành động Nhanh',
      title: '🧬 Tự Tiến Hóa & Sửa Mã Nguồn AST-Aware (Self-Mutation)',
      subtitle: 'Tự động phát hiện ngoại lệ runtime, sinh bản vá AST và kiểm thử sandbox an toàn',
      icon: Sparkles,
      action: () => handleSelect('system_settings', 'dev_ops'),
      badge: 'Self-Mutation',
    },
    {
      id: 'act-digital-twin',
      category: 'Hành động Nhanh',
      title: '🔮 Bản Sao Số Doanh Nghiệp & Mô Phỏng What-If (Monte Carlo)',
      subtitle: 'Dự phóng dòng tiền, ARR và tỷ lệ sống sót trước khi quyết định mở rộng thị trường',
      icon: Target,
      action: () => handleSelect('analytics_models_sandbox', 'simulations'),
      badge: 'Digital Twin',
    },
    {
      id: 'act-global-localization',
      category: 'Hành động Nhanh',
      title: '🌐 Chuẩn Kế Toán Kép VAS ↔ IFRS & Đa Ngoại Tệ (SBV Live FX)',
      subtitle: 'Ánh xạ tài khoản kế toán Việt Nam sang chuẩn quốc tế và quy đổi tỷ giá thời gian thực',
      icon: Globe,
      action: () => handleSelect('finance_accounting', 'global_adapter'),
      badge: 'Dual Standard',
    },
    {
      id: 'act-social-swarm',
      category: 'Hành động Nhanh',
      title: '🎬 Chiến Dịch Video Ngắn Đa Kênh & Social Swarm (TikTok/Reels)',
      subtitle: 'Tự động sinh kịch bản hook CapCut, đăng tải đa kênh và đo lường doanh thu quy đổi',
      icon: Video,
      action: () => handleSelect('marketing_growth', 'social_swarm'),
      badge: 'Social Swarm',
    },
    {
      id: 'act-tax-shield',
      category: 'Hành động Nhanh',
      title: '🛡️ Thẩm Tra Hóa Đơn 24/7 & Khiên Thuế TT80 / TT78',
      subtitle: 'Đối soát mã số thuế Tổng cục Thuế, kiểm tra chữ ký số CKS và lập hồ sơ giải trình',
      icon: ShieldCheck,
      action: () => handleSelect('finance_accounting', 'tax_shield'),
      badge: 'Tax Shield',
    },
    {
      id: 'act-nl-sql',
      category: 'Hành động Nhanh',
      title: '💬 Truy Vấn SQL Tiếng Việt Tự Nhiên & BI Chart (Voice-to-SQL)',
      subtitle: 'Hỏi đáp số liệu kinh doanh trực tiếp bằng tiếng Việt tự nhiên và xuất bảng biểu',
      icon: Database,
      action: () => handleSelect('analytics_models_sandbox', 'simulations'),
      badge: 'Voice BI',
    },
    {
      id: 'act-auto-support',
      category: 'Hành động Nhanh',
      title: '🎧 CSKH Tự Động & Hỗ Trợ 24/7 (AI Concierge Deflection)',
      subtitle: 'Tự động giải quyết 92%+ thắc mắc hóa đơn VietQR và kích hoạt tài khoản trong 4s',
      icon: UsersRound,
      action: () => handleSelect('sales_crm', 'support'),
      badge: 'AI Support',
    },
    {
      id: 'act-dynamic-repricing',
      category: 'Hành động Nhanh',
      title: '💰 Định Giá Động & Tối Ưu Biên Lợi Nhuận Thầu (Repricing AI)',
      subtitle: 'Tính toán mức chiết khấu linh hoạt theo ngành và quy mô để tối đa hóa win-rate',
      icon: Target,
      action: () => handleSelect('sales_crm', 'pricing_ltv'),
      badge: 'Repricing',
    },
    {
      id: 'act-security-posture',
      category: 'Hành động Nhanh',
      title: '🔒 Kiểm Toán An Ninh SOC2 / ISO27001 & Chuẩn Zero-Trust',
      subtitle: 'Quét rò rỉ API key, mã hóa database và phát hiện sai lệch phân quyền RBAC',
      icon: ShieldAlert,
      action: () => handleSelect('system_settings', 'security'),
      badge: 'Zero-Trust',
    },
    {
      id: 'act-investor-relations',
      category: 'Hành động Nhanh',
      title: '💼 Quan Hệ Nhà Đầu Tư & Mô Phỏng Cap Table (Pre-Seed $1M)',
      subtitle: 'Cơ cấu sở hữu cổ phần, mô phỏng pha loãng và bản tin tăng trưởng định kỳ',
      icon: UsersRound,
      action: () => handleSelect('finance_accounting', 'investors'),
      badge: 'Cap Table',
    },
    {
      id: 'act-vendor-settlement',
      category: 'Hành động Nhanh',
      title: '📦 Đối Soát Nhà Cung Cấp 3-Way & Chi Trả VietQR (Supply Chain)',
      subtitle: 'Khớp đơn đặt hàng PO ↔ Phiếu nhập kho GRN ↔ Hóa đơn điện tử và chi trả tự động',
      icon: Truck,
      action: () => handleSelect('finance_accounting', 'vendor_settlement'),
      badge: '3-Way Match',
    },
    {
      id: 'act-seo-topical',
      category: 'Hành động Nhanh',
      title: '🌐 SEO Topical Authority & Thẻ Schema JSON-LD (Rank #1 Google)',
      subtitle: 'Tối ưu cụm chủ đề Pillar-Cluster và cấu trúc Schema thống trị tìm kiếm tự nhiên',
      icon: Globe,
      action: () => handleSelect('marketing_growth', 'seo'),
      badge: 'SEO Dominance',
    },
    {
      id: 'act-talent-recruiting',
      category: 'Hành động Nhanh',
      title: '🧑‍💼 Tuyển Dụng Nhân Tài & Đánh Giá Kỹ Năng (AI Match 96%)',
      subtitle: 'Tự động lọc hồ sơ, benchmark kỹ năng và phân quyền onboarding nhanh',
      icon: UsersRound,
      action: () => handleSelect('ai_nhan_su', 'recruiting'),
      badge: 'Recruiting',
    },
    {
      id: 'act-ip-guard',
      category: 'Hành động Nhanh',
      title: '📜 Bản Quyền Phần Mềm & Đăng Ký Cục SHTT (Legal Moat)',
      subtitle: 'Kiểm toán giấy phép nguồn mở OSS và xuất hồ sơ đăng ký bản quyền',
      icon: Award,
      action: () => handleSelect('system_settings', 'ip_guard'),
      badge: 'IP Guard',
    },
    {
      id: 'act-edge-routing',
      category: 'Hành động Nhanh',
      title: '🌍 Global Edge CDN & Điều Phối Anycast Mạng (Avg 45ms)',
      subtitle: 'Giám sát 6 Node phân tán toàn cầu và xóa cache tức thì',
      icon: Globe2,
      action: () => handleSelect('system_settings', 'edge_cdn'),
      badge: 'Edge CDN',
    },
    {
      id: 'act-clm-redline',
      category: 'Hành động Nhanh',
      title: '📑 Quản Lý Hợp Đồng CLM & AI Redline Shield (SaaS MSA / EPC)',
      subtitle: 'Phát hiện điều khoản rủi ro pháp lý và kích hoạt chữ ký số e-Signature',
      icon: FileText,
      action: () => handleSelect('documents_approval', 'clm'),
      badge: 'CLM Redline',
    },
    {
      id: 'act-customer-health',
      category: 'Hành động Nhanh',
      title: '❤️ Sức Khỏe Khách Hàng 360 & Giữ Chân Khách Hàng (Retention 94%)',
      subtitle: 'Đo lường rủi ro rời bỏ và kích hoạt ưu đãi VIP tự động',
      icon: HeartPulse,
      action: () => handleSelect('sales_crm', 'customer_health'),
      badge: 'Health 360',
    },
    {
      id: 'act-llm-arbitrage',
      category: 'Hành động Nhanh',
      title: '💰 Định Tuyến Model & Tối Ưu Chi Phí Token LLM (Tiết kiệm 78%)',
      subtitle: 'Tự động phân bổ tác vụ giữa Gemini Flash, DeepSeek R1 và Claude 3.5',
      icon: Cpu,
      action: () => handleSelect('system_settings', 'llm_arbitrage'),
      badge: 'Token Arbitrage',
    },
    {
      id: 'act-treasury-sweep',
      category: 'Hành động Nhanh',
      title: '🏦 Kho Bạc Đa Ngân Hàng & Quét Lãi Suất Tự Động 5.2% (Overnight Sweep)',
      subtitle: 'Tối ưu hóa lợi tức tiền gửi nhàn rỗi và bảo vệ quỹ dự phòng chi trả',
      icon: Landmark,
      action: () => handleSelect('finance_accounting', 'treasury'),
      badge: 'Treasury Yield',
    },
    {
      id: 'act-voice-helpdesk',
      category: 'Hành động Nhanh',
      title: '📞 Tổng Đài Thoại AI & Chăm Sóc Khách Hàng Đa Kênh (Deflection 93.5%)',
      subtitle: 'Tự động phiên âm cuộc gọi và giải quyết tức thì yêu cầu hỗ trợ',
      icon: PhoneCall,
      action: () => handleSelect('sales_crm', 'helpdesk'),
      badge: 'Voice AI Helpdesk',
    },
    {
      id: 'act-multi-cloud-mesh',
      category: 'Hành động Nhanh',
      title: '🌐 Multi-Cloud Mesh & Khôi Phục Thảm Họa (Active-Active RPO < 0.2s)',
      subtitle: 'Đồng bộ SQLite WAL đa đám mây và diễn tập chuyển mạch tự động',
      icon: Cloud,
      action: () => handleSelect('system_settings', 'multi_cloud'),
      badge: 'Multi-Cloud DR',
    },
    {
      id: 'act-ma-valuation',
      category: 'Hành động Nhanh',
      title: '💼 M&A Pipeline & Định Giá Doanh Nghiệp DCF (Cộng hưởng +88%)',
      subtitle: 'Quản trị thương vụ thâu tóm và mô phỏng cộng hưởng hậu sáp nhập',
      icon: Briefcase,
      action: () => handleSelect('finance_accounting', 'ma_valuation'),
      badge: 'M&A Valuation',
    },
    {
      id: 'act-brand-radar',
      category: 'Hành động Nhanh',
      title: '📡 Uy Tín Thương Hiệu 360 & Radar Khủng Hoảng PR (Brand Score 94/100)',
      subtitle: 'Lắng nghe mạng xã hội và tự động xuất bản phản hồi thương hiệu',
      icon: Radio,
      action: () => handleSelect('marketing_growth', 'brand_radar'),
      badge: 'Brand Radar',
    },
    {
      id: 'act-soc-threat',
      category: 'Hành động Nhanh',
      title: '🚨 Săn Lùng Nguy Cơ Zero-Day & Tác Chiến An Ninh SOC (Zero-Trust 100%)',
      subtitle: 'Phát hiện tấn công Brute-Force, SQLi và tự động cô lập IP độc hại',
      icon: ShieldAlert,
      action: () => handleSelect('system_settings', 'soc_threat'),
      badge: 'SOC Radar',
    },
    {
      id: 'act-agm-governance',
      category: 'Hành động Nhanh',
      title: '🏛️ Quản Trị ĐHĐCĐ & Nghị Quyết HĐQT Số (Quorum 96.8%)',
      subtitle: 'Bỏ phiếu ủy quyền số và nộp hồ sơ pháp lý Sở Kế Hoạch & Đầu Tư',
      icon: Landmark,
      action: () => handleSelect('ceo_command', 'agm_governance'),
      badge: 'AGM Governance',
    },
    {
      id: 'act-cross-border-vat',
      category: 'Hành động Nhanh',
      title: '🌐 Thuế Xuyên Biên Giới & Tự Tính Thuế Reverse Charge (SG GST 9% / EU)',
      subtitle: 'Khấu trừ thuế nhà thầu và xuất hóa đơn đa quốc gia tuân thủ hiệp định DTA',
      icon: Globe2,
      action: () => handleSelect('finance_accounting', 'cross_border_vat'),
      badge: 'Cross-Border VAT',
    },
    {
      id: 'act-affiliate-commission',
      category: 'Hành động Nhanh',
      title: '🤝 Mạng Lưới Đại Lý & Chi Trả Hoa Hồng VietQR (15% / 5% Định Kỳ)',
      subtitle: 'Tự động khấu trừ 10% thuế TNCN tại nguồn và giải ngân tức thì',
      icon: UsersRound,
      action: () => handleSelect('sales_crm', 'affiliate_commission'),
      badge: 'Affiliate Payout',
    },
    {
      id: 'act-prompt-firewall',
      category: 'Hành động Nhanh',
      title: '🔥 Tường Lửa Bảo Vệ Prompt & Chống Leak CCCD/Key (Masking 99.8%)',
      subtitle: 'Chặn đứng Jailbreak, trích xuất System Prompt và triệt tiêu ảo giác LLM',
      icon: ShieldCheck,
      action: () => handleSelect('system_settings', 'prompt_firewall'),
      badge: 'Prompt Shield',
    },
    {
      id: 'act-esg-carbon',
      category: 'Hành động Nhanh',
      title: '🌱 Kế Toán Khí Thải Carbon Scope 1-3 & ESG Net-Zero (AAA Hạng Nhất)',
      subtitle: 'Tự động tính toán GHG emissions và mua chứng chỉ tín chỉ carbon Verra',
      icon: Leaf,
      action: () => handleSelect('finance_accounting', 'esg_carbon'),
      badge: 'ESG Carbon',
    },
    {
      id: 'act-marketing-bot',
      category: 'Hành động Nhanh',
      title: '📡 Tiếp Thị Broadcast Đa Kênh Telegram, WhatsApp & Zalo ZNS (CTR 21.2%)',
      subtitle: 'Phát động chiến dịch hội thoại quy mô lớn và nhúng thẻ thanh toán VietQR',
      icon: Radio,
      action: () => handleSelect('marketing_growth', 'marketing_bot'),
      badge: 'Marketing Bot',
    },
    {
      id: 'act-voice-sentiment',
      category: 'Hành động Nhanh',
      title: '❤️ Phân Tích Cảm Xúc Giọng Nói AI CSAT & Tri Ân Khách Hàng (NPS +84)',
      subtitle: 'Nhận diện ngữ điệu hài lòng/lo lắng và tự động kích hoạt gói giữ chân VIP',
      icon: Smile,
      action: () => handleSelect('sales_crm', 'voice_sentiment'),
      badge: 'NPS Voice',
    },
    {
      id: 'act-chaos-engineering',
      category: 'Hành động Nhanh',
      title: '⚡ Diễn Tập Sự Cố Toàn Diện & Chaos Engineering Monkey (Độ Bền 99.999%)',
      subtitle: 'Mô phỏng xung đột lock DB, nghẽn mạng và đo lường khả năng tự hồi phục',
      icon: Zap,
      action: () => handleSelect('system_settings', 'chaos_engineering'),
      badge: 'Chaos Monkey',
    },
    {
      id: 'act-second-brain',
      category: 'Hành động Nhanh',
      title: '🧠 Trợ Lý Neural Second-Brain & Thu Nạp Ý Tưởng Founder (Top-3 Goals)',
      subtitle: 'Tự động phân rã suy nghĩ và ủy quyền nhiệm vụ cho AI Swarm Agents',
      icon: Brain,
      action: () => handleSelect('ceo_command', 'second_brain'),
      badge: 'Second Brain',
    },
    {
      id: 'act-crypto-treasury',
      category: 'Hành động Nhanh',
      title: '🪙 Kho Bạc Doanh Nghiệp Crypto & Cầu Nối VietQR Stablecoin ($173k USDC)',
      subtitle: 'Bảo mật ví đa chữ ký Safe 3/5 và thanh toán On-Chain tự động',
      icon: Coins,
      action: () => handleSelect('finance_accounting', 'crypto_treasury'),
      badge: 'Crypto Web3',
    },
    {
      id: 'act-video-production',
      category: 'Hành động Nhanh',
      title: '🎬 Xưởng Sản Xuất Video 9:16 & Auto-Publish TikTok/Reels (< 15s)',
      subtitle: 'Tự động viết kịch bản, lồng tiếng AI tiếng Việt và xuất bản đa nền tảng',
      icon: Film,
      action: () => handleSelect('marketing_growth', 'video_production'),
      badge: 'Video Studio',
    },
    {
      id: 'act-ai-bonus',
      category: 'Hành động Nhanh',
      title: '🏆 Quỹ Thưởng & ESOP Hiệu Suất AI Swarm Dựa Trên MRR (Proof-of-Work)',
      subtitle: 'Trích thưởng 5-10% từ doanh thu tăng thêm và giải ngân qua VietQR',
      icon: Award,
      action: () => handleSelect('ai_factory', 'ai_bonus'),
      badge: 'Bonus Escrow',
    },
    {
      id: 'act-advisory-council',
      category: 'Hành động Nhanh',
      title: '🏛️ Hội Đồng Cố Vấn Chiến Lược Ảo (YC Partner, Big-4 Tax, AI Scientist)',
      subtitle: 'Nhận phân tích đa chiều từ 5 chuyên gia AI tinh hoa cho mọi quyết định lớn',
      icon: Users2,
      action: () => handleSelect('ceo_command', 'advisory_council'),
      badge: 'Think-Tank',
    },
    {
      id: 'act-loyalty-gamification',
      category: 'Hành động Nhanh',
      title: '🏆 Gamification Viral & Điểm Thưởng Loyalty Khách Hàng (K-Factor = 1.23)',
      subtitle: 'Mạng lưới giới thiệu khách hàng tự động với thưởng Diamond/Platinum/Gold',
      icon: Trophy,
      action: () => handleSelect('sales_crm', 'loyalty_gamification'),
      badge: 'Loyalty',
    },
    {
      id: 'act-ai-dev-copilot',
      category: 'Hành động Nhanh',
      title: '💻 AI Developer Copilot & AST Refactor Hub (Codebase Health 98.6%)',
      subtitle: 'Tự động phát hiện nợ kỹ thuật và tái cấu trúc mã nguồn an toàn trong sandbox',
      icon: Code,
      action: () => handleSelect('system_settings', 'ai_dev_copilot'),
      badge: 'Dev Copilot',
    },
    {
      id: 'act-db-sharding',
      category: 'Hành động Nhanh',
      title: '🗄️ DB Auto-Sharding & Active Replicas Đa Vùng (RPO < 5ms)',
      subtitle: 'Phân vùng SQLite tự động cho 950 doanh nghiệp trên 3 trung tâm dữ liệu',
      icon: Database,
      action: () => handleSelect('system_settings', 'db_sharding'),
      badge: 'DB Sharding',
    },
  ];


  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase()),
      )
    : allItems;

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/80 ring-1 ring-white/10">
        {/* Search Bar Input */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-3.5 bg-slate-950/60">
          <Search className="h-5 w-5 text-indigo-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInInput}
            placeholder="Gõ lệnh hoặc tìm phân hệ... (VD: Python Sandbox, Duyệt chi phí, VietQR)"
            className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={onClose}
            className="ml-2 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500">
              Không tìm thấy lệnh hoặc phân hệ khớp với "{query}". Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Esc</kbd> để đóng.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                        isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{item.title}</span>
                        {item.badge && (
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-slate-400">{item.subtitle}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded-lg border border-indigo-500/30">
                      <span>Chọn</span>
                      <CornerDownLeft className="h-3 w-3" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-4 py-2.5 text-[10px] font-medium text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">↑↓</kbd> Di chuyển
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">↵</kbd> Thực thi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Esc</kbd> Đóng
            </span>
          </div>
          <div className="flex items-center gap-1 text-indigo-400 font-bold">
            <Command className="h-3 w-3" />
            <span>Universal CEO Command OS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

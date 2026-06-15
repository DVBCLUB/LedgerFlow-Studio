export type CompanyOSBacklogPriority = 'P0' | 'P1' | 'P2';
export type CompanyOSBacklogStatus = 'todo' | 'in_progress' | 'done';

export interface CompanyOSBacklogItem {
  id: string;
  priority: CompanyOSBacklogPriority;
  status: CompanyOSBacklogStatus;
  title: string;
  problem: string;
  targetOutcome: string;
  implementation: string[];
  acceptance: string[];
}

export const COMPANY_OS_V2_BACKLOG: CompanyOSBacklogItem[] = [
  {
    id: 'p0-1-company-os-framing',
    priority: 'P0',
    status: 'todo',
    title: 'Đổi framing sang Company OS',
    problem: 'Người dùng dễ hiểu nhầm sản phẩm là một ERP kế toán hoặc phần mềm xây dựng đơn lẻ.',
    targetOutcome: 'Giao diện và nội dung thể hiện LedgerFlow là Company OS cho solo founder và SME Việt Nam.',
    implementation: [
      'Rà soát các label có nghĩa quá hẹp như Construction ERP.',
      'Đổi sang Company OS, Simulation Lab, Founder Workspace hoặc Finance Accounting Lane.',
      'Giữ nguyên route và module id để không phá registry.'
    ],
    acceptance: [
      'Không còn framing chính khiến người dùng tưởng đây là ERP nhập liệu thật.',
      'Không rename route hoặc xóa module cũ.',
      'Các note mô tả rõ đây là simulation/workspace trước khi thành production system.'
    ]
  },
  {
    id: 'p0-2-command-center-first',
    priority: 'P0',
    status: 'todo',
    title: 'CommandCenter là màn hình điều hành đầu tiên',
    problem: 'Founder cần nhìn ngay việc ưu tiên, tiến độ module, rủi ro và next action thay vì thấy cấu hình kỹ thuật trước.',
    targetOutcome: 'CommandCenter hiển thị Daily Brief offline-first bằng data tĩnh hoặc localStorage trước.',
    implementation: [
      'Tạo data source nhỏ cho Daily Brief.',
      'Render P0 progress, next action và module status.',
      'Chưa cần Supabase hoặc webhook ở bản V2 nhỏ.'
    ],
    acceptance: [
      'Có danh sách việc P0 đang làm.',
      'Mỗi item có owner lane, status và hành động tiếp theo.',
      'Chạy offline được.'
    ]
  },
  {
    id: 'p0-3-department-navigation',
    priority: 'P0',
    status: 'todo',
    title: 'Navigation dùng tên phòng ban',
    problem: 'Tên kiểu bước 1, bước 2 hoặc tên kỹ thuật làm founder khó vận hành như một công ty.',
    targetOutcome: 'Navigation thể hiện các lane/phòng ban: Command, Build, Sell, Control, Extend.',
    implementation: [
      'Ưu tiên đổi label hiển thị, không đổi id.',
      'Map module hiện tại vào Company OS lane.',
      'Giữ HashRouter và simulationRegistry ổn định.'
    ],
    acceptance: [
      'Người dùng hiểu module thuộc phòng ban nào.',
      'Không break route cũ.',
      'Không cần migrate dữ liệu.'
    ]
  },
  {
    id: 'p0-4-simulation-boundary',
    priority: 'P0',
    status: 'in_progress',
    title: 'Hiển thị rõ Sandbox và Simulation workspace',
    problem: 'Nếu không ghi rõ phạm vi, người dùng có thể tưởng dữ liệu mẫu là dữ liệu vận hành thật.',
    targetOutcome: 'Các module deep-dive có boundary note: dữ liệu mô phỏng, dùng để học/thiết kế/kiểm thử trước.',
    implementation: [
      'Thêm boundary note trong panel deep-dive.',
      'Tách data static khỏi dữ liệu thật.',
      'Khi có Supabase thì vẫn cần phân biệt demo/workspace/production.'
    ],
    acceptance: [
      'Mỗi panel mới có mô tả phạm vi.',
      'Không gọi API ngoài chỉ để hiển thị dữ liệu mẫu.',
      'Không hardcode API key.'
    ]
  }
];

export const COMPANY_OS_V2_ROLLOUT_ORDER = [
  'Hoàn tất data deep-dive cho 4 module P0.',
  'Nối panel nhỏ vào từng module, mỗi commit một module.',
  'Đổi label/framing hiển thị sau khi UI đã ổn định.',
  'Chạy lint, check-agentops-contracts, check-simulations và build.',
  'Chỉ sau đó mới mở P1 split App.tsx hoặc backend nặng.'
];

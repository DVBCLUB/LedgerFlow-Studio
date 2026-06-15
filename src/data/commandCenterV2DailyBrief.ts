export type CommandBriefStatus = 'on_track' | 'watch' | 'next';

export interface CommandCenterBriefCard {
  id: string;
  title: string;
  lane: 'Command' | 'Build' | 'Sell' | 'Control' | 'Extend';
  status: CommandBriefStatus;
  metric: string;
  summary: string;
  nextAction: string;
}

export const COMMAND_CENTER_V2_DAILY_BRIEF: CommandCenterBriefCard[] = [
  {
    id: 'brief-accounting-vn',
    title: 'AccountingVietnam deep-dive',
    lane: 'Control',
    status: 'on_track',
    metric: 'Data + panel ready',
    summary: 'Đã có nội dung chuyên sâu kế toán Việt Nam và panel riêng để nối vào tab chính.',
    nextAction: 'Nối AccountingVietnamDeepDivePanel vào AccountingVietnam khi sửa bằng VS Code.'
  },
  {
    id: 'brief-internal-audit',
    title: 'InternalAuditWorkspace deep-dive',
    lane: 'Control',
    status: 'watch',
    metric: 'Data ready',
    summary: 'Đã có data chu trình kiểm soát nội bộ để làm panel SME Việt Nam.',
    nextAction: 'Tạo panel nhỏ render audit cycles trước, chưa mở rộng phức tạp.'
  },
  {
    id: 'brief-custom-data',
    title: 'CustomDataWorkbench deep-dive',
    lane: 'Build',
    status: 'on_track',
    metric: 'Schema + query + pivot data',
    summary: 'Đã có schema preview, query recipes và pivot templates cho dữ liệu mô phỏng.',
    nextAction: 'Tạo panel schema preview khi connector hoặc Codex local xử lý được TSX.'
  },
  {
    id: 'brief-v2-framing',
    title: 'Company OS V2 framing',
    lane: 'Command',
    status: 'next',
    metric: 'Backlog seed ready',
    summary: 'Đã có backlog V2 để chuyển framing sang Company OS và giảm hiểu nhầm thành ERP đơn lẻ.',
    nextAction: 'Rà label hiển thị, không đổi route/id nếu không cần.'
  }
];

export const COMMAND_CENTER_V2_ACCEPTANCE = [
  'Daily Brief dùng dữ liệu static hoặc local first để chạy offline.',
  'Mỗi card có lane, status, metric, summary và nextAction.',
  'Không cần thêm backend trong bước V2 nhỏ.',
  'Không thay thế module khác, chỉ tổng hợp trạng thái điều hành.'
];

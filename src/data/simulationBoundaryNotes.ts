export interface SimulationBoundaryNote {
  id: string;
  title: string;
  message: string;
  applyTo: string[];
}

export const SIMULATION_BOUNDARY_NOTES: SimulationBoundaryNote[] = [
  {
    id: 'static-learning-data',
    title: 'Dữ liệu mô phỏng',
    message: 'Nội dung trong khu vực này dùng để học, thiết kế quy trình và kiểm thử ý tưởng. Không xem là dữ liệu vận hành thật nếu chưa kết nối nguồn dữ liệu đã được duyệt.',
    applyTo: ['AccountingVietnam', 'InternalAuditWorkspace', 'CustomDataWorkbench', 'CommandCenter']
  },
  {
    id: 'human-review-required',
    title: 'Cần người duyệt cuối',
    message: 'Các gợi ý của AI hoặc dữ liệu mẫu chỉ là hỗ trợ phân tích. Người phụ trách vẫn phải kiểm tra chứng từ, quy định và bối cảnh doanh nghiệp trước khi áp dụng.',
    applyTo: ['AccountingVietnam', 'InternalAuditWorkspace', 'CommandCenter']
  },
  {
    id: 'offline-first',
    title: 'Offline-first',
    message: 'Bản V2 ưu tiên chạy được bằng dữ liệu tĩnh hoặc local-first trước khi mở rộng backend, Supabase hoặc webhook thật.',
    applyTo: ['CommandCenter', 'CustomDataWorkbench']
  }
];

export const SIMULATION_BOUNDARY_ACCEPTANCE = [
  'Panel mới phải ghi rõ phạm vi dữ liệu mô phỏng khi phù hợp.',
  'Không gọi API ngoài chỉ để hiển thị nội dung tĩnh.',
  'Không hardcode API key hoặc dữ liệu bí mật.',
  'Người dùng phải hiểu đâu là sandbox và đâu là dữ liệu thật.'
];

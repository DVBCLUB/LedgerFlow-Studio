import { Activity } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

export default function BuildMonitorPanel() {
  return (
    <SimplePanelCard
      eyebrow="DevOps"
      title="Build monitor"
      description="Theo dõi nhanh trạng thái build/review mà không kéo dài màn hình bằng log chi tiết. Khi cần đào sâu hãy mở CI Doctor hoặc Replit logs."
      icon={Activity}
      status="Gọn"
      tone="cyan"
      items={[
        'Kiểm tra npm run dev/build khi có lỗi hiển thị',
        'Ưu tiên lỗi chặn app chạy trước cảnh báo phụ',
        'Log chi tiết để trong terminal/Replit thay vì dàn đầy UI',
        'Dùng cho review nhanh một người dùng local-first',
      ]}
      actions={["Run", "Build", "Review"]}
    />
  );
}

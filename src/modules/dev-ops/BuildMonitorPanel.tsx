import { Activity } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

export default function BuildMonitorPanel() {
  return (
    <SimplePanelCard
      eyebrow="Phát hành"
      title="Theo dõi bản build"
      description="Theo dõi nhanh trạng thái build và duyệt thay đổi mà không kéo dài màn hình bằng log chi tiết."
      icon={Activity}
      status="Đang theo dõi"
      tone="cyan"
      items={[
        'Kiểm tra build khi có lỗi hiển thị',
        'Ưu tiên lỗi chặn app chạy trước cảnh báo phụ',
        'Log chi tiết để trong terminal hoặc môi trường preview',
        'Dùng cho duyệt nhanh trên máy local',
      ]}
      actions={["Chạy thử", "Build", "Duyệt"]}
    />
  );
}

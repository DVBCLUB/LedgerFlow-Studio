import { RefreshCw } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

export default function CIRecoveryQueue() {
  return (
    <SimplePanelCard
      eyebrow="CI recovery"
      title="Hàng đợi lỗi cần sửa"
      description="Không hiển thị danh sách lỗi dài trong module cài đặt. Chỉ giữ quy trình xử lý: lỗi nào chặn app chạy thì sửa trước."
      icon={RefreshCw}
      status="Ưu tiên"
      tone="amber"
      items={[
        'Lỗi app không mở được: P0',
        'Lỗi build/deploy: P1',
        'Cảnh báo lint/UI nhỏ: P2',
        'Ý tưởng cải tiến: đưa sang backlog module riêng',
      ]}
      actions={["P0", "P1", "P2"]}
    />
  );
}

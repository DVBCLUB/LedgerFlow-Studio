import { GitCommit } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

export default function PRControlCenter() {
  return (
    <SimplePanelCard
      eyebrow="Phát hành"
      title="Kiểm soát thay đổi"
      description="Khu vực kiểm soát thay đổi được rút gọn thành quy trình duyệt: xem phạm vi, đọc diff chính, test local, rồi mới nhập."
      icon={GitCommit}
      status="Chờ phê duyệt"
      tone="violet"
      items={[
        'Chỉ mở khi đang duyệt code từ GitHub hoặc công cụ AI',
        'Tập trung vào file đã đổi và ảnh hưởng giao diện',
        'Không hiển thị toàn bộ metadata PR trên màn hình chính',
        'Ghi chú lỗi bằng ảnh hoặc terminal rồi sửa tiếp',
      ]}
      actions={["Xem diff", "Kiểm thử", "Nhập thay đổi"]}
    />
  );
}

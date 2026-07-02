import { GitCommit } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

export default function PRControlCenter() {
  return (
    <SimplePanelCard
      eyebrow="DevOps"
      title="PR control"
      description="Khu vực kiểm soát pull request được rút gọn thành quy trình review: xem phạm vi, đọc diff chính, test local, rồi mới merge."
      icon={GitCommit}
      status="Review"
      tone="violet"
      items={[
        'Chỉ mở khi đang review code từ GitHub/Replit Agent',
        'Tập trung vào file đã đổi và ảnh hưởng giao diện',
        'Không hiển thị toàn bộ metadata PR trên màn hình chính',
        'Ghi chú lỗi bằng ảnh/terminal rồi sửa tiếp',
      ]}
      actions={["Diff", "Test", "Merge"]}
    />
  );
}

import { FileDiff } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

export default function PatchDiffReviewCenter() {
  return (
    <SimplePanelCard
      eyebrow="Phát hành"
      title="Duyệt nội dung thay đổi"
      description="Rút gọn khu vực xem patch thành một danh sách kiểm tra. Chi tiết diff nên xem trong GitHub hoặc môi trường phát triển."
      icon={FileDiff}
      status="Chờ phê duyệt"
      tone="amber"
      items={[
        'Đọc mục tiêu thay đổi trước khi xem từng dòng code',
        'Soát file UI/module chính trước file phụ',
        'Không nhập thay đổi đụng đăng nhập, dữ liệu hoặc xóa file nếu chưa test',
        'Ưu tiên một module/lần để dễ revert',
      ]}
      actions={["Phạm vi", "Rủi ro", "Kiểm thử"]}
    />
  );
}

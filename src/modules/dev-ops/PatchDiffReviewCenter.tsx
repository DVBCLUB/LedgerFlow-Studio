import { FileDiff } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

export default function PatchDiffReviewCenter() {
  return (
    <SimplePanelCard
      eyebrow="DevOps"
      title="Patch diff review"
      description="Rút gọn khu vực xem patch thành một checklist. Chi tiết diff nên xem trong GitHub/Replit để màn hình cài đặt không dài thòn."
      icon={FileDiff}
      status="Gọn"
      tone="amber"
      items={[
        'Đọc mục tiêu thay đổi trước khi xem từng dòng code',
        'Soát file UI/module chính trước file phụ',
        'Không merge patch đụng auth, dữ liệu hoặc xóa file nếu chưa test',
        'Ưu tiên một module/lần để dễ revert',
      ]}
      actions={["Scope", "Risk", "Test"]}
    />
  );
}

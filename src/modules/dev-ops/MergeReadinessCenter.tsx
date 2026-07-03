import { GitPullRequest } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

export default function MergeReadinessCenter() {
  return (
    <SimplePanelCard
      eyebrow="Phát hành"
      title="Sẵn sàng nhập thay đổi"
      description="Tóm tắt điều kiện trước khi nhận code mới: build ổn định, không chạm dữ liệu nhạy cảm, thay đổi đúng phạm vi."
      icon={GitPullRequest}
      status="Cần xử lý"
      tone="emerald"
      items={[
        'Build và chạy local ổn trước khi nhập thay đổi',
        'Không tự ý refactor lan sang module khác',
        'Ưu tiên UI gọn, ít panel kỹ thuật',
        'Có thể quay lại nhanh nếu duyệt không đạt',
      ]}
      actions={["Build ổn", "Đúng phạm vi", "Có thể khôi phục"]}
    />
  );
}

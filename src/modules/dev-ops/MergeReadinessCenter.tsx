import { GitPullRequest } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

export default function MergeReadinessCenter() {
  return (
    <SimplePanelCard
      eyebrow="DevOps"
      title="Merge readiness"
      description="Tóm tắt điều kiện trước khi nhận code mới: build xanh, không chạm dữ liệu nhạy cảm, thay đổi đúng phạm vi module đang review."
      icon={GitPullRequest}
      status="Checklist"
      tone="emerald"
      items={[
        'Build/chạy local ổn trước khi pull hoặc merge',
        'Không tự ý refactor lan sang module khác',
        'Ưu tiên UI gọn, ít panel kỹ thuật',
        'Có thể revert nhanh nếu review không đạt',
      ]}
      actions={["Build xanh", "Scope đúng", "Có revert"]}
    />
  );
}

import { Stethoscope } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

interface GitHubCIDoctorLauncherProps {
  hideTrigger?: boolean;
}

export default function GitHubCIDoctorLauncher(_props: GitHubCIDoctorLauncherProps) {
  return (
    <SimplePanelCard
      eyebrow="CI Doctor"
      title="Chẩn đoán CI khi build đỏ"
      description="Ẩn giao diện doctor dài khỏi màn hình chính. Khi Replit/GitHub báo lỗi, đọc terminal trước rồi mới mở doctor chi tiết."
      icon={Stethoscope}
      status="Khi lỗi"
      tone="rose"
      items={[
        'Dùng khi npm run dev/build fail',
        'Ưu tiên lỗi dependency, import, TypeScript',
        'Không chạy doctor liên tục nếu app đang ổn',
        'Ghi lại lỗi chính để sửa đúng file',
      ]}
      actions={["Terminal", "Build log", "Fix"]}
    />
  );
}

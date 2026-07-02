import { FlaskConical } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

export default function SandboxPatchWorkspace() {
  return (
    <SimplePanelCard
      eyebrow="DevOps"
      title="Sandbox patch workspace"
      description="Không dàn form tạo patch trên màn hình chính nữa. Dùng khu này như nhắc việc: sửa trong Replit/GitHub, test local, rồi mới đưa vào review."
      icon={FlaskConical}
      status="Ẩn chi tiết"
      tone="slate"
      items={[
        'Tạo patch trong Replit Agent hoặc VSCode để có diff rõ',
        'Mỗi lần chỉ chỉnh một module hoặc một flow',
        'Chụp lỗi màn hình/terminal làm bằng chứng review',
        'Không dùng sandbox để sửa dữ liệu production',
      ]}
      actions={["Replit", "GitHub", "Local"]}
    />
  );
}

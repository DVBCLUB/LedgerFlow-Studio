import { FlaskConical } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

export default function SandboxPatchWorkspace() {
  return (
    <SimplePanelCard
      eyebrow="Phát hành"
      title="Khu thử thay đổi"
      description="Không dàn form tạo patch trên màn hình chính nữa. Dùng khu này như nhắc việc: sửa trong GitHub hoặc IDE, test local, rồi mới đưa vào duyệt."
      icon={FlaskConical}
      status="Đang theo dõi"
      tone="slate"
      items={[
        'Tạo patch trong GitHub hoặc VS Code để có diff rõ',
        'Mỗi lần chỉ chỉnh một module hoặc một flow',
        'Chụp lỗi màn hình hoặc terminal làm bằng chứng duyệt',
        'Không dùng khu thử nghiệm để sửa dữ liệu production',
      ]}
      actions={["VS Code", "GitHub", "Local"]}
    />
  );
}

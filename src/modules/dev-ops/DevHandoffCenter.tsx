import { Github, Send, Terminal } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

const repoUrl = 'https://github.com/DVBCLUB/LedgerFlow-Studio';
const issuesUrl = `${repoUrl}/issues`;

export default function DevHandoffCenter() {
  const openRepo = () => window.open(repoUrl, '_blank', 'noopener,noreferrer');
  const openIssues = () => window.open(issuesUrl, '_blank', 'noopener,noreferrer');

  return (
    <div className="space-y-4 text-slate-100">
      <SimplePanelCard
        eyebrow="Developer handoff"
        title="Bàn giao việc sửa code"
        description="Phần này chỉ giữ các nút thao tác cần dùng. Prompt kỹ thuật, checklist dài và hướng dẫn cho AI coder không còn hiển thị trong giao diện chính."
        icon={Terminal}
        status="Ẩn prompt"
        tone="cyan"
        items={[
          'Mô tả yêu cầu bằng ngôn ngữ ngắn gọn',
          'Sửa một module hoặc một màn hình mỗi lần',
          'Test trên Replit/local trước khi merge',
          'Không đưa câu lệnh nội bộ vào UI người dùng',
        ]}
        actions={["Issue", "Preview", "Merge"]}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={openRepo} className="rounded-2xl border border-border-primary bg-slate-950/70 p-4 text-left hover:border-cyan-500/50">
          <Github className="mb-3 h-5 w-5 text-cyan-300" />
          <div className="text-sm font-black text-text-primary">Mở GitHub repo</div>
          <div className="mt-1 text-xs font-semibold text-text-tertiary">Xem code, commit và diff.</div>
        </button>
        <button type="button" onClick={openIssues} className="rounded-2xl border border-border-primary bg-slate-950/70 p-4 text-left hover:border-emerald-500/50">
          <Send className="mb-3 h-5 w-5 text-emerald-300" />
          <div className="text-sm font-black text-text-primary">Mở Issues</div>
          <div className="mt-1 text-xs font-semibold text-text-tertiary">Ghi việc cần sửa nếu muốn theo dõi.</div>
        </button>
      </div>
    </div>
  );
}

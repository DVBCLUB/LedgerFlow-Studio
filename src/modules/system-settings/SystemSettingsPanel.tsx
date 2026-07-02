import { Bot, Database, HardDrive, KeyRound, Palette, Shield } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

const settingGroups = [
  {
    title: 'AI Gateway & Keys',
    description: 'Nơi cấu hình provider AI khi cần dùng chức năng AI. Không dàn form kỹ thuật trên màn hình chính nữa.',
    icon: KeyRound,
    tone: 'violet' as const,
    items: ['AI key để ở backend/local vault', 'Không lưu secret vào frontend', 'Chỉ mở khi cần thêm hoặc đổi provider'],
  },
  {
    title: 'Bảo mật & Vault',
    description: 'Giữ nguyên nguyên tắc local-first: dữ liệu và khóa nhạy cảm nằm trên máy/chạy backend riêng.',
    icon: Shield,
    tone: 'emerald' as const,
    items: ['Mật khẩu chủ cho vault', 'Auto-lock khi không dùng', 'Không public token lên GitHub'],
  },
  {
    title: 'Dữ liệu local',
    description: 'Ưu tiên dùng local/Replit để review. Deploy public chỉ dùng khi thật sự cần chia sẻ link.',
    icon: HardDrive,
    tone: 'cyan' as const,
    items: ['localStorage cho trạng thái UI', 'File runtime để trong máy/server', 'Backup thủ công khi cần'],
  },
  {
    title: 'Giao diện cá nhân',
    description: 'Module này được tinh gọn cho một người dùng: ít tab kỹ thuật, ít bảng dài, ưu tiên trạng thái cần hành động.',
    icon: Palette,
    tone: 'slate' as const,
    items: ['Ẩn connector thử nghiệm', 'Dùng card tóm tắt thay vì log dài', 'Mỗi module chỉnh một lần để dễ review'],
  },
];

export default function SystemSettingsPanel() {
  return (
    <div className="space-y-5 text-left">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Cài đặt gọn cho solo founder</p>
            <h1 className="mt-2 text-2xl font-black text-white">Cài đặt & DevOps</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Màn hình này đã được rút gọn lại thành các khu vực cần thiết: AI key, bảo mật, dữ liệu local và quy trình review. Các log, connector thử nghiệm và bảng kỹ thuật dài được chuyển sang trạng thái tóm tắt.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px]">
            {['Local-first', 'Review nhanh', 'Ít panel rác'].map((label) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-center text-[11px] font-black uppercase tracking-wide text-slate-300">
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {settingGroups.map((group) => (
          <SimplePanelCard
            key={group.title}
            eyebrow="System settings"
            title={group.title}
            description={group.description}
            icon={group.icon}
            status="Tóm tắt"
            tone={group.tone}
            items={group.items}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SimplePanelCard
          eyebrow="AI"
          title="Khi nào cần mở cấu hình AI?"
          description="Chỉ mở khi app báo thiếu API key hoặc bạn muốn đổi model. Bình thường không cần nhìn bảng key/provider dài trong module cài đặt."
          icon={Bot}
          status="Theo nhu cầu"
          tone="violet"
          items={['Thêm key provider', 'Kiểm tra key còn quota', 'Đổi model mặc định', 'Khóa vault sau khi cấu hình']}
          actions={["AI settings", "Vault", "Test key"]}
        />
        <SimplePanelCard
          eyebrow="Database"
          title="Khi nào cần mở dữ liệu/tích hợp?"
          description="Chỉ mở khi cần kết nối GitHub/Replit/Supabase hoặc debug đồng bộ. Còn review UI/module thì không cần đụng phần này."
          icon={Database}
          status="Ẩn bớt"
          tone="cyan"
          items={['GitHub để lưu code', 'Replit để chạy preview', 'Local để dùng chính', 'Supabase chỉ khi cần cloud data']}
          actions={["GitHub", "Replit", "Local"]}
        />
      </div>
    </div>
  );
}

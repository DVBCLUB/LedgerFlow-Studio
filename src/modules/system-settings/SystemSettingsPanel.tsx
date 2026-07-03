import { Bot, Database, HardDrive, KeyRound, Palette, Shield } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';

const settingGroups = [
  {
    title: 'Khóa AI & Kết nối mô hình',
    description: 'Nơi cấu hình khóa AI khi cần dùng chức năng AI, không dàn form kỹ thuật trên màn hình chính.',
    icon: KeyRound,
    tone: 'violet' as const,
    items: ['Khóa AI để ở backend hoặc kho local', 'Không lưu khóa bí mật vào giao diện', 'Chỉ mở khi cần thêm hoặc đổi mô hình'],
  },
  {
    title: 'Bảo mật & Kho khóa',
    description: 'Giữ nguyên nguyên tắc local-first: dữ liệu và khóa nhạy cảm nằm trên máy/chạy backend riêng.',
    icon: Shield,
    tone: 'emerald' as const,
    items: ['Mật khẩu chủ cho kho khóa', 'Tự khóa khi không dùng', 'Không đưa token lên GitHub'],
  },
  {
    title: 'Dữ liệu cục bộ',
    description: 'Ưu tiên dùng local/Replit để review. Deploy public chỉ dùng khi thật sự cần chia sẻ link.',
    icon: HardDrive,
    tone: 'cyan' as const,
    items: ['Lưu trạng thái giao diện trên máy', 'File vận hành để trong máy hoặc server local', 'Sao lưu thủ công khi cần'],
  },
  {
    title: 'Giao diện cá nhân',
    description: 'Module này được tinh gọn cho một người dùng: ít tab kỹ thuật, ít bảng dài, ưu tiên trạng thái cần hành động.',
    icon: Palette,
    tone: 'slate' as const,
    items: ['Ẩn kết nối thử nghiệm', 'Dùng card tóm tắt thay vì log dài', 'Mỗi module chỉnh một lần để dễ duyệt'],
  },
];

export default function SystemSettingsPanel() {
  return (
    <div className="space-y-5 text-left">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Quản trị hệ thống</p>
            <h1 className="mt-2 text-2xl font-black text-white">Quản trị hệ thống</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Cấu hình, tích hợp, bảo mật, nhật ký kiểm soát và quy trình phát hành được gom vào một khu vực quản trị.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px]">
            {['An toàn', 'Đang theo dõi', 'Cần cấu hình'].map((label) => (
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
            eyebrow="Quản trị"
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
          description="Chỉ mở khi app báo thiếu khóa AI hoặc bạn muốn đổi mô hình. Bình thường không cần nhìn bảng cấu hình dài."
          icon={Bot}
          status="Theo nhu cầu"
          tone="violet"
          items={['Thêm khóa AI', 'Kiểm tra hạn mức', 'Đổi mô hình mặc định', 'Khóa kho sau khi cấu hình']}
          actions={["Cấu hình AI", "Kho khóa", "Kiểm tra khóa"]}
        />
        <SimplePanelCard
          eyebrow="Tích hợp"
          title="Khi nào cần mở dữ liệu hoặc tích hợp?"
          description="Chỉ mở khi cần kết nối GitHub, Supabase hoặc kiểm tra đồng bộ. Khi duyệt giao diện thông thường thì không cần vào phần này."
          icon={Database}
          status="Ẩn bớt"
          tone="cyan"
          items={['GitHub để lưu mã nguồn', 'Môi trường preview để kiểm thử', 'Local để dùng chính', 'Supabase chỉ khi cần dữ liệu cloud']}
          actions={["GitHub", "Preview", "Local"]}
        />
      </div>
    </div>
  );
}

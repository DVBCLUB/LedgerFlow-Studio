import { useEffect, useState } from 'react';
import { Bot, Database, HardDrive, KeyRound, Palette, Shield, Globe, FileSpreadsheet, Users, Plus, Trash2 } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';
import { useLanguage } from '../../context';
import HybridCloudSyncPanel from './HybridCloudSyncPanel';

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
  const { language, setLanguage, t } = useLanguage();
  const [users, setUsers] = useState<Array<{ email: string; role: string; createdAt: string }>>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'owner' | 'operator' | 'viewer'>('operator');
  const [userError, setUserError] = useState('');

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (data.success) setUsers(data.users || []);
    } catch {
      // không bắt buộc
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const addUser = async () => {
    setUserError('');
    if (!newEmail.includes('@') || newPassword.length < 6) {
      setUserError('Email hợp lệ + mật khẩu tối thiểu 6 ký tự.');
      return;
    }
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (!data.success) {
        setUserError(data.error || 'Lỗi tạo tài khoản.');
        return;
      }
      setNewEmail('');
      setNewPassword('');
      await loadUsers();
    } catch (err) {
      setUserError(err instanceof Error ? err.message : String(err));
    }
  };

  const removeUser = async (email: string) => {
    try {
      await fetch(`/api/auth/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
      await loadUsers();
    } catch {
      // bỏ qua
    }
  };

  return (
    <div className="space-y-5 text-left">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-indigo-950/20 p-6 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Quản trị hệ thống</p>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{t('settings.title', 'Quản trị hệ thống & Cấu hình')}</h1>
            <p className="mt-2.5 max-w-3xl text-xs font-semibold leading-6 text-slate-300/90">
              Cấu hình, tích hợp, bảo mật, nhật ký kiểm soát và quy trình phát hành được gom gọn vào một khu vực quản trị an toàn.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px]">
            {[
              { label: 'An toàn', color: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' },
              { label: 'Đang theo dõi', color: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300' },
              { label: 'Cần cấu hình', color: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300' },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl border ${item.color} px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-wider shadow-sm`}>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-indigo-500/30 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{t('settings.language_title', '🌐 Cấu hình Ngôn ngữ / Language Settings')}</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{t('settings.language_desc', 'Lựa chọn ngôn ngữ hiển thị mặc định trên toàn bộ giao diện phần mềm.')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setLanguage('vi')}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                language === 'vi'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-white/10'
              }`}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-white/10'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3 text-xs font-semibold text-emerald-400">
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          <span>{t('settings.office_precision', 'Định dạng Biểu mẫu Office Paper-Grade:')} {t('settings.office_enabled', 'Đã kích hoạt chuẩn in nét căng Office Excel/Word')}</span>
        </div>
      </section>

      {/* Dual-Engine Storage & iPhone Mobile PWA Panel */}
      <HybridCloudSyncPanel />

      <section className="rounded-3xl border border-cyan-500/30 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Tài khoản & Người dùng</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Tạo tài khoản riêng cho từng thành viên (owner/operator/viewer). Tài khoản đầu tiên tự động là owner. Mật khẩu băm scrypt, lưu local.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@congty.local" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white" />
          <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Mật khẩu ≥ 6 ký tự" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white" />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'owner' | 'operator' | 'viewer')} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white">
            <option value="owner">Owner</option>
            <option value="operator">Operator</option>
            <option value="viewer">Viewer</option>
          </select>
          <button onClick={addUser} className="inline-flex items-center gap-1 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-black text-slate-950 hover:bg-cyan-400">
            <Plus className="h-3.5 w-3.5" /> Thêm
          </button>
        </div>
        {userError && <p className="mt-2 text-xs font-bold text-rose-300">{userError}</p>}

        <div className="mt-3 space-y-1.5">
          {users.length === 0 && <p className="text-xs text-slate-500">Chưa có tài khoản nào — hệ thống đang dùng mật khẩu dev chung.</p>}
          {users.map((u) => (
            <div key={u.email} className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs">
              <span className="font-bold text-white">{u.email}</span>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black text-cyan-300">{u.role}</span>
              <button onClick={() => removeUser(u.email)} className="ml-auto text-slate-500 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
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

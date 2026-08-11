import React from 'react';
import { User, UserPlus, Trash2, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { type WebAIProfile, checkWebAIProfileSession, openWebAIProfileLogin } from '../../../utils/assistantApi';

interface ProfilesTabProps {
  webAIProfiles: WebAIProfile[];
  webAIProfilesLoading: boolean;
  selectedProfileId: string;
  setSelectedProfileId: (val: string) => void;
  newProfileName: string;
  setNewProfileName: (val: string) => void;
  newProfilePlatform: string;
  setNewProfilePlatform: (val: string) => void;
  handleCreateProfile: (e: React.FormEvent) => void;
  handleDeleteProfile: (id: string) => void;
  loadWebAIProfiles: (silent?: boolean) => void;
  pushNotice: (kind: 'success' | 'error', text: string) => void;
}

const statusStyles: Record<string, string> = {
  ready: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20',
  login_required: 'bg-amber-950/60 text-amber-300 border border-amber-500/20',
  error: 'bg-rose-950/60 text-rose-300 border border-rose-500/20',
  quota: 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/20',
  untested: 'bg-slate-950/60 text-text-secondary border border-border-primary',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statusStyles[status] || statusStyles.untested}`}>
      {status}
    </span>
  );
}

export default function ProfilesTab({
  webAIProfiles,
  webAIProfilesLoading,
  selectedProfileId,
  setSelectedProfileId,
  newProfileName,
  setNewProfileName,
  newProfilePlatform,
  setNewProfilePlatform,
  handleCreateProfile,
  handleDeleteProfile,
  loadWebAIProfiles,
  pushNotice,
}: ProfilesTabProps) {
  const [checkingIds, setCheckingIds] = React.useState<Record<string, boolean>>({});
  const [loggingInIds, setLoggingInIds] = React.useState<Record<string, boolean>>({});

  const handleCheckSession = async (profileId: string, platform: string) => {
    setCheckingIds(prev => ({ ...prev, [profileId]: true }));
    try {
      const res = await checkWebAIProfileSession(profileId, platform);
      if (res.ok) {
        pushNotice('success', `Kết nối Profile OK: Trạng thái hiện tại là Ready.`);
      } else {
        pushNotice('error', `Kết nối thất bại: ${res.error || 'Yêu cầu đăng nhập hoặc có lỗi xảy ra.'}`);
      }
      loadWebAIProfiles(true);
    } catch (err: any) {
      pushNotice('error', `Lỗi kiểm tra session: ${err.message}`);
    } finally {
      setCheckingIds(prev => ({ ...prev, [profileId]: false }));
    }
  };

  const handleManualLogin = async (profileId: string, platform: string) => {
    setLoggingInIds(prev => ({ ...prev, [profileId]: true }));
    pushNotice('success', `Đang mở trình duyệt. Hãy đăng nhập tài khoản và ĐÓNG cửa sổ trình duyệt Chrome khi hoàn thành!`);
    try {
      const res = await openWebAIProfileLogin(profileId, platform);
      if (res.ok) {
        pushNotice('success', `Đăng nhập & Lưu session OK cho Profile.`);
      } else {
        pushNotice('error', `Kiểm tra session sau khi đóng trình duyệt thất bại: ${res.error || 'Vẫn yêu cầu đăng nhập.'}`);
      }
      loadWebAIProfiles(true);
    } catch (err: any) {
      pushNotice('error', `Lỗi đăng nhập: ${err.message}`);
    } finally {
      setLoggingInIds(prev => ({ ...prev, [profileId]: false }));
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Create profile form */}
      <div className="rounded-xl border border-border-primary bg-bg-primary/40 p-4 space-y-3">
        <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
          <UserPlus className="h-4 w-4 text-violet-400" /> Thêm tài khoản mới (Web AI Profile)
        </h3>
        <form onSubmit={handleCreateProfile} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">
                Tên tài khoản
              </label>
              <input
                type="text"
                required
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                placeholder="e.g. Gmail Cá Nhân, Gmail Công Ty"
                className="w-full bg-slate-950 border border-border-primary rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:border-violet-500/60 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">
                Nền tảng AI
              </label>
              <select
                value={newProfilePlatform}
                onChange={e => setNewProfilePlatform(e.target.value)}
                className="w-full bg-slate-950 border border-border-primary rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-bold focus:border-violet-500"
              >
                <option value="chatgpt">ChatGPT</option>
                <option value="gemini">Gemini</option>
                <option value="claude">Claude</option>
                <option value="deepseek">DeepSeek</option>
                <option value="grok">Grok</option>
                <option value="copilot">Copilot</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 text-text-primary text-xs font-black rounded-xl transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" /> Tạo Profile Tài Khoản
          </button>
        </form>
      </div>

      {/* Profiles list */}
      <div className="rounded-xl border border-border-primary bg-bg-primary/40 p-4 space-y-3">
        <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
          <User className="h-4 w-4 text-violet-400" /> Danh sách tài khoản đã lưu
        </h3>
        
        {webAIProfilesLoading ? (
          <div className="flex items-center justify-center py-6 text-xs text-text-tertiary gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" /> Đang tải danh sách profile...
          </div>
        ) : (webAIProfiles || []).length === 0 ? (
          <div className="text-center py-8 text-xs text-text-tertiary font-semibold">
            Chưa có profile tài khoản nào. Hãy đăng ký một tài khoản ở trên.
          </div>
        ) : (
          <div className="space-y-3">
            {(webAIProfiles || []).map(p => {
              const isChecking = checkingIds[p.id];
              const isLoggingIn = loggingInIds[p.id];
              return (
                <div key={p.id} className="rounded-2xl border border-border-primary bg-slate-950/70 p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-text-primary truncate" title={p.name}>{p.name}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800/40 font-mono">
                          {p.platform}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[9px] text-text-tertiary">
                        <span>.chrome_profiles/{p.profileDir}</span>
                        {p.lastUsedAt && <span>Last used {new Date(p.lastUsedAt).toLocaleString('vi-VN')}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={p.status} />
                        <span className="text-[9px] text-text-secondary">Failures: {p.consecutiveFailures}</span>
                      </div>
                      {p.lastError && <div className="text-[10px] text-rose-400 truncate" title={p.lastError}>{p.lastError}</div>}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedProfileId(p.id);
                        pushNotice('success', `Đã chọn profile "${p.name}" cho các tác vụ Web AI.`);
                      }}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all ${
                        selectedProfileId === p.id
                          ? 'bg-emerald-600 text-text-primary'
                          : 'bg-bg-primary text-text-secondary border border-border-primary hover:bg-bg-surface'
                      }`}
                    >
                      {selectedProfileId === p.id ? 'Đang dùng' : 'Chọn'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCheckSession(p.id, p.platform)}
                      disabled={isChecking || isLoggingIn}
                      className="flex items-center justify-center gap-2 rounded-xl border border-border-primary bg-violet-950/20 px-2 py-2 text-[10px] font-black text-violet-300 hover:bg-violet-950/30 disabled:opacity-50"
                    >
                      {isChecking ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Kiểm tra
                    </button>
                    <button
                      onClick={() => handleManualLogin(p.id, p.platform)}
                      disabled={isChecking || isLoggingIn}
                      className="flex items-center justify-center gap-2 rounded-xl border border-border-primary bg-slate-950/80 px-2 py-2 text-[10px] font-black text-text-secondary hover:bg-slate-900 disabled:opacity-50"
                    >
                      {isLoggingIn ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                      Login
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(p.id)}
                      className="col-span-2 rounded-xl border border-rose-700/40 bg-rose-950/20 px-2 py-2 text-[10px] font-black text-rose-300 hover:bg-rose-900/30"
                    >
                      <Trash2 className="h-3.5 w-3.5 inline" /> Xóa profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

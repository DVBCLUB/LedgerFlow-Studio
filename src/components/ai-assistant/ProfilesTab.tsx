import React from 'react';
import { User, UserPlus, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { type WebAIProfile } from '../../utils/assistantApi';

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
  return (
    <div className="p-4 space-y-4">
      {/* Create profile form */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
          <UserPlus className="h-4 w-4 text-violet-400" /> Thêm tài khoản mới (Web AI Profile)
        </h3>
        <form onSubmit={handleCreateProfile} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Tên tài khoản
              </label>
              <input
                type="text"
                required
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                placeholder="e.g. Gmail Cá Nhân, Gmail Công Ty"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:border-violet-500/60 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Nền tảng AI
              </label>
              <select
                value={newProfilePlatform}
                onChange={e => setNewProfilePlatform(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-bold focus:border-violet-500"
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
            className="w-full flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black rounded-xl transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" /> Tạo Profile Tài Khoản
          </button>
        </form>
      </div>

      {/* Profiles list */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
          <User className="h-4 w-4 text-violet-400" /> Danh sách tài khoản đã lưu
        </h3>
        
        {webAIProfilesLoading ? (
          <div className="flex items-center justify-center py-6 text-xs text-slate-500 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" /> Đang tải danh sách profile...
          </div>
        ) : webAIProfiles.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-semibold">
            Chưa có profile tài khoản nào. Hãy đăng ký một tài khoản ở trên.
          </div>
        ) : (
          <div className="space-y-2">
            {webAIProfiles.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700/60 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      {p.name}
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-violet-950 text-violet-400 border border-violet-800/40 font-mono">
                        {p.platform}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Thư mục: .chrome_profiles/{p.profileDir}
                    </div>
                    {p.lastUsedAt && (
                      <div className="text-[9px] text-slate-600 mt-0.5 font-semibold">
                        Sử dụng cuối: {new Date(p.lastUsedAt).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedProfileId(p.id);
                      pushNotice('success', `Đã chọn profile "${p.name}" cho các tác vụ Web AI.`);
                    }}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ${
                      selectedProfileId === p.id
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {selectedProfileId === p.id ? 'Đang Chọn' : 'Chọn'}
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(p.id)}
                    className="p-1.5 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                    title="Xóa Profile"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

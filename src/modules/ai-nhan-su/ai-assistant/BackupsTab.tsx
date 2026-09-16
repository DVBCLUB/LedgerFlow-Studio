import React, { useState } from 'react';
import { FileSearch, HardDrive, Loader2, GitCommit } from 'lucide-react';
import { listBackups, type BackupEntry } from '../../../utils/assistantApi';

export default function BackupsTab() {
  const [backupFile, setBackupFile] = useState('');
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);

  const loadBackups = async () => {
    if (!backupFile.trim()) return;
    setBackupsLoading(true);
    try {
      const b = await listBackups(backupFile.trim());
      setBackups(Array.isArray(b) ? b : []);
    } catch {
      setBackups([]);
    } finally {
      setBackupsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1.5">
          File để xem backups
        </label>
        <div className="flex gap-2">
          <input
            value={backupFile}
            onChange={e => setBackupFile(e.target.value)}
            placeholder="server/services/aiRouter.ts"
            className="flex-1 bg-bg-primary border border-border-secondary rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-violet-500/60 outline-none font-mono"
          />
          <button
            onClick={loadBackups}
            disabled={backupsLoading}
            className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-text-primary rounded-xl transition-colors"
          >
            {backupsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {backups.length === 0 && !backupsLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-tertiary">
          <HardDrive className="h-8 w-8 opacity-30" />
          <p className="text-xs font-semibold text-center">
            Nhập đường dẫn file và nhấn tìm kiếm.<br />Backups được tạo tự động khi AI apply code.
          </p>
        </div>
      )}

      {backups.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
            {backups.length} backup(s) tìm thấy
          </div>
          {backups.map((b, i) => (
            <div key={b.id} className="bg-bg-primary/60 border border-border-primary rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-text-secondary font-mono">#{i + 1} · {b.id.slice(0, 8)}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  b.strategy === 'git-commit'
                    ? 'bg-violet-950/40 text-violet-400 border border-violet-700/40'
                    : 'bg-amber-950/40 text-amber-400 border border-amber-700/40'
                }`}>
                  {b.strategy === 'git-commit' ? <><GitCommit className="h-2.5 w-2.5 inline mr-1" />git</> : <><HardDrive className="h-2.5 w-2.5 inline mr-1" />file</>}
                </span>
              </div>
              <div className="text-[10px] text-text-tertiary font-mono">
                {new Date(b.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

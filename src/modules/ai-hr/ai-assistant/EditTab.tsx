import React, { useState } from 'react';
import { Wand2, Loader2, RefreshCw, Info, BookOpen, FileCode2, CheckCircle2, X, RotateCcw } from 'lucide-react';
import { type EditResult, type WebAIProfile } from '../../../utils/assistantApi';
import CodeBlock from './CodeBlock';

interface LintErrorHighlight {
  file: string;
  line: number;
  col?: number;
  message: string;
  severity: 'error' | 'warning';
}

function parseLintErrors(errorsString: string): LintErrorHighlight[] {
  if (!errorsString) return [];
  const lines = errorsString.split('\n');
  const results: LintErrorHighlight[] = [];
  
  for (const line of lines) {
    // 1. TypeScript Match: src/file.tsx(10,5): error TS1234: message
    const tsMatch = line.match(/([a-zA-Z0-9_\-\.\/\\\s]+)\((\d+),(\d+)\):\s+(error|warning)\s+([^:]+):\s+(.*)/i);
    if (tsMatch) {
      results.push({
        file: tsMatch[1].trim(),
        line: parseInt(tsMatch[2], 10),
        col: parseInt(tsMatch[3], 10),
        severity: tsMatch[4].toLowerCase() === 'warning' ? 'warning' : 'error',
        message: `${tsMatch[5]}: ${tsMatch[6].trim()}`,
      });
      continue;
    }
    
    // 2. ESLint Match: d:\path\file.tsx:10:5  error  message
    const eslintMatch = line.match(/(?:[a-zA-Z]:)?([a-zA-Z0-9_\-\.\/\\\s]+):(\d+):(\d+)\s+(error|warning)\s+(.*)/i);
    if (eslintMatch) {
      results.push({
        file: eslintMatch[1].trim(),
        line: parseInt(eslintMatch[2], 10),
        col: parseInt(eslintMatch[3], 10),
        severity: eslintMatch[4].toLowerCase() === 'warning' ? 'warning' : 'error',
        message: eslintMatch[5].trim(),
      });
    }
  }
  return results;
}

interface EditTabProps {
  engineMode: 'api' | 'web_automation';
  setEngineMode: (val: 'api' | 'web_automation') => void;
  webPlatform: string;
  setWebPlatform: (val: string) => void;
  selectedProfileId: string;
  setSelectedProfileId: (val: string) => void;
  webAIProfiles: WebAIProfile[];
  headlessEnabled: boolean;
  setHeadlessEnabled: (val: boolean) => void;
  selectedRole: string;
  setSelectedRole: (val: string) => void;
  roles: Array<{ id: string; emoji: string; group: string }>;
  rolesLoading: boolean;
  loadRoles: (silent?: boolean) => void;
  selectedRolePrompt: string;
  rolePromptLoading: boolean;
  setRolePromptTick: React.Dispatch<React.SetStateAction<number>>;
  editFile_path: string;
  setEditFilePath: (val: string) => void;
  editInstruction: string;
  setEditInstruction: (val: string) => void;
  autoRepairEnabled: boolean;
  setAutoRepairEnabled: (val: boolean) => void;
  captureScreenshot: boolean;
  setCaptureScreenshot: (val: boolean) => void;
  editLoading: boolean;
  runEdit: () => void;
  editResult: EditResult | null;
  runApply: () => void;
  applyLoading: boolean;
  applyProgress: any;
  setEditResult: (val: EditResult | null) => void;
  setApplyResult: (val: any | null) => void;
  runRollback: () => void;
  rollbackLoading: boolean;
  applyResult: any | null;
  rolePromptNotifyRef: React.MutableRefObject<boolean>;
}

export default function EditTab({
  engineMode,
  setEngineMode,
  webPlatform,
  setWebPlatform,
  selectedProfileId,
  setSelectedProfileId,
  webAIProfiles,
  headlessEnabled,
  setHeadlessEnabled,
  selectedRole,
  setSelectedRole,
  roles,
  rolesLoading,
  loadRoles,
  selectedRolePrompt,
  rolePromptLoading,
  setRolePromptTick,
  editFile_path,
  setEditFilePath,
  editInstruction,
  setEditInstruction,
  autoRepairEnabled,
  setAutoRepairEnabled,
  captureScreenshot,
  setCaptureScreenshot,
  editLoading,
  runEdit,
  editResult,
  runApply,
  applyLoading,
  applyProgress,
  setEditResult,
  setApplyResult,
  runRollback,
  rollbackLoading,
  applyResult,
  rolePromptNotifyRef,
}: EditTabProps) {
  const [expandedRepairStep, setExpandedRepairStep] = useState<number | null>(null);

  const parsedErrors = (() => {
    if (!applyResult) return [];
    let errStr = '';
    if (applyResult.repairStatus?.steps?.length) {
      errStr = applyResult.repairStatus.steps[applyResult.repairStatus.steps.length - 1]?.errors || '';
    }
    if (!errStr && applyResult.message) {
      errStr = applyResult.message;
    }
    return parseLintErrors(errStr);
  })();

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-300">Chế độ xử lý đề xuất:</span>
          <select
            value={engineMode}
            onChange={e => setEngineMode(e.target.value as 'api' | 'web_automation')}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none font-bold focus:border-violet-500"
          >
            <option value="api">API Local (AI Gateway)</option>
            <option value="web_automation">Browser Automation (Web AI)</option>
          </select>
        </div>

        {engineMode === 'web_automation' && (
          <>
            <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-slate-800/60">
              <span className="font-bold text-slate-300">Nền tảng Web AI:</span>
              <select
                value={webPlatform}
                onChange={e => setWebPlatform(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none font-bold focus:border-violet-500"
              >
                <option value="chatgpt">ChatGPT</option>
                <option value="gemini">Gemini</option>
                <option value="claude">Claude</option>
                <option value="deepseek">DeepSeek</option>
                <option value="grok">Grok</option>
                <option value="copilot">Copilot</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-slate-800/60">
              <span className="font-bold text-slate-300">Tài khoản (Profile):</span>
              <select
                value={selectedProfileId}
                onChange={e => setSelectedProfileId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none font-bold focus:border-violet-500"
              >
                <option value="">-- Mặc định --</option>
                {webAIProfiles
                  .filter(p => p.platform === webPlatform.toLowerCase())
                  .map(p => (
                    <option key={p.id} value={p.id} disabled={!p.enabled || p.status === 'quota'}>
                      {p.name} ({p.status})
                    </option>
                  ))
                }
              </select>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-slate-800/60">
              <span className="font-bold text-slate-300">Chạy ẩn (Headless Mode):</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={headlessEnabled}
                  onChange={e => setHeadlessEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white"></div>
              </label>
            </div>
          </>
        )}
      </div>

      {engineMode === 'web_automation' && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-3 text-xs leading-6 text-violet-300 font-semibold">
          ⚠️ <b>Chế độ trình duyệt:</b> {selectedProfileId ? 'Đang chạy với Profile được chọn.' : 'Đang chạy với Profile mặc định.'} Cửa sổ Chrome tự động mở. Nếu chưa đăng nhập, vui lòng hoàn tất đăng nhập một lần để lưu session cookies.
        </div>
      )}

      <div className="space-y-3">
        {/* Agent Role Select */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            AI Agent Role (Vai trò nhân sự)
          </label>
          <select
            value={selectedRole}
            onChange={e => {
              const val = e.target.value;
              setSelectedRole(val);
              localStorage.setItem('lf_assistant_selected_role', val);
              rolePromptNotifyRef.current = false;
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-violet-500/60 outline-none font-bold"
          >
            <option value="">-- Mặc định (AI Dev) --</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>
                {r.emoji} {r.id} ({r.group})
              </option>
            ))}
          </select>
          <button
            onClick={() => loadRoles(false)}
            disabled={rolesLoading}
            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:text-white disabled:opacity-40"
            title="Tải lại danh sách vai trò từ server"
          >
            <RefreshCw className={`h-3 w-3 ${rolesLoading ? 'animate-spin' : ''}`} /> Reload Roles
          </button>
          {selectedRole && (
            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Info className="h-3 w-3" /> System prompt đang đồng bộ từ server
                </div>
                <button
                  onClick={() => {
                    rolePromptNotifyRef.current = true;
                    setRolePromptTick((v) => v + 1);
                  }}
                  disabled={rolePromptLoading}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-300 hover:text-white disabled:opacity-40"
                  title="Tải lại system prompt từ server"
                >
                  <RefreshCw className={`h-3 w-3 ${rolePromptLoading ? 'animate-spin' : ''}`} /> Reload
                </button>
              </div>
              {rolePromptLoading ? (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Đang tải prompt...
                </div>
              ) : (
                <pre className="max-h-24 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-slate-300">{selectedRolePrompt || 'Không tải được prompt cho role này.'}</pre>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            Đường dẫn file (phân tách bằng dấu phẩy cho nhiều file)
          </label>
          <input
            value={editFile_path}
            onChange={e => setEditFilePath(e.target.value)}
            placeholder="src/components/App.tsx, src/main.tsx"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-violet-500/60 outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            Lệnh cho AI
          </label>
          <textarea
            value={editInstruction}
            onChange={e => setEditInstruction(e.target.value)}
            rows={3}
            placeholder="Thêm error boundary, Refactor theo best practices, Sửa lỗi TypeScript..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-violet-500/60 outline-none resize-none"
          />
        </div>

        {/* Auto-Repair Switch */}
        <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 rounded-xl p-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-200">Auto-Repair Compiler errors</span>
            <span className="text-[10px] text-slate-500">Tự động chạy tsc và sửa nếu code lỗi</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoRepairEnabled}
              onChange={e => setAutoRepairEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white"></div>
          </label>
        </div>

        {/* Screenshot Switch */}
        {engineMode === 'web_automation' && (
          <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 rounded-xl p-3">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">Chụp ảnh màn hình kiểm thử giao diện</span>
              <span className="text-[10px] text-slate-500">Sử dụng cho Multimodal Visual Check</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={captureScreenshot}
                onChange={e => setCaptureScreenshot(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white"></div>
            </label>
          </div>
        )}

        <button
          onClick={runEdit}
          disabled={editLoading || !editFile_path.trim() || !editInstruction.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-colors"
        >
          {editLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> AI đang phân tích...
            </>
          ) : (
            <>
              <Wand2 className="h-3.5 w-3.5" /> Tạo đề xuất AI
            </>
          )}
        </button>
      </div>

      {/* Result panel */}
      {editResult && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              editResult.ok ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-700/40' : 'bg-rose-950/40 text-rose-400 border border-rose-700/40'
            }`}>
              {editResult.ok ? '✓ Thành công' : '✗ Lỗi'}
            </span>
            {editResult.taskDetected && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-violet-950/40 text-violet-400 border border-violet-700/40">
                Task: {editResult.taskDetected}
              </span>
            )}
            {editResult.modelUsed && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                <RefreshCw className="h-2.5 w-2.5" /> {editResult.modelUsed}
              </span>
            )}
          </div>

          {editResult.explanation && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                <BookOpen className="h-3 w-3" /> Giải thích
              </div>
              {editResult.explanation}
            </div>
          )}

          {(editResult as any).screenshotPath && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                📸 Ảnh chụp màn hình giao diện (Multimodal Check)
              </div>
              <div className="relative rounded-lg overflow-hidden border border-slate-850 bg-black max-h-60 flex flex-col items-center justify-center p-4">
                <div className="text-[11px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full mb-2">
                  ✓ Screenshot saved successfully
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {(editResult as any).screenshotPath.split(/[\\/]/).pop()}
                </div>
              </div>
            </div>
          )}

          {editResult.codeBlocks && editResult.codeBlocks.length > 0 && (
            <div className="space-y-3">
              {editResult.codeBlocks.map((block, idx) => {
                const blockErrors = parsedErrors.filter(err => 
                  block.targetFile && (
                    err.file.endsWith(block.targetFile) || 
                    block.targetFile.endsWith(err.file) ||
                    err.file.includes(block.targetFile)
                  )
                );
                
                return (
                  <div key={idx}>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <FileCode2 className="h-3 w-3" /> Code đề xuất {block.targetFile ? `(${block.targetFile})` : `#${idx + 1}`}
                    </div>
                    <CodeBlock code={block.code} language={block.language} />
                    
                    {blockErrors.length > 0 && (
                      <div className="mt-2 p-3 rounded-xl border border-rose-850 bg-rose-950/20 text-rose-350 space-y-1.5 font-mono text-[11px] animate-fadeIn">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-400">
                          <X className="h-3.5 w-3.5 text-rose-500" /> Lỗi Linter/Biên dịch phát hiện trong file này
                        </div>
                        <div className="space-y-1 pl-1">
                          {blockErrors.map((err, errIdx) => (
                            <div key={errIdx} className="pl-3 border-l-2 border-rose-800">
                              <span className="font-bold text-slate-400">Dòng {err.line}:{err.col || 0}:</span> {err.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {editResult.hasPendingSuggestion && (
            <div className="flex gap-2">
              <button
                onClick={runApply}
                disabled={applyLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-colors"
              >
                {applyLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang ghi file...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Apply (tạo backup)
                  </>
                )}
              </button>
              <button
                onClick={() => { setEditResult(null); setApplyResult(null); }}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {applyLoading && (
            <div className="rounded-xl bg-slate-950 border border-slate-900 p-3.5 space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                <span className="text-xs font-bold text-slate-300">Đang ghi file & chạy Auto-Repair...</span>
              </div>
              {applyProgress && applyProgress.active && (
                <div className="space-y-1.5 pl-6 border-l border-slate-850">
                  <div className="text-[10px] text-slate-400">
                    Trạng thái: <span className="font-bold text-violet-400 uppercase tracking-wider">{applyProgress.status}</span> 
                    {applyProgress.loop > 0 && ` (Vòng lặp ${applyProgress.loop}/${applyProgress.maxLoops})`}
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono italic">
                    {applyProgress.message}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={runRollback}
            disabled={rollbackLoading}
            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-700/40 text-slate-400 hover:text-rose-300 text-xs font-bold rounded-xl transition-all"
          >
            {rollbackLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rolling back...
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" /> Rollback file về backup trước
              </>
            )}
          </button>
        </div>
      )}

      {applyResult && (
        <div className={`rounded-xl p-4 text-xs border ${
          applyResult.success
            ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-100'
            : 'bg-rose-950/20 border-rose-800/60 text-rose-100'
        } space-y-3`}>
          <div className="flex items-center gap-2 font-black">
            <span className={applyResult.success ? 'text-emerald-400 text-sm' : 'text-rose-400 text-sm'}>
              {applyResult.success ? '✓ Hoàn thành' : '✗ Thất bại'}
            </span>
          </div>
          
          <div className="whitespace-pre-line leading-relaxed font-semibold">
            {applyResult.message}
          </div>

          {/* Render Auto-Repair validation cycles detail if repairStatus exists */}
          {applyResult.repairStatus && (
            <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Auto-Repair Feedback Diagnostics</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                  applyResult.repairStatus.ok ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                }`}>
                  {applyResult.repairStatus.ok ? 'Clean' : 'Failed'}
                </span>
              </div>
              <div className="text-[11px] leading-5 text-slate-300 font-mono">
                Số vòng lặp sửa lỗi đã chạy: <span className="font-bold text-white">{applyResult.repairStatus.loops}</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap bg-slate-900/50 p-2 rounded border border-slate-850">
                {applyResult.repairStatus.message}
              </div>

              {/* Detailed steps list */}
              {applyResult.repairStatus.steps && applyResult.repairStatus.steps.length > 0 && (
                <div className="mt-2.5 space-y-2 pt-2.5 border-t border-slate-900">
                  <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Repair Steps Timeline:</div>
                  {applyResult.repairStatus.steps.map((step: any, sIdx: number) => {
                    const isExpanded = expandedRepairStep === sIdx;
                    return (
                      <div key={sIdx} className="bg-slate-900/80 border border-slate-850 rounded-lg p-2.5 space-y-2">
                        <div 
                          className="flex items-center justify-between gap-2 cursor-pointer select-none"
                          onClick={() => setExpandedRepairStep(isExpanded ? null : sIdx)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-slate-950 text-slate-400 flex items-center justify-center text-[9px] font-bold">
                              {step.loop}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300">
                              Vòng lặp #{step.loop} {step.fixedFiles.length > 0 ? `(Sửa ${step.fixedFiles.join(', ')})` : '(Không sửa file nào)'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold hover:text-slate-300">
                            {isExpanded ? 'Thu gọn ▲' : 'Chi tiết ▼'}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-850">
                            <div className="text-[9px] font-bold text-rose-400">Errors encountered:</div>
                            <pre className="text-[9px] text-slate-400 font-mono leading-normal whitespace-pre-wrap max-h-32 overflow-y-auto bg-slate-950 p-2 rounded border border-slate-900 select-text">
                              {step.errors || 'No validation errors recorded.'}
                            </pre>
                            {step.fixedFiles.length > 0 && (
                              <div className="text-[9px] text-slate-500 font-sans">
                                <span className="font-bold text-slate-400">Fixed Files: </span>
                                {step.fixedFiles.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

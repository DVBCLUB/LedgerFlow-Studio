import { useMemo, useState } from 'react';

type ToolPolicy = {
  id: string;
  name: string;
  zone: 'AI' | 'Code' | 'Data' | 'Browser' | 'Integration' | 'System';
  mode: 'Simulate' | 'Draft Only' | 'Approval Required' | 'Blocked';
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
  allowed: string[];
  blocked: string[];
};

type ScanIssue = {
  severity: 'WARN' | 'BLOCK';
  label: string;
  detail: string;
};

const policySeed: ToolPolicy[] = [
  {
    id: 'github-draft-pr',
    name: 'GitHub Draft PR',
    zone: 'Code',
    mode: 'Approval Required',
    risk: 'HIGH',
    allowed: ['Tạo nhánh ai/*', 'Commit file đã preview', 'Mở Draft PR', 'Đọc PR/CI status'],
    blocked: ['Push thẳng main', 'Merge tự động', 'Sửa file cấu hình nhạy cảm']
  },
  {
    id: 'vscode-handoff',
    name: 'VS Code / Cursor Handoff',
    zone: 'Code',
    mode: 'Draft Only',
    risk: 'MEDIUM',
    allowed: ['Tạo prompt sửa code', 'Tạo checklist test', 'Gợi ý file cần sửa'],
    blocked: ['Chạy lệnh máy thật không duyệt', 'Tự cài extension', 'Tự mở file ngoài workspace']
  },
  {
    id: 'knowledge-library',
    name: 'Knowledge Library',
    zone: 'Data',
    mode: 'Draft Only',
    risk: 'MEDIUM',
    allowed: ['Lưu tri thức nội bộ', 'Tìm kiếm context', 'Xuất JSON'],
    blocked: ['Lưu khóa/API thật', 'Lưu mật khẩu', 'Lưu dữ liệu cá nhân nhạy cảm không che']
  },
  {
    id: 'terminal',
    name: 'Terminal / Shell',
    zone: 'System',
    mode: 'Blocked',
    risk: 'BLOCKED',
    allowed: ['Chỉ mô phỏng lệnh trong sandbox text'],
    blocked: ['Chạy shell thật', 'Xóa file', 'Cài package tự động', 'Đọc biến môi trường']
  },
  {
    id: 'browser-agent',
    name: 'Browser / Computer Use',
    zone: 'Browser',
    mode: 'Simulate',
    risk: 'HIGH',
    allowed: ['Mô phỏng thao tác', 'Tạo checklist thao tác tay', 'Phân tích screenshot do founder gửi'],
    blocked: ['Điều khiển trình duyệt thật', 'Đăng nhập tài khoản', 'Tự gửi form/thanh toán']
  },
  {
    id: 'ai-gateway',
    name: 'AI Gateway',
    zone: 'AI',
    mode: 'Approval Required',
    risk: 'MEDIUM',
    allowed: ['Gọi model qua backend', 'Mask key', 'Ghi usage log đã che'],
    blocked: ['Gọi provider trực tiếp từ frontend', 'Log khóa đầy đủ', 'Đưa secret vào prompt']
  }
];

const suspiciousPathParts = [
  '.env',
  '.git/',
  'node_modules/',
  'dist/',
  'release/',
  'ai_keys.vault',
  'ledgerflow_secret',
  'id_rsa',
  'id_ed25519'
];

const suspiciousContentParts = [
  'api_key',
  'apikey',
  'access_token',
  'refresh_token',
  'private_key',
  'client_secret',
  'github_pat_',
  'ghp_',
  'sk-',
  '-----BEGIN'
];

function riskClass(risk: ToolPolicy['risk']) {
  if (risk === 'LOW') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (risk === 'MEDIUM') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  if (risk === 'HIGH') return 'border-orange-400/35 bg-orange-400/10 text-orange-200';
  return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
}

function scanCandidate(path: string, content: string): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const normalizedPath = path.toLowerCase();
  const normalizedContent = content.toLowerCase();

  for (const part of suspiciousPathParts) {
    if (normalizedPath.includes(part.toLowerCase())) {
      issues.push({ severity: 'BLOCK', label: 'Đường dẫn bị chặn', detail: `File path chứa mẫu rủi ro: ${part}` });
    }
  }

  for (const part of suspiciousContentParts) {
    if (normalizedContent.includes(part.toLowerCase())) {
      issues.push({ severity: 'BLOCK', label: 'Nghi có secret/key', detail: `Nội dung chứa dấu hiệu nhạy cảm: ${part}` });
    }
  }

  if (content.length > 250_000) {
    issues.push({ severity: 'BLOCK', label: 'File quá lớn', detail: 'Review Desk giới hạn file nhỏ để founder review được.' });
  }

  if (!path.trim()) {
    issues.push({ severity: 'WARN', label: 'Thiếu file path', detail: 'Cần nhập đường dẫn file trước khi đưa sang Review Desk.' });
  }

  if (!content.trim()) {
    issues.push({ severity: 'WARN', label: 'Thiếu nội dung', detail: 'Cần có nội dung file để quét.' });
  }

  return issues;
}

export default function ToolPolicyRegistry() {
  const [path, setPath] = useState('docs/AI_SAFE_CHANGE.md');
  const [content, setContent] = useState('# Safe change\n\nDescribe the reviewed change here.\n');
  const [filter, setFilter] = useState<'All' | ToolPolicy['mode']>('All');

  const policies = useMemo(() => filter === 'All' ? policySeed : policySeed.filter((item) => item.mode === filter), [filter]);
  const issues = useMemo(() => scanCandidate(path, content), [path, content]);
  const blocked = issues.some((issue) => issue.severity === 'BLOCK');

  const copyToReviewDesk = () => {
    if (blocked) return;
    localStorage.setItem('ledgerflow_review_desk_prefill_v1', JSON.stringify({
      title: 'AI safe change: policy-reviewed update',
      branchName: 'ai/policy-reviewed-update',
      summary: 'Prepared after Tool Policy Registry and Secret Scanner review.',
      filePath: path,
      fileContent: content,
      sourceCardId: 'tool-policy-registry'
    }));
    window.location.hash = '#/review_desk';
  };

  return (
    <section className="rounded-3xl border border-blue-400/35 bg-blue-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">OpenClaw-style policy layer</p>
          <h3 className="mt-1 text-xl font-black text-white">Tool Policy Registry & Secret Scanner</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Khai báo quyền tool, chặn hành động nguy hiểm và quét nội dung trước khi đưa sang Review Desk.</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${blocked ? 'border-rose-400/40 bg-rose-400/10 text-rose-200' : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'}`}>{blocked ? 'Blocked' : 'Safe to draft'}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {(['All', 'Simulate', 'Draft Only', 'Approval Required', 'Blocked'] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1 text-[11px] font-black ${filter === item ? 'border-blue-300 bg-blue-400/10 text-blue-100' : 'border-slate-700 text-slate-300 hover:border-blue-300'}`}>{item}</button>)}
          </div>
          <div className="space-y-3">
            {policies.map((policy) => <div key={policy.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-white">{policy.name}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">{policy.zone} · {policy.mode}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskClass(policy.risk)}`}>{policy.risk}</span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Allowed</p>
                  <ul className="mt-2 space-y-1">{policy.allowed.map((item) => <li key={item} className="text-xs font-semibold text-slate-300">✓ {item}</li>)}</ul>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-rose-300">Blocked</p>
                  <ul className="mt-2 space-y-1">{policy.blocked.map((item) => <li key={item} className="text-xs font-semibold text-slate-300">× {item}</li>)}</ul>
                </div>
              </div>
            </div>)}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Quét file trước Review Desk</p>
          <div className="mt-3 grid gap-3">
            <label className="text-xs font-black text-slate-400">File path<input value={path} onChange={(event) => setPath(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white" /></label>
            <label className="text-xs font-black text-slate-400">File content<textarea value={content} onChange={(event) => setContent(event.target.value)} className="mt-1 min-h-[220px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-white" /></label>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black text-white">Kết quả quét</p>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${blocked ? 'border-rose-400/40 text-rose-200' : 'border-emerald-400/40 text-emerald-200'}`}>{issues.length} issue</span>
            </div>
            <div className="mt-3 space-y-2">
              {issues.map((issue, index) => <div key={`${issue.label}-${index}`} className={`rounded-2xl border p-3 ${issue.severity === 'BLOCK' ? 'border-rose-400/35 bg-rose-400/10' : 'border-amber-400/35 bg-amber-400/10'}`}>
                <p className="text-xs font-black text-white">{issue.severity} · {issue.label}</p>
                <p className="mt-1 text-xs font-semibold text-slate-300">{issue.detail}</p>
              </div>)}
              {issues.length === 0 && <p className="rounded-2xl border border-emerald-400/35 bg-emerald-400/10 p-3 text-xs font-bold text-emerald-200">Không thấy dấu hiệu nhạy cảm trong nội dung này.</p>}
            </div>
          </div>

          <button disabled={blocked} onClick={copyToReviewDesk} className="mt-4 w-full rounded-2xl bg-blue-300 px-4 py-3 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">Đưa sang Review Desk</button>
        </div>
      </div>
    </section>
  );
}

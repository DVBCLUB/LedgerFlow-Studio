import { useEffect, useMemo, useState } from 'react';

type ControlStatus = 'Enabled' | 'Approval Required' | 'Manual Only' | 'Blocked';
type ControlRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type SecurityControl = {
  id: string;
  name: string;
  area: 'Secrets' | 'Network' | 'GitHub' | 'Runtime' | 'Browser' | 'Storage' | 'Release';
  status: ControlStatus;
  risk: ControlRisk;
  purpose: string;
  allowed: string[];
  blocked: string[];
};

type SecurityEvent = {
  id: string;
  at: string;
  action: string;
  detail: string;
  level: 'info' | 'warning' | 'critical';
};

const defaultControls: SecurityControl[] = [
  {
    id: 'secrets-no-upload',
    name: 'No secret upload / commit',
    area: 'Secrets',
    status: 'Blocked',
    risk: 'CRITICAL',
    purpose: 'Không cho AI đưa API key, token, .env, private key hoặc vault lên GitHub hay log công khai.',
    allowed: ['scan content', 'mask secret-like text', 'store key only in backend vault'],
    blocked: ['commit .env', 'commit private key', 'show token in UI/log', 'send vault backup to internet']
  },
  {
    id: 'github-draft-pr-only',
    name: 'GitHub Draft PR only',
    area: 'GitHub',
    status: 'Approval Required',
    risk: 'HIGH',
    purpose: 'AI chỉ được tạo branch ai/* và Draft PR sau approval phrase, không đẩy thẳng main.',
    allowed: ['create ai/* branch after approval', 'create draft PR', 'read CI summary'],
    blocked: ['direct main push', 'force push', 'auto merge', 'delete branch without review']
  },
  {
    id: 'runtime-shell',
    name: 'Terminal / shell runtime',
    area: 'Runtime',
    status: 'Manual Only',
    risk: 'CRITICAL',
    purpose: 'AI chỉ được đề xuất lệnh, người dùng tự xem và tự chạy nếu an toàn.',
    allowed: ['write command plan', 'explain command risk'],
    blocked: ['run shell automatically', 'install unknown packages automatically', 'delete files automatically']
  },
  {
    id: 'browser-computer-use',
    name: 'Browser / computer use',
    area: 'Browser',
    status: 'Manual Only',
    risk: 'CRITICAL',
    purpose: 'AI lập checklist thao tác, không tự bấm trình duyệt, không tự đăng nhập, không tự thanh toán/deploy.',
    allowed: ['manual checklist', 'evidence note', 'approval request'],
    blocked: ['auto click', 'auto login', 'auto payment', 'auto deploy']
  },
  {
    id: 'external-network',
    name: 'External network egress',
    area: 'Network',
    status: 'Approval Required',
    risk: 'HIGH',
    purpose: 'Mọi luồng gửi dữ liệu ra ngoài phải có connector/policy rõ ràng và audit.',
    allowed: ['GitHub API through backend', 'AI provider through gateway', 'documented connector call'],
    blocked: ['unknown webhook', 'send raw database dump', 'send secret-bearing logs']
  },
  {
    id: 'local-storage-boundary',
    name: 'Browser local data boundary',
    area: 'Storage',
    status: 'Enabled',
    risk: 'MEDIUM',
    purpose: 'LocalStorage chỉ giữ workflow metadata, không giữ token thật hoặc dữ liệu nhạy cảm dài hạn.',
    allowed: ['task metadata', 'audit metadata', 'non-secret checklist'],
    blocked: ['API key in localStorage', 'password in localStorage', 'customer confidential dump']
  },
  {
    id: 'release-manual-gate',
    name: 'Release / deploy manual gate',
    area: 'Release',
    status: 'Manual Only',
    risk: 'HIGH',
    purpose: 'Không cho AI tự release/deploy bản mới nếu chưa có founder review và rollback plan.',
    allowed: ['release checklist', 'artifact tracking', 'rollback plan'],
    blocked: ['auto deploy production', 'auto publish artifact without QA', 'auto rollback without approval']
  }
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function exportJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function statusClass(status: ControlStatus) {
  if (status === 'Blocked') return 'border-rose-400/40 bg-rose-400/10 text-rose-200';
  if (status === 'Manual Only') return 'border-amber-400/40 bg-amber-400/10 text-amber-200';
  if (status === 'Approval Required') return 'border-violet-400/40 bg-violet-400/10 text-violet-200';
  return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200';
}

function riskClass(risk: ControlRisk) {
  if (risk === 'CRITICAL') return 'text-rose-200 border-rose-400/40 bg-rose-400/10';
  if (risk === 'HIGH') return 'text-amber-200 border-amber-400/40 bg-amber-400/10';
  if (risk === 'MEDIUM') return 'text-cyan-200 border-cyan-400/40 bg-cyan-400/10';
  return 'text-emerald-200 border-emerald-400/40 bg-emerald-400/10';
}

export default function SecurityControlCenter() {
  const [controls, setControls] = useState<SecurityControl[]>(() => readLocal('ledgerflow_security_controls_v1', defaultControls));
  const [events, setEvents] = useState<SecurityEvent[]>(() => readLocal('ledgerflow_security_events_v1', [{ id: 'sec-boot', at: 'Mặc định', action: 'SECURITY_BASELINE', detail: 'Khởi tạo baseline: secret blocked, shell/browser manual-only, GitHub draft PR only.', level: 'info' }]));
  const [query, setQuery] = useState('');
  const [area, setArea] = useState<'All' | SecurityControl['area']>('All');
  const [selectedId, setSelectedId] = useState(() => controls[0]?.id ?? defaultControls[0].id);

  useEffect(() => {
    localStorage.setItem('ledgerflow_security_controls_v1', JSON.stringify(controls));
    window.dispatchEvent(new CustomEvent('ledgerflow-security-controls-updated'));
  }, [controls]);

  useEffect(() => {
    localStorage.setItem('ledgerflow_security_events_v1', JSON.stringify(events));
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return controls.filter((control) => {
      const areaOk = area === 'All' || control.area === area;
      const text = `${control.name} ${control.area} ${control.status} ${control.risk} ${control.purpose} ${control.allowed.join(' ')} ${control.blocked.join(' ')}`.toLowerCase();
      return areaOk && (!q || text.includes(q));
    });
  }, [controls, query, area]);

  const selected = controls.find((control) => control.id === selectedId) ?? controls[0];
  const criticalOpen = controls.filter((control) => control.risk === 'CRITICAL' && control.status !== 'Blocked' && control.status !== 'Manual Only');
  const internetWriteAllowed = controls.filter((control) => ['Network', 'GitHub', 'Release'].includes(control.area) && control.status === 'Enabled' && control.risk !== 'LOW');

  const pushEvent = (action: string, detail: string, level: SecurityEvent['level'] = 'info') => {
    setEvents((current) => [{ id: `sec-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action, detail, level }, ...current].slice(0, 120));
  };

  const updateStatus = (id: string, status: ControlStatus) => {
    const control = controls.find((item) => item.id === id);
    setControls((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    pushEvent('CONTROL_STATUS_CHANGED', `${control?.name ?? id} -> ${status}`, status === 'Enabled' && control?.risk === 'CRITICAL' ? 'critical' : 'warning');
  };

  const restoreBaseline = () => {
    setControls(defaultControls);
    pushEvent('SECURITY_BASELINE_RESTORED', 'Khôi phục baseline an toàn mặc định.', 'warning');
  };

  return (
    <section className="rounded-3xl border border-rose-400/35 bg-rose-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-200">Security control center</p>
          <h3 className="mt-1 text-xl font-black text-white">Chống lộ key, lộ dữ liệu và thao tác ngoài kiểm soát</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Runtime rủi ro chỉ được mở theo policy. Mặc định: secret bị chặn, shell/browser manual-only, GitHub chỉ Draft PR sau approval.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={restoreBaseline} className="rounded-2xl border border-rose-400/40 px-4 py-2 text-xs font-black text-rose-200 hover:bg-rose-400/10">Khôi phục baseline</button>
          <button onClick={() => exportJson('ledgerflow-security-controls.json', { controls, events })} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-rose-300">Xuất security log</button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-[10px] font-black uppercase text-slate-500">Critical controls unsafe</p>
          <p className={`mt-1 text-2xl font-black ${criticalOpen.length ? 'text-rose-200' : 'text-emerald-200'}`}>{criticalOpen.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-[10px] font-black uppercase text-slate-500">Internet write enabled</p>
          <p className={`mt-1 text-2xl font-black ${internetWriteAllowed.length ? 'text-amber-200' : 'text-emerald-200'}`}>{internetWriteAllowed.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-[10px] font-black uppercase text-slate-500">Security events</p>
          <p className="mt-1 text-2xl font-black text-white">{events.length}</p>
        </div>
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_180px]">
        <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tìm control, risk, tool, blocked action..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={area} onChange={(event) => setArea(event.target.value as typeof area)}>
          {(['All', 'Secrets', 'Network', 'GitHub', 'Runtime', 'Browser', 'Storage', 'Release'] as const).map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-2 rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          {filtered.map((control) => <button key={control.id} onClick={() => setSelectedId(control.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === control.id ? 'border-rose-300 bg-rose-400/10' : 'border-slate-800 bg-slate-950/60 hover:border-rose-400/40'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-white">{control.name}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(control.status)}`}>{control.status}</span>
            </div>
            <p className="mt-1 text-[11px] font-bold text-slate-500">{control.area} · {control.risk}</p>
          </button>)}
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected control</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.name}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.area}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${riskClass(selected.risk)}`}>{selected.risk}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(selected.status)}`}>{selected.status}</span>
            </div>
          </div>
          <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-slate-300">{selected.purpose}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-200">Allowed</p>
              <ul className="mt-2 space-y-1 text-xs font-semibold leading-5 text-slate-300">
                {selected.allowed.map((item) => <li key={item}>✓ {item}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-200">Blocked</p>
              <ul className="mt-2 space-y-1 text-xs font-semibold leading-5 text-slate-300">
                {selected.blocked.map((item) => <li key={item}>× {item}</li>)}
              </ul>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(['Enabled', 'Approval Required', 'Manual Only', 'Blocked'] as ControlStatus[]).map((status) => <button key={status} onClick={() => updateStatus(selected.id, status)} className={`rounded-full border px-3 py-2 text-[11px] font-black ${selected.status === status ? 'border-rose-300 bg-rose-300 text-slate-950' : 'border-slate-700 text-slate-300 hover:border-rose-300'}`}>{status}</button>)}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Recent security events</p>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
              {events.slice(0, 8).map((event) => <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <p className={`text-[10px] font-black ${event.level === 'critical' ? 'text-rose-200' : event.level === 'warning' ? 'text-amber-200' : 'text-slate-300'}`}>{event.action}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{event.detail}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-600">{event.at}</p>
              </div>)}
            </div>
          </div>
        </div>}
      </div>
    </section>
  );
}

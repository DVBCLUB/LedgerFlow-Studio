import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, FileDiff, GitPullRequest, Play, RefreshCw, ShieldAlert, TerminalSquare, Wrench } from 'lucide-react';
import {
  approveSweAgentMissionPush,
  createSweAgentMission,
  fetchSweAgentMission,
  fetchSweAgentMissions,
  runSweDockerDoctor,
  type DockerDoctorResult,
  type SweMissionState,
} from '../../utils/assistantApi';
import DiffViewer from './ai-assistant/DiffViewer';

const statusLabels: Record<string, string> = {
  running_ai_query: 'Dang hoi Web AI',
  testing: 'Dang test Docker',
  repairing: 'Dang tu sua',
  awaiting_human_approval: 'Cho duyet push',
  pushing_to_github: 'Dang push GitHub',
  completed: 'Hoan tat',
  failed: 'That bai',
  cancelled: 'Da huy',
};

const webPlatforms = ['chatgpt', 'claude', 'gemini', 'deepseek', 'grok', 'copilot'];

const missionPresets = [
  {
    id: 'fix-build',
    label: 'Sua loi build',
    goal: 'Sua loi build/typecheck trong cac file duoc whitelist. Giu thay doi nho, khong doi kien truc, tra ve full file content theo code_block.',
    testCommand: 'npm run build',
    targetFiles: 'src/app/WorkspaceRenderer.tsx',
  },
  {
    id: 'fix-ui-component',
    label: 'Sua 1 component UI',
    goal: 'Sua loi UI trong component duoc whitelist. Giu style hien co, dam bao responsive, khong tao module moi neu khong can.',
    testCommand: 'npm run build',
    targetFiles: 'src/modules/ai-nhan-su/AutonomousSweAgentLoopPanel.tsx',
  },
  {
    id: 'write-test',
    label: 'Viet test cho file',
    goal: 'Viet hoac cap nhat test cho file duoc whitelist. Chi sua file test va file lien quan neu that su can.',
    testCommand: 'npm test',
    targetFiles: 'server/services/autonomousSweAgentLoop.test.ts',
  },
  {
    id: 'small-refactor',
    label: 'Refactor nho',
    goal: 'Refactor nho trong file duoc whitelist de code de doc hon, khong doi hanh vi, khong mo rong pham vi.',
    testCommand: 'npm test',
    targetFiles: 'server/services/autonomousSweAgentLoop.ts',
  },
  {
    id: 'draft-pr',
    label: 'Tao PR nhap',
    goal: 'Hoan thien thay doi nho trong file duoc whitelist, chay test va dung o buoc founder duyet truoc khi tao draft PR.',
    testCommand: 'npm run build',
    targetFiles: 'docs/AUTONOMOUS_SWE_AGENT_LOOP.md',
  },
];

function splitTargetFiles(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function statusClass(status: string) {
  if (status === 'completed') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100';
  if (status === 'failed') return 'border-rose-400/30 bg-rose-400/10 text-rose-100';
  if (status === 'awaiting_human_approval') return 'border-amber-400/30 bg-amber-400/10 text-amber-100';
  return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100';
}

export default function AutonomousSweAgentLoopPanel() {
  const [goalPrompt, setGoalPrompt] = useState('Sua loi unit test trong file duoc whitelist, giu thay doi nho va tra ve full file content.');
  const [platform, setPlatform] = useState('chatgpt');
  const [profileId, setProfileId] = useState('');
  const [testCommand, setTestCommand] = useState('npm test');
  const [targetFilesText, setTargetFilesText] = useState('server/services/example.ts');
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [repoBaseBranch, setRepoBaseBranch] = useState('');
  const [requireApproval, setRequireApproval] = useState(true);
  const [missionIdInput, setMissionIdInput] = useState('');
  const [mission, setMission] = useState<SweMissionState | null>(null);
  const [missionHistory, setMissionHistory] = useState<SweMissionState[]>([]);
  const [dockerDoctor, setDockerDoctor] = useState<DockerDoctorResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [doctorBusy, setDoctorBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const targetFiles = useMemo(() => splitTargetFiles(targetFilesText), [targetFilesText]);
  const canCreate = goalPrompt.trim() && platform.trim() && testCommand.trim() && targetFiles.length > 0;

  const applyPreset = (presetId: string) => {
    const preset = missionPresets.find((item) => item.id === presetId);
    if (!preset) return;
    setGoalPrompt(preset.goal);
    setTestCommand(preset.testCommand);
    setTargetFilesText(preset.targetFiles);
    setRequireApproval(true);
    setMessage(`Da nap preset: ${preset.label}. Hay doi file whitelist cho dung muc tieu cua ban.`);
    setError('');
  };

  const loadHistory = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const missions = await fetchSweAgentMissions(20);
      setMissionHistory(missions);
      setMessage(`Da tai ${missions.length} mission gan nhat.`);
    } catch (err: any) {
      setError(err?.message || 'Khong tai duoc lich su mission.');
    } finally {
      setBusy(false);
    }
  };

  const runDoctor = async () => {
    setDoctorBusy(true);
    setError('');
    setMessage('');
    try {
      const doctor = await runSweDockerDoctor();
      setDockerDoctor(doctor);
      setMessage(doctor.summary);
    } catch (err: any) {
      setError(err?.message || 'Khong chay duoc Docker Doctor.');
    } finally {
      setDoctorBusy(false);
    }
  };

  const runMission = async () => {
    if (!canCreate) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const nextMission = await createSweAgentMission({
        goalPrompt: goalPrompt.trim(),
        platform,
        profileId: profileId.trim() || undefined,
        testCommand: testCommand.trim(),
        targetFiles,
        maxAttempts,
        repoBaseBranch: repoBaseBranch.trim() || undefined,
        requireHumanApprovalBeforePush: requireApproval,
      });
      setMission(nextMission);
      setMissionIdInput(nextMission.id);
      setMissionHistory((items) => [nextMission, ...items.filter((item) => item.id !== nextMission.id)].slice(0, 20));
      setMessage(`Mission ${nextMission.id} da chay den trang thai ${statusLabels[nextMission.status] || nextMission.status}.`);
    } catch (err: any) {
      setError(err?.message || 'Khong tao duoc mission.');
    } finally {
      setBusy(false);
    }
  };

  const refreshMission = async () => {
    const id = missionIdInput.trim() || mission?.id;
    if (!id) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const nextMission = await fetchSweAgentMission(id);
      setMission(nextMission);
      setMissionIdInput(nextMission.id);
      setMissionHistory((items) => [nextMission, ...items.filter((item) => item.id !== nextMission.id)].slice(0, 20));
      setMessage(`Da cap nhat mission ${nextMission.id}.`);
    } catch (err: any) {
      setError(err?.message || 'Khong doc duoc mission.');
    } finally {
      setBusy(false);
    }
  };

  const approvePush = async () => {
    if (!mission?.id) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const nextMission = await approveSweAgentMissionPush(mission.id);
      setMission(nextMission);
      setMissionHistory((items) => [nextMission, ...items.filter((item) => item.id !== nextMission.id)].slice(0, 20));
      setMessage(nextMission.githubResult?.prUrl ? `Da tao draft PR: ${nextMission.githubResult.prUrl}` : `Da approve push mission ${nextMission.id}.`);
    } catch (err: any) {
      setError(err?.message || 'Khong approve push duoc.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-cyan-500/25 bg-slate-950/70 p-5 text-left shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">Autonomous SWE Agent Loop</p>
          <h2 className="mt-2 text-xl font-black text-text-primary">Web AI sua code, Docker test, founder duyet roi moi day GitHub</h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-text-secondary">
            Mission chi duoc sua file trong whitelist. Sandbox bat buoc Docker; neu Docker khong san sang, mission dung that bai thay vi chay tren may host.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs font-bold leading-5 text-amber-100">
          Can Docker Desktop, Web AI profile da login va GitHub token backend neu muon push draft PR.
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border border-border-primary bg-bg-primary/25 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-text-secondary">Preset mission</p>
              <p className="mt-1 text-[11px] font-semibold text-text-tertiary">Chon mau roi sua lai file whitelist cho dung viec can lam.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {missionPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className="rounded-full border border-border-secondary bg-slate-950 px-3 py-1.5 text-[11px] font-black text-text-secondary hover:border-cyan-400/50 hover:text-cyan-100"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-primary bg-bg-primary/25 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-text-secondary">Docker Doctor</p>
              <p className="mt-1 text-[11px] font-semibold text-text-tertiary">Kiem tra Docker truoc khi chay mission that.</p>
            </div>
            <button
              type="button"
              disabled={doctorBusy}
              onClick={() => void runDoctor()}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Wrench className="h-4 w-4" /> {doctorBusy ? 'Dang kiem tra...' : 'Kiem tra'}
            </button>
          </div>
          {dockerDoctor && (
            <div className="mt-3 space-y-2">
              <p className={dockerDoctor.ok ? 'text-xs font-black text-emerald-200' : 'text-xs font-black text-rose-200'}>
                {dockerDoctor.summary}
              </p>
              {dockerDoctor.checks.map((check) => (
                <div key={check.id} className="rounded-xl border border-border-primary bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black text-text-primary">{check.label}</p>
                    <span className={check.ok ? 'text-[10px] font-black text-emerald-200' : 'text-[10px] font-black text-rose-200'}>
                      {check.ok ? 'OK' : 'FAIL'} · {check.durationMs}ms
                    </span>
                  </div>
                  {(check.error || check.outputPreview) && (
                    <p className="mt-1 text-[10px] font-semibold leading-4 text-text-tertiary">{check.error || check.outputPreview}</p>
                  )}
                  {!check.ok && check.hint && <p className="mt-1 text-[10px] font-bold leading-4 text-amber-100">{check.hint}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase tracking-wide text-text-secondary">Muc tieu</label>
          <textarea
            value={goalPrompt}
            onChange={(event) => setGoalPrompt(event.target.value)}
            className="min-h-28 w-full resize-y rounded-2xl border border-border-primary bg-slate-950 p-4 text-sm font-semibold leading-6 text-text-primary outline-none focus:border-cyan-400"
          />

          <label className="block text-xs font-black uppercase tracking-wide text-text-secondary">Whitelist file duoc sua</label>
          <textarea
            value={targetFilesText}
            onChange={(event) => setTargetFilesText(event.target.value)}
            className="min-h-24 w-full resize-y rounded-2xl border border-border-primary bg-slate-950 p-4 text-sm font-semibold leading-6 text-text-primary outline-none focus:border-cyan-400"
            placeholder="src/file.tsx, server/services/file.ts"
          />
          <p className="text-[11px] font-semibold text-text-tertiary">{targetFiles.length} file trong whitelist.</p>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-text-secondary">Web AI</span>
              <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="mt-2 w-full rounded-2xl border border-border-primary bg-slate-950 px-3 py-2 text-sm font-bold text-text-primary outline-none focus:border-cyan-400">
                {webPlatforms.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-text-secondary">Max attempts</span>
              <input type="number" min={1} max={8} value={maxAttempts} onChange={(event) => setMaxAttempts(Number(event.target.value) || 3)} className="mt-2 w-full rounded-2xl border border-border-primary bg-slate-950 px-3 py-2 text-sm font-bold text-text-primary outline-none focus:border-cyan-400" />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-text-secondary">Profile ID tuy chon</span>
            <input value={profileId} onChange={(event) => setProfileId(event.target.value)} className="mt-2 w-full rounded-2xl border border-border-primary bg-slate-950 px-3 py-2 text-sm font-bold text-text-primary outline-none focus:border-cyan-400" placeholder="De trong neu dung profile mac dinh" />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-text-secondary">Lenh test</span>
            <input value={testCommand} onChange={(event) => setTestCommand(event.target.value)} className="mt-2 w-full rounded-2xl border border-border-primary bg-slate-950 px-3 py-2 text-sm font-bold text-text-primary outline-none focus:border-cyan-400" />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-text-secondary">Base branch tuy chon</span>
            <input value={repoBaseBranch} onChange={(event) => setRepoBaseBranch(event.target.value)} className="mt-2 w-full rounded-2xl border border-border-primary bg-slate-950 px-3 py-2 text-sm font-bold text-text-primary outline-none focus:border-cyan-400" placeholder="main" />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-primary/30 p-3 text-xs font-bold text-text-secondary">
            <input type="checkbox" checked={requireApproval} onChange={(event) => setRequireApproval(event.target.checked)} className="h-4 w-4 accent-cyan-400" />
            Dung o buoc founder duyet truoc khi push GitHub
          </label>

          <button
            type="button"
            disabled={busy || !canCreate}
            onClick={() => void runMission()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/40 bg-cyan-400/15 px-4 py-3 text-xs font-black text-cyan-100 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4" /> {busy ? 'Dang xu ly...' : 'Tao va chay mission'}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border-primary bg-bg-primary/30 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label className="block flex-1">
            <span className="text-xs font-black uppercase tracking-wide text-text-secondary">Mission ID de poll lai</span>
            <input value={missionIdInput} onChange={(event) => setMissionIdInput(event.target.value)} className="mt-2 w-full rounded-2xl border border-border-primary bg-slate-950 px-3 py-2 text-sm font-bold text-text-primary outline-none focus:border-cyan-400" />
          </label>
          <button type="button" disabled={busy || !(missionIdInput.trim() || mission?.id)} onClick={() => void refreshMission()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border-secondary bg-slate-950 px-4 py-2 text-xs font-black text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw className="h-4 w-4" /> Cap nhat
          </button>
          <button type="button" disabled={busy || mission?.status !== 'awaiting_human_approval'} onClick={() => void approvePush()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50">
            <GitPullRequest className="h-4 w-4" /> Duyet push
          </button>
        </div>

        {mission && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${statusClass(mission.status)}`}>
                {statusLabels[mission.status] || mission.status}
              </span>
              <span className="rounded-full border border-border-secondary bg-slate-950 px-3 py-1 text-[10px] font-black text-text-secondary">
                {mission.attempts.length}/{mission.config.maxAttempts} attempt
              </span>
              {mission.pendingChangeRequest?.branchName && (
                <span className="rounded-full border border-border-secondary bg-slate-950 px-3 py-1 text-[10px] font-black text-text-secondary">
                  {mission.pendingChangeRequest.branchName}
                </span>
              )}
            </div>

            {mission.finalError && (
              <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-3 text-xs font-bold leading-5 text-rose-100">
                {mission.finalError}
              </div>
            )}

            {mission.githubResult?.prUrl && (
              <a href={mission.githubResult.prUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-400/20">
                <CheckCircle2 className="h-4 w-4" /> Mo draft PR
              </a>
            )}

            {mission.pendingChangeRequest?.files?.length ? (
              <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-cyan-100">
                      <FileDiff className="mr-2 inline h-4 w-4" /> Diff truoc khi duyet
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-text-tertiary">
                      Xem thay doi da pass test trong Docker sandbox truoc khi bam Duyet push.
                    </p>
                  </div>
                  <span className="rounded-full border border-border-secondary bg-bg-primary/60 px-3 py-1 text-[10px] font-black text-text-secondary">
                    {mission.pendingChangeRequest.files.length} file
                  </span>
                </div>
                <div className="space-y-3">
                  {mission.pendingChangeRequest.files.map((file) => (
                    <details key={file.path} open className="rounded-xl border border-border-primary bg-bg-primary/40">
                      <summary className="cursor-pointer px-3 py-2 text-xs font-black text-text-primary">{file.path}</summary>
                      <div className="max-h-96 overflow-auto border-t border-border-primary">
                        <DiffViewer diff={file.diff || `No textual diff for ${file.path}`} />
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 xl:grid-cols-2">
              {mission.attempts.map((attempt) => (
                <div key={attempt.attempt} className="rounded-2xl border border-border-primary bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-text-primary">Attempt {attempt.attempt}</p>
                    <span className={attempt.testResult.ok ? 'text-xs font-black text-emerald-200' : 'text-xs font-black text-rose-200'}>
                      {attempt.testResult.ok ? 'PASS' : `FAIL ${attempt.testResult.exitCode}`}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-text-tertiary">Code blocks: {attempt.codeBlocksExtracted}</p>
                  {attempt.testResult.stderrPreview && (
                    <pre className="mt-3 max-h-40 overflow-auto rounded-xl border border-border-primary bg-bg-primary/70 p-3 text-[11px] leading-5 text-text-secondary">
                      {attempt.testResult.stderrPreview}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-border-primary bg-bg-primary/30 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-text-secondary">
              <Clock className="mr-2 inline h-4 w-4" /> Lich su mission
            </p>
            <p className="mt-1 text-[11px] font-semibold text-text-tertiary">Doc tu runtime local, giu lai sau khi app restart.</p>
          </div>
          <button type="button" disabled={busy} onClick={() => void loadHistory()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border-secondary bg-slate-950 px-4 py-2 text-xs font-black text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw className="h-4 w-4" /> Tai lich su
          </button>
        </div>
        {missionHistory.length > 0 && (
          <div className="mt-3 grid gap-2 xl:grid-cols-2">
            {missionHistory.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMission(item);
                  setMissionIdInput(item.id);
                }}
                className="rounded-xl border border-border-primary bg-slate-950/70 p-3 text-left hover:border-cyan-400/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-black text-text-primary">{item.id}</p>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${statusClass(item.status)}`}>
                    {statusLabels[item.status] || item.status}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-text-tertiary">{item.config.goalPrompt}</p>
                <p className="mt-2 text-[10px] font-bold text-text-tertiary">{new Date(item.updatedAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border-primary bg-bg-primary/25 p-3 text-xs font-semibold leading-5 text-text-secondary">
          <ShieldAlert className="mb-2 h-4 w-4 text-amber-200" /> Khong gui token GitHub vao prompt Web AI.
        </div>
        <div className="rounded-2xl border border-border-primary bg-bg-primary/25 p-3 text-xs font-semibold leading-5 text-text-secondary">
          <TerminalSquare className="mb-2 h-4 w-4 text-cyan-200" /> Lenh test chay trong Docker sandbox copy.
        </div>
        <div className="rounded-2xl border border-border-primary bg-bg-primary/25 p-3 text-xs font-semibold leading-5 text-text-secondary">
          <GitPullRequest className="mb-2 h-4 w-4 text-emerald-200" /> Push tao branch ai/* va draft PR, khong day main.
        </div>
      </div>

      {message && <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-100">{message}</p>}
      {error && <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-200">{error}</p>}
    </section>
  );
}

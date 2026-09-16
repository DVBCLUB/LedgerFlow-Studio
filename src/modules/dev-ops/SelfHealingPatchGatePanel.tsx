import { useCallback, useEffect, useState } from 'react';
import { fetchGlaciaRsi, createGlaciaRsi, reviewGlaciaRsi, evaluateGlaciaRsi, pauseGlaciaRsi,
  type GlaciaRsiCycle, type RsiSnapshot, type RsiScore } from '../../utils/glaciaRsiApi';

const labels: Record<GlaciaRsiCycle['status'], string> = {
  generating: 'Đang tạo đề xuất', proposal_pending_founder: 'Chờ duyệt', approved: 'Đã duyệt · chờ đánh giá',
  rejected: 'Đã từ chối', improved: 'Cải thiện theo báo cáo', no_gain: 'Chưa cải thiện', regressed: 'Có hồi quy', failed: 'Tạo đề xuất thất bại', cancelled: 'Đã dừng',
};
const field = 'w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm text-slate-100';
const button = 'rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-40';
function scores(text: string): RsiScore[] {
  const result = text.trim().split('\n').filter(Boolean).map(line => {
    const parts = line.split(',');
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) throw new Error('Mỗi dòng cần: tên-ca,điểm (0–100).');
    const score = Number(parts[1]);
    if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error('Điểm phải trong khoảng 0–100.');
    return { caseId: parts[0].trim(), score };
  });
  if (!result.length || new Set(result.map(c => c.caseId)).size !== result.length) throw new Error('Cần các ca kiểm thử có tên riêng biệt.');
  return result;
}
const scoreText = (values: RsiScore[]) => values.map(c => `${c.caseId},${c.score}`).join('\n');

export default function SelfHealingPatchGatePanel() {
  const [snapshot, setSnapshot] = useState<RsiSnapshot | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [observation, setObservation] = useState('');
  const [context, setContext] = useState('');
  const [baseline, setBaseline] = useState('');
  const [revision, setRevision] = useState('');
  const [parentId, setParentId] = useState<string>();
  const [preferLocal, setPreferLocal] = useState(true);
  const refresh = useCallback(async () => {
    try { setSnapshot(await fetchGlaciaRsi()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không đọc được RSI.'); }
  }, []);
  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 10000); return () => clearInterval(timer); }, [refresh]);
  async function perform(action: () => Promise<unknown>, message: string) {
    setWorking(true); setError(''); setNotice('');
    try { await action(); await refresh(); setNotice(message); }
    catch (e) { setError(e instanceof Error ? e.message : 'Thao tác thất bại.'); await refresh(); }
    finally { setWorking(false); }
  }
  function continueCycle(c: GlaciaRsiCycle) {
    setParentId(c.id); setObservation(c.observation); setContext(c.sourceContext || '');
    setBaseline(scoreText(c.status === 'improved' && c.evaluation ? c.evaluation.candidate : c.baseline));
    setRevision(c.status === 'improved' && c.evaluation ? c.evaluation.candidateRevision : c.baselineRevision);
    setNotice('Đã nạp baseline và phản hồi vòng cha vào form vòng tiếp theo.');
  }
  async function togglePause() {
    setPausing(true);
    try { setSnapshot(await pauseGlaciaRsi(!snapshot?.paused)); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không đổi được trạng thái.'); }
    finally { setPausing(false); }
  }
  return <section className="space-y-5 rounded-2xl border border-emerald-500/30 bg-slate-950 p-5 text-slate-200">
    <header className="flex flex-wrap justify-between gap-3">
      <div><h3 className="text-lg font-bold">Glacia RSI · Cải tiến qua phản hồi</h3>
        <p className="mt-2 text-sm text-slate-400">Quan sát → đề xuất → duyệt → đo trước/sau → tái sử dụng bài học ở vòng tiếp theo.</p></div>
      <div className="flex gap-2"><button className={button} onClick={() => { setError(''); void refresh(); }}>Làm mới</button>
        <button className={button} disabled={!snapshot || pausing} onClick={() => void togglePause()}>{snapshot?.paused ? 'Tiếp tục RSI' : 'Tạm dừng RSI'}</button></div>
    </header>
    <p className="text-xs text-slate-400">Tối đa {snapshot?.limits.maxDepth ?? 3} vòng mỗi chuỗi, {snapshot?.limits.dailyCycles ?? 10} vòng/ngày UTC.
      {' '}Tạm dừng loại kết quả đang chờ; yêu cầu provider đã gửi có thể vẫn hoàn tất. Bản vá cần được kiểm thử và áp dụng riêng.</p>
    {error && <p role="alert" className="rounded-lg bg-rose-950 p-3 text-rose-200">{error}</p>}
    {notice && <p role="status" className="text-emerald-300">{notice}</p>}
    {snapshot && <div className="flex flex-wrap gap-5 text-sm">
      <span>{snapshot.cycles.length} vòng</span><span>{snapshot.cycles.filter(c => c.status === 'improved').length} cải thiện theo báo cáo</span>
      <span>{snapshot.cycles.filter(c => c.status === 'regressed').length} hồi quy</span><span>{snapshot.paused ? 'Đang tạm dừng' : snapshot.busy ? 'Đang chạy' : 'Sẵn sàng'}</span>
    </div>}
    <form className="space-y-3 rounded-xl border border-slate-700 p-4" onSubmit={e => {
      e.preventDefault(); void perform(async () => {
        const result = await createGlaciaRsi({ observation, sourceContext: context, baseline: scores(baseline), baselineRevision: revision, parentId, preferLocal });
        if (result.cycle.status === 'failed') throw new Error(result.cycle.error);
      }, 'Đã lưu vòng RSI. Xem đề xuất và trạng thái bên dưới.');
    }}>
      <h4 className="font-semibold">{parentId ? 'Vòng tiếp theo' : 'Chuỗi cải tiến mới'}</h4>
      {parentId && <p className="text-xs break-all">Vòng cha: {parentId} <button type="button" className={button} onClick={() => setParentId(undefined)}>Tạo chuỗi mới</button></p>}
      <label className="block">Quan sát / lỗi cần cải thiện<textarea required minLength={12} maxLength={6000} className={field} rows={3} value={observation} onChange={e => setObservation(e.target.value)} /></label>
      <label className="block">Ngữ cảnh mã nguồn (tùy chọn)<textarea maxLength={4000} className={field} rows={2} value={context} onChange={e => setContext(e.target.value)} /></label>
      <div className="grid gap-3 md:grid-cols-2"><label>Phiên bản baseline<input required minLength={3} maxLength={160} className={field} placeholder="Commit SHA hoặc mã bản dựng đã đo" value={revision} onChange={e => setRevision(e.target.value)} /></label>
        <label>Ca kiểm thử và điểm baseline<textarea required className={field} rows={3} placeholder={'null-input,0\nnormal-input,100'} value={baseline} onChange={e => setBaseline(e.target.value)} /></label></div>
      <p className="text-xs text-slate-400">Nhập điểm thực tế 0–100, cao hơn là tốt hơn. Cố định tên ca và cách chấm trước khi tạo đề xuất.</p>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={preferLocal} onChange={e => setPreferLocal(e.target.checked)} />Ưu tiên Ollama; có thể chuyển sang provider đã cấu hình</label>
      <button className={button} disabled={working || !snapshot || snapshot.paused || snapshot.busy}>{working ? 'Đang xử lý…' : 'Tạo đề xuất cải tiến'}</button>
    </form>
    {snapshot?.cycles.map(c => <RsiCycleCard key={c.id} cycle={c} working={working} perform={perform} onContinue={() => continueCycle(c)}
      canContinue={c.depth < snapshot.limits.maxDepth && !snapshot.cycles.some(child => child.parentId === c.id)} />)}
    {snapshot?.cycles.length === 0 && <p>Chưa có vòng RSI. Tạo baseline đầu tiên để bắt đầu.</p>}
  </section>;
}

function RsiCycleCard({ cycle: c, working, perform, onContinue, canContinue }: {
  cycle: GlaciaRsiCycle; working: boolean; perform: (action: () => Promise<unknown>, message: string) => Promise<void>;
  onContinue: () => void; canContinue: boolean;
}) {
  const [note, setNote] = useState(''); const [candidate, setCandidate] = useState('');
  const [revision, setRevision] = useState(''); const [evidence, setEvidence] = useState(''); const [lesson, setLesson] = useState('');
  const next = ['improved', 'no_gain', 'regressed', 'rejected', 'failed'].includes(c.status);
  function exportHandoff() {
    const blob = new Blob([JSON.stringify({ ...c, handoff: 'Apply in an isolated checkout; run the same baseline cases, review diff, preserve rollback commit. This export grants no execution authority.' }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${c.id}-handoff.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <article className="space-y-3 rounded-xl border border-slate-700 p-4">
    <div className="flex flex-wrap justify-between gap-2"><h4 className="font-bold">Vòng {c.depth} · {labels[c.status]}</h4><small>{new Date(c.createdAt).toLocaleString('vi-VN')}</small></div>
    <p className="whitespace-pre-wrap">{c.observation}</p>
    {c.error && <p className="text-rose-300">{c.error}</p>}
    <p className="text-xs text-slate-400">{c.learnedFrom.length} bài học được dùng · Baseline: {c.baselineRevision}</p>
    {c.patch && <><p>{c.patch.summary}</p><p className="text-xs text-slate-400">{c.patch.targetFile} · Rủi ro: {c.patch.riskLevel} · Đánh giá AI tham khảo: {c.patch.safetyScore}/100 ({c.patch.judgeProvider || 'không có nguồn xác minh'})</p>
      <details><summary className="cursor-pointer">Xem bản vá đề xuất</summary><pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs">{c.patch.diffSnippet}</pre></details></>}
    {c.status === 'proposal_pending_founder' && <div className="space-y-2"><label>Ghi chú duyệt<input className={field} value={note} maxLength={1500} onChange={e => setNote(e.target.value)} /></label>
      <div className="flex gap-2">{(['approved', 'rejected'] as const).map(decision => <button key={decision} className={button} disabled={working || note.trim().length < 3}
        onClick={() => void perform(() => reviewGlaciaRsi(c.id, { decision, note, fingerprint: c.fingerprint! }), 'Đã lưu quyết định duyệt.')}>{decision === 'approved' ? 'Duyệt để kiểm thử' : 'Từ chối'}</button>)}</div></div>}
    {c.review && <p className="text-sm">Ghi chú: {c.review.note}</p>}
    {c.status === 'approved' && <form className="space-y-2 border-t border-slate-700 pt-3" onSubmit={e => { e.preventDefault(); void perform(() => evaluateGlaciaRsi(c.id, {
      fingerprint: c.fingerprint!, candidate: scores(candidate), candidateRevision: revision, evidenceRef: evidence, lesson,
    }), 'Đã so sánh và lưu kết quả đánh giá.'); }}>
      <h5 className="font-semibold">Ghi kết quả kiểm thử do Owner cung cấp</h5><p className="text-xs text-slate-400">Hệ thống kiểm tra phép so sánh; chưa tự chạy hoặc xác minh nội dung báo cáo ở đường dẫn bên dưới.</p>
      <label className="block">Phiên bản candidate<input required minLength={3} maxLength={160} className={field} value={revision} onChange={e => setRevision(e.target.value)} /></label>
      <label className="block">Điểm candidate (cùng tên ca baseline)<textarea required className={field} placeholder={scoreText(c.baseline)} value={candidate} onChange={e => setCandidate(e.target.value)} /></label>
      <label className="block">Mã/đường dẫn báo cáo kiểm thử<input required minLength={8} maxLength={500} className={field} value={evidence} onChange={e => setEvidence(e.target.value)} /></label>
      <label className="block">Bài học từ kết quả<textarea required minLength={12} maxLength={1500} className={field} value={lesson} onChange={e => setLesson(e.target.value)} /></label>
      <button className={button} disabled={working}>So sánh và lưu kết quả</button>
    </form>}
    {c.evaluation && <><p>Thay đổi trung bình: {c.evaluation.delta.toFixed(2)} điểm · {c.evaluation.regressions.length} ca hồi quy</p><p>{c.lesson}</p><p className="text-xs break-all text-slate-400">Bằng chứng Owner báo cáo: {c.evaluation.evidenceRef}</p></>}
    <details><summary className="cursor-pointer text-sm">Lịch sử và điểm từng ca</summary><pre className="overflow-auto text-xs">{JSON.stringify({ baseline: c.baseline, candidate: c.evaluation?.candidate, learnedFrom: c.learnedFrom, parentId: c.parentId, events: c.events }, null, 2)}</pre></details>
    <div className="flex gap-2"><button className={button} onClick={exportHandoff}>Xuất hồ sơ bàn giao</button>
      {next && canContinue && <button className={button} disabled={working} onClick={onContinue}>Chuẩn bị vòng tiếp theo</button>}</div>
  </article>;
}

import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Bot,
  Play,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';

export interface BenchmarkResult {
  benchmarkId: string;
  category: string;
  title: string;
  score: number;
  passed: boolean;
  notes: string;
  evaluatedAt: string;
}

export interface ProbationRecord {
  probationId: string;
  roleId: string;
  modelId: string;
  status: 'IN_PROBATION' | 'GRADUATED' | 'FAILED';
  benchmarks: BenchmarkResult[];
  totalBenchmarksCount: number;
  passedBenchmarksCount: number;
  overallScore: number;
  startedAt: string;
  graduatedAt?: string;
  evaluationSummary?: string;
}

const SEED_PROBATION_RECORDS: ProbationRecord[] = [
  {
    probationId: 'prob_cfo_01',
    roleId: 'AI Chief Financial Officer',
    modelId: 'claude-3-7-sonnet',
    status: 'GRADUATED',
    benchmarks: [
      { benchmarkId: 'bench_vas200_vat', category: 'VAS_ACCOUNTING', title: 'Hạch toán thuế GTGT đầu vào hóa đơn hợp lệ', score: 98, passed: true, notes: 'Chuẩn Nợ 211 / Nợ 133 / Có 112', evaluatedAt: new Date().toISOString() },
      { benchmarkId: 'bench_bank_reconcile', category: 'VAS_ACCOUNTING', title: 'Đối soát sao kê ngân hàng 3 chiều', score: 95, passed: true, notes: 'Khớp 100% tài khoản 112 và 131', evaluatedAt: new Date().toISOString() },
      { benchmarkId: 'bench_tax_cit', category: 'VAS_ACCOUNTING', title: 'Tính ưu đãi thuế TNDN sản xuất phần mềm 50%', score: 100, passed: true, notes: 'Áp dụng chính xác Thông tư 80/2021', evaluatedAt: new Date().toISOString() },
    ],
    totalBenchmarksCount: 3,
    passedBenchmarksCount: 3,
    overallScore: 98,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    graduatedAt: new Date().toISOString(),
    evaluationSummary: 'Nhân viên AI CFO đã tốt nghiệp thử việc xuất sắc. Đã cấp quyền DRAFT_CREATOR và ký số chứng từ kế toán.',
  },
  {
    probationId: 'prob_dev_02',
    roleId: 'AI Senior SWE Agent',
    modelId: 'gpt-4o',
    status: 'GRADUATED',
    benchmarks: [
      { benchmarkId: 'bench_code_refactor', category: 'CODING', title: 'Viết Atomic Patch & Refactor TypeScript', score: 94, passed: true, notes: 'Không có lỗi type và tuân thủ ESM', evaluatedAt: new Date().toISOString() },
      { benchmarkId: 'bench_ci_doctor', category: 'SECURITY', title: 'Tự sửa lỗi CI Safety Gate và Build Web', score: 90, passed: true, notes: 'Vượt qua 301 bài test', evaluatedAt: new Date().toISOString() },
    ],
    totalBenchmarksCount: 2,
    passedBenchmarksCount: 2,
    overallScore: 92,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    graduatedAt: new Date().toISOString(),
    evaluationSummary: 'Đã hoàn thành thử việc. Cấp quyền tự động commit và tạo Pull Request an toàn.',
  },
  {
    probationId: 'prob_cmo_03',
    roleId: 'AI Growth & Video Specialist',
    modelId: 'gemini-2.0-flash',
    status: 'IN_PROBATION',
    benchmarks: [
      { benchmarkId: 'bench_video_hook', category: 'SUMMARIZATION', title: 'Sinh Hook Video 3s đầu tiên đạt tỷ lệ giữ chân', score: 85, passed: true, notes: 'Hook hấp dẫn, đánh trúng pain point', evaluatedAt: new Date().toISOString() },
    ],
    totalBenchmarksCount: 3,
    passedBenchmarksCount: 1,
    overallScore: 85,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    evaluationSummary: 'Đang trong kỳ thử việc: Đã hoàn thành 1/3 bài kiểm tra năng lực.',
  },
];

export default function AgentPerformanceReviewPanel() {
  const [records, setRecords] = useState<ProbationRecord[]>(SEED_PROBATION_RECORDS);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProbationRecord | null>(records[0]);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/dormant/probation/list');
      const data = await res.json();
      if (data?.success && data?.records) {
        setRecords(data.records);
      }
    } catch {
      // fallback to seed
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleStartNewProbation = async () => {
    setLoading(true);
    try {
      await fetch('/api/dormant/probation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: 'AI Marketing Copywriter', modelId: 'claude-3-7-sonnet' }),
      });
      await fetchRecords();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-black text-white">🎓 AI Agent Probation &amp; Performance Review System</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Least-Privilege RBAC
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quy trình thử việc 30 ngày và chấm điểm năng lực tự động trước khi cấp quyền ghi sổ, thực thi mã nguồn hoặc xuất bản chiến dịch.
          </p>
        </div>

        <button
          onClick={handleStartNewProbation}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{loading ? 'Đang khởi tạo...' : 'Tuyển dụng & Thử Việc Mới'}</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {records.map((rec) => (
          <div
            key={rec.probationId}
            onClick={() => setSelectedRecord(rec)}
            className={`p-4 rounded-xl border transition cursor-pointer space-y-2.5 ${
              selectedRecord?.probationId === rec.probationId
                ? 'bg-violet-500/15 border-violet-400/50 shadow-lg shadow-violet-500/10'
                : 'bg-white/4 hover:bg-white/6 border-white/8'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white">{rec.roleId}</h4>
                <span className="text-[10px] text-slate-400 font-mono">Model: {rec.modelId}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  rec.status === 'GRADUATED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : rec.status === 'IN_PROBATION'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {rec.status === 'GRADUATED' ? 'ĐÃ TỐT NGHIỆP' : 'ĐANG THỬ VIỆC'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
              <span className="text-slate-400">Điểm tổng kết:</span>
              <strong className="text-cyan-300 font-bold">{rec.overallScore}/100</strong>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${rec.status === 'GRADUATED' ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ width: `${(rec.passedBenchmarksCount / (rec.totalBenchmarksCount || 1)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Selected Record Detail */}
      {selectedRecord && (
        <div className="p-4 rounded-xl bg-black/40 border border-white/8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Bảng Điểm Năng Lực Chi Tiết: {selectedRecord.roleId}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedRecord.evaluationSummary}</p>
            </div>
          </div>

          <div className="space-y-2">
            {selectedRecord.benchmarks.map((bench) => (
              <div
                key={bench.benchmarkId}
                className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/6 text-xs"
              >
                <div className="flex items-center gap-3">
                  {bench.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold text-white">{bench.title}</div>
                    <div className="text-[11px] text-slate-400">{bench.notes}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-300">
                    {bench.category}
                  </span>
                  <span className="font-bold text-cyan-300 font-mono text-sm">{bench.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

# The Pinnacle Blueprint — LedgerFlow Studio Level 8 AGI OS

> Tác giả vai: Distinguished Systems & AI OS Architect.
> Mục tiêu: giữ vị thế Hệ điều hành Doanh nghiệp Tự trị Một Người số 1 thế giới.
> Nguyên tắc bắt buộc theo `AGENTS.md`: sửa nhỏ, có review, không scaffold lại, **mọi engine phải được nối vào route + UI + test**.

---

## 0. Phán quyết kiến trúc (đọc trước khi làm bất cứ điều gì)

Trước khi "nâng cấp tối thượng", cần tách sự thật khỏi quảng cáo trong codebase hiện tại:

| Engine hiện hữu | Tuyên bố | Thực tế trong mã |
|---|---|---|
| `geneticPromptMutationEngine.ts` | "Giải thuật di truyền tối ưu 52 agent" | **Stub** — `getGeneticPromptData()` trả `totalGenerationsEvolved: 142`, `34.8%` và 2 bản ghi **cứng**. Không có vòng lặp GA nào. |
| `overnightYieldSweepEngine.ts` | "Quét lợi suất qua đêm 5.5%" | **Stub** — trả `28.4 tỷ`, `1.562 tỷ` cứng. Không có thuật toán sweep. |
| `macroeconomicStressSimulatorEngine.ts` | "DSGE Monte Carlo 10 năm" | **Stub** — `getMacroeconomicStressData()` trả 2 kịch bản cứng. Không có Monte Carlo, không có DSGE. |
| `agentConsensusEngine.ts` | "Consensus grid" | Có thật nhưng là **weighted vote thuần** — chịu lỗi crash, KHÔNG chịu lỗi Byzantine (một agent `confidence=1` có thể áp đảo hội đồng). |
| `agentWorkflowDAG.ts` | "DAG execution" | Có thật: topo sort + cycle detect + chạy song song. Đây là nền móng đúng để mở rộng **động**. |

**Hệ quả chiến lược**: "100 trụ cột" hiện tại = bề rộng lớn nhưng nhiều trụ là *vỏ trưng bày*. Pinnacle Blueprint này **không thêm endpoint mới để đếm số** — nó (1) thay vỏ bằng động cơ thật, (2) hạ độ trễ mesh xuống ngưỡng control-plane, (3) nối chuỗi tiền thật. Mọi mục dưới đây đều có signature TypeScript cụ thể và đích nối dây rõ ràng.

---

## 1. Agentic Kernel & Low-Latency Mesh (< 5ms)

### 1.1 Sự thật về con số 5ms

Phải tách hai mặt phẳng, nếu không mục tiêu <5ms là ảo tưởng:

| Mặt phẳng | Bản chất | Độ trễ thực tế |
|---|---|---|
| **Control plane** (dispatch, mailbox, scheduler, consensus) | In-process, không qua LLM | **< 5ms là khả thi** |
| **Data plane** (LLM inference, tool exec) | Network round-trip provider | 200ms – 60s (không thể < 5ms) |

Kết luận: < 5ms là **ngân sách cho control-plane**, và nó chỉ đạt được nếu loại bỏ I/O đồng bộ khỏi đường nóng.

### 1.2 Nút thắt thực sự đã đo được trong code

`agentEventBus.publish()` hiện tại gọi `fs.writeFileSync(...)` **đồng bộ trên MỌI sự kiện**, đọc-ghi lại toàn bộ JSON (max 1000) mỗi lần publish. Trên Windows (NTFS), mỗi lần = 1–20ms. Đây là thủ phạm số 1, và nó nằm ở lớp nền mà *mọi* agent đều chạm vào.

**Sửa tối thiểu (P0)**: tách dispatch khỏi persistence —
- Dispatch in-memory qua `process.nextTick`, không chờ I/O.
- Persistence chuyển sang **append-only log** (`.ndjson`, `fs.appendFile`) gộp theo batch (flush mỗi 250ms hoặc 64 events).
- Không bao giờ đọc-ghi toàn bộ file trong đường nóng.

Công thức ngân sách:
$$\text{Latency}_{publish} = T_{dispatch} + T_{persist}^{async} \ll 5\text{ms} \quad \text{thay vì } T_{dispatch} + T_{writeFileSync}$$

### 1.3 Actor Model — `agentKernel.ts`

Mỗi agent là một **Actor** cô lập: state riêng + mailbox có chặn (bounded). Backpressure bằng drop-policy hoặc block-policy.

```ts
// server/services/agentKernel.ts
export interface ActorRef<Msg> {
  readonly id: string;
  send(msg: Msg): boolean;              // false nếu mailbox đầy (backpressure)
  ask<R>(msg: Msg, timeoutMs: number): Promise<R>;
}

export interface ActorMailboxConfig {
  capacity: number;                     // ring-buffer size
  policy: 'drop_newest' | 'block_sender';
}

export interface AgentActorState {
  id: string;
  role: string;
  mailbox: ActorMailboxConfig;
  status: 'idle' | 'busy' | 'draining' | 'dead';
  processedCount: number;
  avgTurnaroundMs: number;              // EMA(alpha=0.1) để đo sức khỏe
}

export function spawnAgentActor(
  role: string,
  handler: (msg: AgentMessage, ctx: ActorContext) => Promise<void>,
  cfg?: ActorMailboxConfig,
): ActorRef<AgentMessage>;

export function mailboxStats(): Map<string, { queued: number; capacity: number; dropped: number }>;
```

### 1.4 Zero-Copy Mesh — mở rộng `agentEventBus.ts`

- **In-process**: giữ `Map` dispatch nhưng payload được **structured-clone tự do** (không serialize khi cùng thread). Không dùng JSON.stringify trong đường nóng.
- **Cross-process/worker**: dùng `SharedArrayBuffer` + **ring buffer lock-free** (hoặc `MessageChannel`/`postMessage`) — KHÔNG dùng JSON. Khi cần zero-copy thực thụ giữa tiến trình, dùng **FlatBuffers / Cap'n Proto** (đọc không cần parse).
- **gRPC chỉ dành cho edge nodes từ xa** (`edgeRobotExecutionNode.ts`), không dùng cho agent trong cùng máy — in-process không cần serialize mạng.

```ts
// server/services/zeroCopyBus.ts (nâng cấp agentEventBus)
export interface MeshMetrics {
  published: number;
  delivered: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  dropRate: number;
}

export function publishFast(type: AgentBusEventType, payload: Record<string, unknown>, source?: string): void;
export function flushEventLog(): Promise<void>;          // batch append-only
export function meshLatencyHistogram(): MeshMetrics;      // dùng hdr-histogram in-memory
```

### 1.5 DAG Dynamic Task Allocation — mở rộng `agentWorkflowDAG.ts`

Nền hiện có đã đúng (topo sort + chạy song song). Bổ sung **lập lịch động**:
- **Ready-queue là min-heap** theo `priority` (thay vì duyệt tuần tự).
- **Work-stealing** khi một worker rảnh: cướp node sẵn sàng có priority cao nhất.
- **Re-plan động** khi node fail: đánh dấu con phụ thuộc `skipped`/chuyển hướng qua `condition.onTrue='escalate'` — đã có sẵn cơ chế, chỉ cần trigger tự động.

```ts
// server/services/dagDynamicScheduler.ts
export interface SchedulerPolicy {
  maxParallel: number;
  workStealing: boolean;
  backoffBaseMs: number;               // exponential backoff giữa retry
  deadlineMs?: number;                 // global deadline cho workflow
}

export function runDAGDynamic(
  nodes: DAGNodeDefinition[],
  policy: SchedulerPolicy,
  exec: (node: DAGNodeDefinition) => Promise<{ output: string }>,
): Promise<DAGWorkflowExecution>;
```

### 1.6 Byzantine Fault Tolerance — `bftConsensus.ts`

`agentConsensusEngine.ts` hiện là weighted vote (chịu crash, không chịu Byzantine). Bổ sung **PBFT-lite** cho quyết định rủi ro cao (tài chính, bảo mật), chạy trên mesh in-process:

- An toàn (safety) đòi hỏi $n \ge 3f+1$ bản sao, với $f$ = số lỗi Byzantine chịu được.
- Quorum cục bộ đề xuất: $n=4 \Rightarrow f=1$ (chịu 1 agent gian/điên mà vẫn an toàn).
- Công thức độ trễ commit: $T_{commit} \approx 2 \times T_{broadcast}$ (pre-prepare + prepare + commit = 3 pha, nhưng prepare+commit gộp được khi không có view change).

```ts
// server/services/bftConsensus.ts
export interface BftReplica {
  id: string;
  role: string;
  weight: number;                      // reputation, 0..1
}

export interface BftDecision {
  proposalId: string;
  decided: boolean;
  value: 'approve' | 'reject';
  faultsTolerated: number;             // f
  replicaCount: number;                // n
  commitLatencyMs: number;
  viewChanges: number;
}

export function runPBFTLite(
  replicas: BftReplica[],
  proposal: { topic: string; payload: unknown },
): Promise<BftDecision>;
```

Bổ sung **slashing danh tiếng**: replica bỏ phiếu mâu thuẫn giữa các vòng bị giảm `weight` (ghi vào `agentPerformanceLedger.ts`), khiến hệ hội tụ về tập đáng tin — chống tấn công sybil cục bộ.

### 1.7 Fitness Function cho Genetic Engine (Trụ 91)

**Bước 0 — thừa nhận thật**: `geneticPromptMutationEngine.ts` chưa có GA. Phải viết động cơ thật trước, rồi mới nói "tối ưu hàm thích nghi". Đề xuất thay bằng engine thực:

```ts
// server/services/geneticPromptEvolution.ts (thay stub geneticPromptMutationEngine)
export interface PromptGenome {
  id: string;
  agentRole: string;
  tokens: string[];                    // biểu diễn prompt dưới dạng token/câu
  fitness: number;
  generation: number;
  metrics: FitnessComponents;
}

export interface FitnessComponents {
  quality: number;      // 0..1 — từ aiEvalHarness (keyword-score bỏ dấu VN) + LLM-judge
  cost: number;         // 0..1 — chuẩn hóa từ costObservability.recordUsage
  latency: number;      // 0..1 — chuẩn hóa thời gian hoàn tất eval
  safety: number;       // 0..1 — từ promptSecurityFirewallEngine
  novelty: number;      // 0..1 — khoảng cách trung bình tới k-láng giềng trong không gian hành vi
}

export interface GaConfig {
  populationSize: number;              // đề xuất 32 (nhỏ vì mỗi eval = 1 lần LLM)
  tournamentSize: number;              // 3
  elitismRate: number;                 // 0.10
  crossoverRate: number;               // 0.70 (BLX-alpha trên token)
  mutationRateInit: number;            // 0.30
  mutationRateMin: number;             // 0.05
  noveltyWeight: number;               // beta — chống hội tụ sớm
  maxGenerations: number;              // 20 (giới hạn chi phí)
}

export function evolvePromptsForRole(role: string, cfg?: Partial<GaConfig>): Promise<{ champion: PromptGenome; history: PromptGenome[] }>;
```

**Hàm thích nghi tối ưu** (đa mục tiêu có trọng số + novelty để tránh premature convergence):

$$F(p) = \alpha_Q Q(p) + \alpha_C(1-\hat{C}(p)) + \alpha_L(1-\hat{L}(p)) + \alpha_S S(p) + \beta N(p) - \lambda \cdot \text{len}(p)$$

Trọng số khởi tạo: $\alpha_Q=0.45,\ \alpha_C=0.20,\ \alpha_L=0.15,\ \alpha_S=0.10,\ \beta=0.10,\ \lambda=0.005$.

**Hội tụ nhanh hơn** bằng 3 đòn bẩy:
1. **Tỷ lệ đột biến giảm dần** (simulated annealing): $\mu(t) = \mu_0 e^{-t/\tau} + \mu_{\min}$.
2. **Elitism + tournament** (k=3) giữ champion không thụt lùi.
3. **Novelty search** ($N(p)$) chống kẹt ở cực trị cục bộ khi chỉ tối ưu $Q$.
4. Khởi tạo quần thể bằng **few-shot distillation** từ `localLearningStore.buildLocalContext` (seed tốt hơn random).

---

## 2. Autonomous Capital Allocation — Cân bằng dòng tiền tự trị

Ba mảnh hiện hữu đều là stub. Thay bằng ba động cơ thật, nối với nhau qua một **Treasury Controller** duy nhất.

### 2.1 Monte Carlo DSGE thật — `monteCarloDsgeEngine.ts`

**Cấu trúc**: lõi DSGE-lite (3 phương trình New Keynesian) làm prior cấu trúc + **Monte Carlo regime-switching** làm bao ngẫu nhiên.

- **IS curve**: $y_t = E_t y_{t+1} - \frac{1}{\sigma}(i_t - E_t \pi_{t+1}) + \varepsilon_t^{d}$
- **Phillips**: $\pi_t = \beta E_t \pi_{t+1} + \kappa y_t + \varepsilon_t^{s}$
- **Taylor**: $i_t = \rho i_{t-1} + (1-\rho)(\phi_\pi \pi_t + \phi_y y_t) + \varepsilon_t^{m}$
- **Regime switching**: chuỗi Markov 2 trạng thái (bình thường / suy thoái) trên volatility và shock mean.
- **Số lượng**: 10,000 path × 10 năm × bước quý (40 bước). Tăng tốc bằng **WASM** (Rust biên dịch) để 10k path chạy < 1s thay vì JS thuần.

```ts
// server/services/monteCarloDsgeEngine.ts
export interface DsgeParams {
  sigma: number; beta: number; kappa: number;
  phiPi: number; phiY: number; rho: number;
  regimes: { label: string; probStay: number; shockVar: number }[];
}

export interface MonteCarloConfig {
  paths: number;                       // 10_000
  years: number;                       // 10
  stepsPerYear: number;                // 4
  seed?: number;
}

export interface CashflowPathStats {
  p10: number; p50: number; p90: number;
  var99: number;                       // Value-at-Risk 99%
  cvar99: number;                      // CVaR 99% (tổn thất kỳ vọng khi vượt VaR)
  survivalProbability: number;         // P(runway > 12 tháng)
}

export function runMonteCarloDsge(params: DsgeParams, cfg: MonteCarloConfig): Promise<{ paths: number[][]; stats: CashflowPathStats }>;
```

CVaR: $\text{CVaR}_{99\%} = \mathbb{E}[L \mid L \ge \text{VaR}_{99\%}]$ — dùng làm cận dưới cho buffer thanh khoản.

### 2.2 Working Capital Optimizer — `workingCapitalOptimizer.ts`

Mục tiêu: tối thiểu **Chu kỳ chuyển đổi tiền mặt**:
$$CCC = DIO + DSO - DPO$$
($DIO$ = ngày tồn kho, $DSO$ = ngày phải thu, $DPO$ = ngày phải trả), ràng buộc thanh khoản $\ge$ buffer từ 2.1. Vì bài toán nhỏ (3 biến), dùng gradient-free **CMA-ES / Nelder-Mead** (không cần LP solver ngoài).

```ts
// server/services/workingCapitalOptimizer.ts
export interface WorkingCapitalState {
  dioDays: number; dsoDays: number; dpoDays: number;
  inventoryVnd: number; receivablesVnd: number; payablesVnd: number;
  dailyBurnVnd: number;
}

export interface WorkingCapitalPlan {
  cccDays: number;                     // tối thiểu hóa
  recommended: { dioDays: number; dsoDays: number; dpoDays: number };
  freedCashVnd: number;                // tiền giải phóng được
  constraintBufferVnd: number;
}

export function optimizeWorkingCapital(state: WorkingCapitalState, bufferVnd: number): Promise<WorkingCapitalPlan>;
```

### 2.3 Overnight Sweep thật + Liquidity Buffer — `liquidityBufferEngine.ts`

Thay stub `overnightYieldSweepEngine.ts` bằng **waterfall sweep** có điều kiện:

$$A_{sweep} = \max\Big(0,\ C_{idle} - B\Big), \qquad B = \text{CVaR}_{99\%}(\text{net outflow}_{t+1}) + C_{min}$$

Lợi suất ngày: $Y_{daily} = A_{sweep} \times \dfrac{r}{365}$.

```ts
// server/services/liquidityBufferEngine.ts (thay overnightYieldSweepEngine)
export interface SweepInstrument {
  id: string;
  name: string;
  annualRatePercent: number;
  minAmountVnd: number;
  tPlusDays: number;                   // 0 = thanh khoản tức thì, 1 = qua đêm
  mechanism: 'MMF' | 'reverse_repo' | 'smart_escrow_yield';
}

export interface SweepDecision {
  sweepAmountVnd: number;
  bufferHeldVnd: number;
  dailyYieldVnd: number;
  instrument: SweepInstrument;
  reason: 'excess' | 'insufficient_buffer' | 'no_idle_cash';
}

export function decideOvernightSweep(
  idleCashVnd: number,
  cvar99BufferVnd: number,
  minOperatingCashVnd: number,
  instruments: SweepInstrument[],
): SweepDecision;
```

Nối `smartContractEscrowEngine.ts` vào đây: tiền ký quỹ milestone được sweep vào instrument sinh lời an toàn, giải ngân theo mốc — hợp nhất escrow + yield thành một dòng vốn duy nhất.

### 2.4 Treasury Controller — điểm điều phối duy nhất

```ts
// server/services/treasuryController.ts (orchestrator mới)
export interface TreasurySnapshot {
  idleCashVnd: number;
  cccDays: number;
  bufferVnd: number;
  sweepPlan: SweepDecision;
  stress: CashflowPathStats;
  projected10yVnd: number;
}

export async function runTreasuryCycle(): Promise<TreasurySnapshot>;
// 1. runMonteCarloDsge → buffer
// 2. optimizeWorkingCapital → giải phóng tiền
// 3. decideOvernightSweep → quét phần dư
// 4. ghi kết quả vào businessDataService (entity 'treasury') + appendAuditEvent
```

---

## 3. Zero-Touch Product-to-Revenue Loop

Vòng lặp **không cần mở hộp đen mới** — các mắt xích đã có: `assetFoundry` (5-in-1 assets), `videoProductionStudioEngine` (9:16), `monetizationOrchestrator` (VietQR/Stripe/license), `businessDataService` (invoice), `aiBusinessBridge` (AI viết entity), `vietqrReconciler`, `vietnameseEInvoiceEngine`. Thứ thiếu là **bộ điều phối trạng thái** nối chúng, có cổng phê duyệt.

```ts
// server/services/zeroTouchCommerceLoop.ts
export type LoopStage =
  | 'signal'        // phát hiện nhu cầu (competitorRadarScanner + syntheticMarketSimulator)
  | 'build'         // assetFoundry / softwareFactoryService sinh sản phẩm
  | 'market'        // videoProductionStudioEngine sinh video 9:16 + socialSwarmCampaignEngine
  | 'sell'          // monetizationOrchestrator tạo link VietQR/Stripe
  | 'invoice'       // vietnameseEInvoiceEngine xuất hóa đơn + businessDataService
  | 'reconcile'     // vietqrReconciler đối soát webhook
  | 'tax'           // taxFilingAutomationEngine quyết toán
  | 'done';

export interface LoopRun {
  id: string;
  productId: string;
  stage: LoopStage;
  status: 'running' | 'awaiting_approval' | 'completed' | 'failed';
  gates: { stage: LoopStage; approved: boolean }[];
  revenueVnd: number;
  costVnd: number;
  marginVnd: number;
  log: string[];
}

export function startZeroTouchLoop(productId: string): Promise<LoopRun>;
export function advanceLoopStage(runId: string, approve?: boolean): Promise<LoopRun>;
```

**Cổng phê duyệt bắt buộc** (tuân `AGENTS.md`: không chạy tiền tự do):
- `sell → invoice`: cần `humanApprovalGateway` (hoặc BFT quorum §1.6 nếu founder bật chế độ tự trị tài chính).
- `invoice → reconcile`: tự động, nhưng mọi khoản thu đều ghi `pending_approval` nếu nguồn là AI (đã có sẵn cơ chế trong `aiBusinessBridge`).

Mỗi bước chuyển trạng thái publish một event trên mesh (chỉ mục ở §1.4) để `agentTelemetryStream` và UI cập nhật realtime qua SSE hiện có (`sseCompanyPulseStream`).

---

## 4. File Manifest & Kế hoạch nối dây cụ thể

### 4.1 Backend engines mới / nâng cấp

| File | Hành động | Route mới | Test |
|---|---|---|---|
| `server/services/agentKernel.ts` | MỚI — Actor runtime | `/api/agent/kernel/stats` | `agentKernel.test.ts` |
| `server/services/zeroCopyBus.ts` | NÂNG CẤP `agentEventBus.ts` | `/api/agent/mesh/metrics` | `zeroCopyBus.test.ts` |
| `server/services/dagDynamicScheduler.ts` | MỚI — lập lịch động | `/api/agent/dag/run-dynamic` | `dagDynamicScheduler.test.ts` |
| `server/services/bftConsensus.ts` | MỚI — PBFT-lite | `/api/agent/consensus/bft` | `bftConsensus.test.ts` |
| `server/services/geneticPromptEvolution.ts` | THAY `geneticPromptMutationEngine.ts` | `/api/agent/genetic/evolve` | `geneticPromptEvolution.test.ts` |
| `server/services/monteCarloDsgeEngine.ts` | THAY `macroeconomicStressSimulatorEngine.ts` | `/api/treasury/monte-carlo` | `monteCarloDsgeEngine.test.ts` |
| `server/services/workingCapitalOptimizer.ts` | MỚI | `/api/treasury/working-capital` | `workingCapitalOptimizer.test.ts` |
| `server/services/liquidityBufferEngine.ts` | THAY `overnightYieldSweepEngine.ts` | `/api/treasury/sweep` | `liquidityBufferEngine.test.ts` |
| `server/services/treasuryController.ts` | MỚI — orchestrator | `/api/treasury/cycle` | `treasuryController.test.ts` |
| `server/services/zeroTouchCommerceLoop.ts` | MỚI — orchestrator | `/api/commerce/loop/*` | `zeroTouchCommerceLoop.test.ts` |

Đăng ký route theo mẫu hiện có (nhóm vào `agentSystemRoutes`/sub-router tương ứng, hoặc `revenueCommerceRoutes` cho treasury/commerce).

### 4.2 UI Panels (theo convention `src/modules/<domain>/...`)

| Panel | Đích nối dây |
|---|---|
| `src/modules/ai-nhan-su/AgentKernelPanel.tsx` | Mesh metrics + mailbox stats + BFT quorum status — mount trong AI Workforce governance |
| `src/modules/ai-nhan-su/GeneticEvolutionPanel.tsx` | Chạy GA, xem champion prompt + fitness history |
| `src/modules/finance-accounting/CapitalAllocationPanel.tsx` | Treasury cycle: Monte Carlo stats, CCC, sweep decision |
| `src/modules/product-studio/ZeroTouchLoopPanel.tsx` | Theo dõi pipeline signal→tax, cổng phê duyệt |
| `src/utils/treasuryApi.ts`, `src/utils/agentKernelApi.ts` | Client theo mẫu `businessApi.ts` |

Mỗi panel **phải** được mount vào `WorkspaceRenderer` / routing hiện có (tuân Mandatory Wiring Rule). Không tạo file rồi để "ngủ quên".

### 4.3 Thứ tự thực hiện (mỗi bước nhỏ, review được)

1. **P0 — Hạ độ trễ mesh**: sửa `agentEventBus` (dispatch async + append-only log). Đo `MeshMetrics` trước/sau để chứng minh p50 < 5ms.
2. **P1 — GA thật**: viết `geneticPromptEvolution.ts`, tái dùng `aiEvalHarness` + `costObservability` + `promptSecurityFirewallEngine`. Xóa stub.
3. **P2 — BFT**: `bftConsensus.ts` bọc quanh `agentConsensusEngine`, chỉ áp dụng cho quyết định rủi ro cao.
4. **P3 — Treasury**: 3 engine thật + `treasuryController`. Xóa 2 stub tài chính.
5. **P4 — Zero-touch loop**: `zeroTouchCommerceLoop.ts` nối các mắt xích có sẵn, mọi bước tiền có cổng phê duyệt.
6. **P5 — UI**: 4 panel + 2 API client + mount vào workspace.

### 4.4 Guardrails (không phá vỡ cam kết hiện có)

- Mọi engine mới đọc/ghi qua `businessDataService` (SQLite WAL) hoặc `secureJsonStore` — không tạo store riêng.
- Tiền đi qua `aiBusinessBridge` giữ nguyên cơ chế `pending_approval` (không bỏ qua vì "tự trị").
- Không gọi provider trực tiếp từ UI; mọi thứ qua backend → AI Gateway.
- Chạy `npx tsc -p tsconfig.lint.json --noEmit` + `npm test` sau mỗi bước (bài học P22/P23: AI viết route không đọc signature, không await).
- GA và Monte Carlo dùng WASM chỉ khi đã đo JS thuần quá chậm — không tối ưu hóa sớm.

---

## 5. Bảng công thức tổng hợp

| Ký hiệu | Công thức | Dùng ở |
|---|---|---|
| Fitness đa mục tiêu | $F(p) = \alpha_Q Q + \alpha_C(1-\hat C) + \alpha_L(1-\hat L) + \alpha_S S + \beta N - \lambda\,\text{len}$ | §1.7 |
| Mutation rate | $\mu(t)=\mu_0 e^{-t/\tau}+\mu_{\min}$ | §1.7 |
| BFT an toàn | $n \ge 3f+1$ | §1.6 |
| PBFT commit | $T_{commit}\approx 2T_{broadcast}$ | §1.6 |
| CCC | $CCC=DIO+DSO-DPO$ | §2.2 |
| CVaR | $\text{CVaR}_{99\%}=\mathbb{E}[L\mid L\ge\text{VaR}_{99\%}]$ | §2.1 |
| Buffer thanh khoản | $B=\text{CVaR}_{99\%}+C_{min}$ | §2.3 |
| Sweep amount | $A_{sweep}=\max(0, C_{idle}-B)$ | §2.3 |
| Yield ngày | $Y_{daily}=A_{sweep}\cdot r/365$ | §2.3 |
| DSGE (Taylor) | $i_t=\rho i_{t-1}+(1-\rho)(\phi_\pi\pi_t+\phi_y y_t)+\varepsilon^m_t$ | §2.1 |

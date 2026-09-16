# AI Handoff Log

## 2026-09-16 — Glacia RSI: feedback loop, canonical review and Windows persistence

- Nâng `glaciaRecursiveImprovementEngine.ts`: lineage cha/con, baseline cố định, fingerprint bản vá, quyết định Owner, so sánh từng ca, bài học vòng sau, quota, pause bền vững, phục hồi gián đoạn và ghi JSON atomic. Factory cô lập để test không chạm dữ liệu Owner.
- `selfHealingPatchEngine.ts`: RSI bắt buộc phản hồi model hợp lệ; không còn gắn trạng thái đã áp dụng khi chỉ tạo proposal. AI judge có provenance để phân biệt fallback.
- `robotAutomationRoutes.ts`: toàn bộ RSI API cần đúng Owner; thêm review/evaluate/pause; chặn route self-healing cũ duyệt bản sao RSI gây lệch trạng thái.
- `glaciaRsiApi.ts` + `SelfHealingPatchGatePanel.tsx`: form baseline, duyệt, báo cáo candidate, xem hồi quy/lịch sử, xuất handoff và chuẩn bị vòng kế tiếp. Gắn trực tiếp tab Dev Tools → RSI trong `GlaciaIntelligenceHub.tsx`, giữ mount DevOps.
- `desktop/main.cjs`: RSI dùng đường dẫn userData thực để rename atomic không bị lệch với cơ chế redirect filesystem của Electron.
- `package.json`: `test:rsi` và `pretest`; thêm 10 test lõi + 1 test HTTP (`glaciaRsiRoutes.test.ts`). Hướng dẫn: `docs/GLACIA_RSI.md`; cập nhật PROJECT_STRUCTURE.

### Xác minh

- Build nền trước sửa: pass. Build cuối trong `npm run desktop:pack`: pass, electron-builder và release notes hoàn tất với exit 0.
- `npm run test:rsi`: 11/11 pass (bao gồm HTTP owner gate, validation, pause); `npm test` trong build: pass.
- `npm run lint` (CI safety gate), `npm run check:wiring`, `git diff --check`: pass.
- SSR smoke render panel: pass; bundle frontend không mang `node:fs` từ import type backend.
- SHA-256 `dist/server.cjs`, `dist/assistant-daemon.cjs`, `desktop/main.cjs` khớp bản trong `release/win-unpacked/resources/app`.
- `npm run lint:strict`: chưa pass, 16 lỗi ngoài tập RSI tại glaciaBatchWebInspector, glaciaCrossSystemIntegrator, glaciaGeminiDeepWebBridge, glaciaGeminiLiveApi, glaciaWebMonitorScheduler và GlaciaAutonomousResearchModal. Không sửa lấn sang các module này.
- Cảnh báo build hiện có: bundle lớn, dynamic/static import trùng, test BusinessData cạnh tranh ghi SQLite/JSON. Không coi các cảnh báo này là đã xử lý.

### Giới hạn và bước tiếp

- Kết quả cải thiện là `owner_reported`; chưa tự thực thi candidate, xác minh report, áp dụng diff, triển khai hoặc huấn luyện model. Không quảng cáo thành tự cải tiến trọng số hay nâng cấp đã kiểm chứng độc lập.
- Pause bỏ kết quả đến muộn, không hủy request provider đã gửi. Kho dữ liệu phục vụ một tiến trình backend; chưa có lock đa tiến trình hoặc UI archive 200 hồ sơ.
- Không chạy ứng dụng đóng gói với tài khoản thật để tạo RSI mới và chưa kiểm thử giao diện tương tác end-to-end. Kiểm thử lõi/HTTP dùng dữ liệu tạm.
- Giữ nguyên các thay đổi có sẵn trong worktree từ pha trước. Không commit tự động.

**AI Agent: Codex — 2026-09-16**

> Lịch sử bàn giao công việc giữa các AI agent.
> Mỗi AI PHẢI ghi lại handoff note khi kết thúc phiên làm việc.
> Xem `docs/AI_CONSISTENCY_PROTOCOL.md` để biết quy trình chi tiết.

---

## Template

```markdown
## AI Handoff Note

**AI Agent:** [Tên AI + phiên bản]
**Ngày:** [YYYY-MM-DD HH:MM]
**Nhiệm vụ:** [Mô tả ngắn gọn]

### Files đã thay đổi
- `path/to/file.tsx` — [mô tả thay đổi]

### Files đã tạo mới
- `path/to/new-file.tsx` — [mô tả]

### Trạng thái build
- [ ] Build pass

### Lưu ý cho AI tiếp theo
- [Điều cần biết]

### AI Agent Signature
[Tên AI] — [YYYY-MM-DD]
```

---

## Lịch sử

# 2026-09-16 — Phase 5: release readiness uses live artifact evidence

- Added a read-only release artifact snapshot for the frontend bundle, server runtime, assistant daemon, and Windows executable. It never runs commands or changes a release.
- `ReleaseReadinessPanel` now displays actual presence, size, timestamp, runtime mode, fetch failures, and allows only a manual refresh.
- The existing command checklist remains a human verification guide; artifact evidence is not presented as a substitute for tests or release approval.
- Validation passed: `npm run check:wiring` (wired=1001, dead=0), lint, full build/tests (356/356), and `npm run desktop:pack`. The rebuilt `release/win-unpacked/LedgerFlow Hub.exe` and packaged `resources/app/dist/server.cjs` were both verified.

# 2026-09-16 — Phase 7: remove mandatory remote demo assets

- Face tracking no longer fetches a CDN at runtime; it only accepts the deliberate local vendor path and returns a clear diagnostic if that optional asset is absent.
- Video workflow sample no longer exposes an invented remote MP4 or claims cloud generation/publication. It is now explicitly a local preview workflow, with external work remaining draft-only.

# 2026-09-16 — Phase 8: Windows CI validates the complete desktop runtime

- Windows GitHub Actions now bundles `assistant-daemon.cjs` alongside `server.cjs`, runs offline and wiring gates, and refuses to upload an EXE whose package lacks either runtime entrypoint.

# 2026-09-16 — Phase 6: packaged-runtime smoke test

- The rebuilt EXE was started temporarily and its local server answered on port 32123. The protected release-readiness endpoint returned `Authentication required`, confirming both embedded server startup and the intended local-auth boundary. Visual post-login navigation still requires a manual owner-session check because the available Computer Use session exposed no targetable Windows-app controls.
- Final package verification: `LedgerFlow Hub.exe`, `dist/server.cjs`, and `dist/assistant-daemon.cjs` are present in `release/win-unpacked`.

# 2026-09-16 — Glacia RSI foundation: bounded, founder-governed learning cycles

- Added a persisted RSI cycle: one technical observation produces one safety-judged patch proposal plus a reusable lesson. Every cycle forces `autoApplyLowRisk: false` and explicitly forbids source writes, command execution, commits, and releases.
- The Glacia RSI panel now uses the cycle API rather than a detached patch endpoint. Approval is restricted server-side to the designated local owner and records that identity; approval still does not apply code.

## AI Handoff Note

**AI Agent:** Claude 3.5 Sonnet (Cline) — Session 2
**Ngày:** 2026-08-26
**Nhiệm vụ:** Fix GlaciaCommandCockpit.tsx TypeScript errors (Phase 1 simplification)

### Files đã sửa
- `src/components/glacia/GlaciaCommandCockpit.tsx` — Removed stray `{` before SETTINGS comment (line 479), kept 3 closing `</div>` tags at lines 534-536

### Files đã xóa
- `scripts/fix-cockpit.mjs` — Temp script (deleted in Session 1)
- `scripts/fix-cockpit2.mjs` — Temp script (deleted in Session 2)

### Trạng thái build
- [x] TypeScript check: PASS — only pre-existing test file errors remain (unrelated to this change)
- [ ] Full `npm run build`: FAILED at prebuild step `check:openclaw-plus` (pre-existing, not related to this change)

### Tóm tắt thay đổi
1. **Stray `{` removed** — Line 479 had `{            {/* ── TAB: SETTINGS ── */}` which caused 6 TS errors. Changed to `{/* ── TAB: SETTINGS ── */}`.
2. **3 closing `</div>` tags retained** — These close the main content div (261), cockpit container (151), and overlay div (149). They are needed for correct JSX structure.

### Lưu ý cho AI tiếp theo
- Phase 1 simplification còn: AIAssistantPanel.tsx (18 tabs → 5 groups, 1312 lines)
- `npm run build` prebuild step `check:openclaw-plus` fails due to missing script entries — this is a pre-existing issue
- tsc --noEmit requires 8GB heap (`NODE_OPTIONS=--max-old-space-size=8192`) for this project

### AI Agent Signature
Claude 3.5 Sonnet (Cline) — 2026-08-26 Session 2

---

## AI Handoff Note

**AI Agent:** Claude 3.5 Sonnet (Cline)
**Ngày:** 2026-08-26
**Nhiệm vụ:** Tạo bộ tài liệu chuẩn hóa AI consistency + Glacia standards

### Files đã tạo mới
- `docs/GLACIA_STANDARDS.md` — Định nghĩa Glacia, danh sách component cốt lõi/phụ trợ, quy tắc bảo tồn tên
- `docs/AI_CONSISTENCY_PROTOCOL.md` — Giao thức nhất quán liên AI: 5 golden rules, quy trình chuẩn, handoff protocol, "don't delete" list
- `docs/HANDOFF_LOG.md` — Nhật ký bàn giao công việc giữa các AI

### Files đã sửa
# AI Handoff Note

**AI Agent:** Codex (GPT-5.6)
**Ngày:** 2026-09-16
**Nhiệm vụ:** Pha 1 — đưa Founder Control capability pack vào Command Center.

### Files đã thay đổi
- `server/services/businessDataRoutes.ts` — expose draft-only churn và code-quality report endpoints cạnh các robot report hiện hữu.
- `src/utils/founderControlApi.ts` — typed client cho bốn báo cáo Founder Control.
- `src/modules/command-center/FounderControlPanel.tsx` — UI tạo brief/revenue/churn/code-quality report theo yêu cầu, không có hành động gửi hoặc ghi sổ.
- `src/app/WorkspaceRenderer.tsx` — mount Founder Control vào CEO Command › Autonomous Command.

### Trạng thái build
- Full build pass: 356/356 tests.
- `npm run check:wiring` pass: wired=996, dead=0.
- Windows desktop đóng gói thành công: `release/win-unpacked/LedgerFlow Hub.exe` timestamp 2026-09-16 08:01.

### Lưu ý cho AI tiếp theo
- Bước Pha 1 tiếp theo có thể triển khai AI Workforce capability pack; giữ write operations ở approval gate.

**Codex (GPT-5.6) — 2026-09-16**

---

# AI Handoff Note

**AI Agent:** Codex (GPT-5.6)
**Ngày:** 2026-09-16
**Nhiệm vụ:** Hoàn thành Pha 0 của kế hoạch vận hành module.

### Files đã thay đổi
- `src/app/featureRegistry.ts` — mở rộng registry thành metadata thống nhất: capability pack, wiring state, risk và rollout flag.
- `src/modules/system-settings/FeatureRegistryPanel.tsx` — nâng thành Module Health Dashboard read-only, có lọc theo capability pack và hiển thị posture wiring/risk.
- `server/services/autonomousCompanyRobots.test.ts` — dùng customer ID duy nhất ở test churn, loại phụ thuộc vào dữ liệu runtime tồn tại từ lần test trước.

### Trạng thái build
- Full suite pass: 356/356 tests.
- `npm run check:wiring` pass: dead=0.
- Đã build bundle và đóng gói Windows: `release/win-unpacked/LedgerFlow Hub.exe` timestamp 2026-09-16 07:57.

### Lưu ý cho AI tiếp theo
- Pha tiếp theo: triển khai Founder Control capability pack trước, giữ mọi automation ở read-only/draft/approval-by-default.

**Codex (GPT-5.6) — 2026-09-16**

---

# AI Handoff Note

**AI Agent:** Codex (GPT-5.6)
**Ngày:** 2026-09-15
**Nhiệm vụ:** Rà soát và nối các Glacia web-automation service chưa có đường vào ứng dụng.

### Files đã thay đổi
- `server/services/robotAutomationRoutes.ts` — thêm endpoint observability, execution-plan và founder-triggered session preparation cho cross-system web automation.
- `src/utils/glaciaWebAgentApi.ts` — thêm API client có kiểm tra lỗi cho các endpoint điều phối mới.
- `src/components/glacia/GlaciaAutonomousResearchModal.tsx` — hiển thị thống kê accounts/HITL/monitor/Gemini Live, cùng thao tác lập kế hoạch và chuẩn bị phiên thủ công.

### Trạng thái build
- `npm run check:wiring` pass: `dead=0`, `wired=994`.
- Vite + hai backend bundle pass; `electron-builder --dir` pass và đã làm mới `release/win-unpacked/LedgerFlow Hub.exe`.
- `npm run build` vẫn dừng ở test dữ liệu không ổn định `autonomousCompanyRobots.test.ts` (`atRiskCount`), không do thay đổi wiring.

### Lưu ý cho AI tiếp theo
- 122 service có phân loại `dormant` đã được tích hợp qua `dormantServicesRouter`; đừng baseline/loại bỏ chúng chỉ để làm đẹp báo cáo.

**Codex (GPT-5.6) — 2026-09-15**

---

# AI Handoff Note

**AI Agent:** Codex (GPT-5.6)
**Ngày:** 2026-09-15
**Nhiệm vụ:** Khôi phục Windows desktop package bị thiếu backend runtime.

### Files đã thay đổi
- `server/services/glaciaYouTubeTranscriptBridge.ts` — bổ sung ba compatibility export (`fetchYouTubeTranscript`, `isYouTubeUrl`, `analyzeYouTubeVideoWithGemini`) mà route robot automation đã import; giữ nguyên API `fetchYoutubeTranscript` hiện hữu.

### Trạng thái build
- Frontend Vite + backend bundles (`dist/server.cjs`, `dist/assistant-daemon.cjs`) tạo thành công.
- `electron-builder --dir` pass; `release/win-unpacked/resources/app/dist/server.cjs` đã được xác nhận có mặt.
- `npm run check:wiring` hiện fail do 7 Glacia service có sẵn trong worktree chưa được nối, không liên quan thay đổi này.
- `npm run desktop:pack` bị chặn bởi một test không ổn định `autonomousCompanyRobots.test.ts` (atRiskCount); không liên quan lỗi package runtime.

### Lưu ý cho AI tiếp theo
- Chạy `release/win-unpacked/LedgerFlow Hub.exe` sau khi đóng hộp lỗi cũ; thông báo “dist/server.cjs was not found” phải hết.

**Codex (GPT-5.6) — 2026-09-15**

---

- `AGENTS.md` — Thêm warning banner đầu trang (3 tài liệu bắt buộc đọc), thêm Golden Rules section

### Trạng thái build
- [ ] Chưa chạy build (chỉ thay đổi tài liệu .md, không ảnh hưởng code)

### Lưu ý cho AI tiếp theo
- Đã thực hiện Phase 1 (P0) simplification một phần: GlaciaCompanion ✅, GlaciaCommandCockpit 🔄 (cần fix settings tab + build verify)
- AIAssistantPanel simplification ⏳ chưa bắt đầu
- Khi làm việc trên Glacia code, LUÔN đọc `docs/GLACIA_STANDARDS.md` trước
- Khi handoff cho AI khác, ghi note vào `docs/HANDOFF_LOG.md`

### AI Agent Signature
Claude 3.5 Sonnet (Cline) — 2026-08-26

---

> ⚠️ Hãy thêm ghi chép của bạn vào đầu danh sách (mới nhất ở trên).
# AI Handoff Note

**AI Agent:** Codex (GPT-5.6)  
**Ngày:** 2026-09-12  
**Nhiệm vụ:** Nâng Glacia orchestration thành robot có autonomy gate và audit trail kiểm chứng được.

### Files đã thay đổi
- `server/services/glaciaOrchestrationEngine.ts` — chặn quyền trước khi gọi công cụ và ghi cryptographic action ledger cho kết quả/bị chặn/lỗi.
- `server/services/connectorIntegrationRoutes.ts` — nối API orchestration (execute, parallel, DAG, metrics, queue, cancel) vào backend đã xác thực.
- `server/services/glaciaOrchestrationEngine.test.ts` — kiểm tra action ledger và integrity chain.

### Trạng thái build
- Build nền trước thay đổi: pass (356 tests).

### Lưu ý cho AI tiếp theo
- UI `GlaciaIntelligenceHub`/`glaciaOrchestrationApi` nay có backend route thực để gọi; không bỏ autonomy gate khi thêm task type mới—phải thêm mapping trong `AUTONOMY_ACTION_BY_TASK`.

**Codex (GPT-5.6) — 2026-09-12**

## AI Handoff Note — Trust & Audit Visibility

- `server/services/connectorIntegrationRoutes.ts` — thêm endpoint chỉ-đọc `GET /api/glacia/orchestrate/trust-report`, giới hạn kết quả 1–100.
- `src/utils/glaciaOrchestrationApi.ts` — thêm typed client cho trust report không chứa payload nhạy cảm.
- `src/components/glacia/GlaciaIntelligenceHub.tsx` — thêm tab Dev Tools “Trust & Audit”, hiển thị autonomy level, emergency lockout và integrity chain.

## AI Handoff Note — Cancellation Integrity

- `server/services/glaciaOrchestrationEngine.ts` — cancellation là trạng thái cuối; late result/error không thể biến task đã hủy thành completed/failed.
- `server/services/glaciaOrchestrationEngine.test.ts` — kiểm tra late response không thể “hồi sinh” robot task.

## AI Handoff Note — Orchestration Input Contract

- `server/services/connectorIntegrationRoutes.ts` — validate allowlist task type/priority, payload object, DAG id unique và dependency hợp lệ trước khi Glacia nhận việc.
# 2026-09-16 — Phase 2: AI Workforce live operations wired

- Connected the existing backend `GET /api/workforce/live-board` endpoint to the actual AI Workforce Command Center through `src/utils/aiWorkforceLiveBoardApi.ts` and `src/modules/ai-nhan-su/AIWorkforceLiveOperationsPanel.tsx`.
- The new panel exposes the current shift, active/quarantined employees, pending HITL approvals, employee activity, and recent Action Ledger records. It refreshes every 20 seconds and is explicitly read-only: it cannot launch a task, approve a request, or mutate external state.
- Mounted the panel at the top of `AIWorkforceCommandCenter.tsx`, so the backend service is no longer an unconsumed API surface.
# 2026-09-16 — Phase 2: HITL inbox uses the real approval gateway

- Replaced the sample approval cards in `HITLApprovalInboxPanel.tsx` with the canonical `GET /api/delegation/approvals` gateway and added `src/utils/hitlApprovalApi.ts` as the frontend boundary.
- Inbox decisions now use `POST /api/delegation/approval/respond`; failures remain visible and do not pretend that a decision was saved.
- Corrected the route to validate approved/rejected states and persist the approved owner identity plus reviewer note in the correct fields, so Action Ledger audit records accurately identify the decision maker.
# 2026-09-16 — Phase 3: approval resolution restricted to designated owner

- Locked `POST /api/delegation/approval/respond` to the authenticated owner account `davidbao1704@gmail.com`. Other signed-in roles may still inspect the inbox but receive an explicit 403 when attempting a high-risk decision.
- The resolved Action Ledger identity is now server-controlled rather than accepted from the client request body.
# 2026-09-16 — Phase 4: feature flag entitlement is real, not decorative

- `featureFlagsEntitlementEngine` now checks that a flag exists, the customer tier is entitled, and the deterministic rollout bucket is eligible; unknown flags and unentitled tiers are denied.
- `FeatureFlagsEntitlementPanel` now reads real engine data, shows real rollout cards, and does not fall back to a fabricated successful entitlement response.
- Added a regression assertion for a denied Starter-tier request to an Enterprise-only flag.

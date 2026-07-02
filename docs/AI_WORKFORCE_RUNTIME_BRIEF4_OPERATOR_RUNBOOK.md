# AI Workforce Runtime BRIEF4 - Runbook Van Hanh

## 1) Pham vi
Runbook nay mo ta quy trinh van hanh hang ngay cho bo kiem soat runtime BRIEF4/BRIEF5:
- Theo doi drift nhu health check cho mission queue, AgentRun va agentic loop visibility
- Theo doi diagnostics va cooldown cho browser fallback
- Xac minh snapshot suc khoe Gateway

## 2) Kiem tra truoc khi van hanh
Chay tu thu muc goc du an:

```bash
npm run lint
npm run check:runtime
```

Ket qua mong doi:
- CI safety gate pass
- Runtime smoke contracts pass

## 3) Theo doi Drift va Sua Drift
### Kiem tra drift report
- Endpoint: GET /api/ai-workforce/mission-execution-queue/drift
- Muc dich: doi chieu linked mission queue voi source runtime cua AgentRun, hien thi agenticLoopRuns va unified agent_execution_run snapshots trong cung report.

Cach doc ket qua:
- issueCount = 0: he thong on dinh
- criticalIssues > 0: can xu ly ngay
- checkedAgenticLoopRuns: so agentic loop run duoc dua vao health payload trong migration window
- agenticLoopRuns: danh sach runId/status/goal de operator thay duong thuc thi thu ba ma khong can drift patch rieng
- checkedRuntimeRunRecords: so unified agent_execution_run snapshots da doc tu runtime store
- runtimeRunRecords: danh sach recordId/runId/status/goal/surface de operator doi chieu AgentRun va agentic loop bang cung mot record type

### Sua drift
- Endpoint: POST /api/ai-workforce/mission-execution-queue/drift/repair
- Muc dich: tu dong sua cac mau drift da biet va luu lai link/snapshot da chinh. Sau BRIEF5, day la fallback sua lech, con mac dinh drift endpoint nen duoc doc nhu health check xac nhan issueCount = 0.

Quy trinh de xuat cho operator:
1. Goi drift check.
2. Neu issueCount = 0, ghi nhan health OK; khong can repair.
3. Neu co critical issues, goi drift repair mot lan.
4. Chay lai drift check.
5. Neu van critical, tam dung mission execution va escalate kem log/snapshot ID.

## 4) Van hanh Browser Fallback
### Chinh sach
Browser mode mac dinh la fallback-only.
Operator phai xac nhan da exhaust API fallback truoc khi chay browser run.

### Diagnostics
- Endpoint: GET /api/company-os/browser-sandbox/diagnostics
- Tin hieu can theo doi:
  - failures
  - reason
  - cooldownActive
  - disabledUntil

### Cach xu ly
1. Neu cooldownActive = true: khong force retry.
2. Cho den disabledUntil roi moi chay lai voi pham vi kiem soat.
3. Neu lap lai captcha/login challenge, uu tien quay ve API route hoac doi timing/profile.

## 5) Kiem tra Gateway Health Snapshot
- Endpoint: GET /api/gateway/health
- Payload mong doi:
  - providers: live health snapshot
  - stats: live gateway stats snapshot

Cach xu ly:
1. Neu preferred provider that bai lap lai, kiem tra key trong vault va kha nang ket noi provider.
2. Xac nhan fallback van route dung theo danh sach provider/model cho phep.
3. Ghi su co vao runtime log kem provider/model va timestamp.

## 6) Dieu kien kich hoat Incident
Escalate ngay khi xay ra mot trong cac truong hop sau:
- Drift repair khong xoa duoc critical issues.
- Browser cooldown bi kich hoat lap lai tren cung host.
- Gateway snapshot cho thay provider unavailable keo dai tren toan bo fallback candidates.

## 7) Xac minh sau su co
Chay:

```bash
npm run check:runtime
```

Sau do xac minh:
- Runtime dashboard tai duoc
- So luong drift issue giam xuong hoac ve 0
- Browser diagnostics khong con cooldown active tren host bi anh huong

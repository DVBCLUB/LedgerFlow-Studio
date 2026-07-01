# LedgerFlow Operations Index

Muc dich: mot diem vao duy nhat cho team van hanh khi gap su co, can release, hoac can doi chieu guardrails.

## CI / Runtime su co

- CI doctor va cach doc loi Actions: [CI_DOCTOR.md](CI_DOCTOR.md)
- Checklist triage CI tong quat: [CI_TRIAGE.md](CI_TRIAGE.md)
- Triage parity giua local va CI: [CI_TRIAGE_AND_LOCAL_BUILD_PARITY.md](CI_TRIAGE_AND_LOCAL_BUILD_PARITY.md)
- Huong dan xu ly cac kieu fail pho bien: [CI_FAILURE_GUIDE.md](CI_FAILURE_GUIDE.md)

## AI Workforce / BRIEF4 Runtime

- Van hanh drift, repair, browser fallback, gateway health: [AI_WORKFORCE_RUNTIME_BRIEF4_OPERATOR_RUNBOOK.md](AI_WORKFORCE_RUNTIME_BRIEF4_OPERATOR_RUNBOOK.md)
- Deploy/rollback checklist BRIEF4: [BRIEF4_DEPLOY_ROLLBACK_CHECKLIST.md](BRIEF4_DEPLOY_ROLLBACK_CHECKLIST.md)

## Release / Packaging

- Release readiness cho nguoi dung cuoi Windows: [RELEASE_READINESS_CHECKLIST.md](RELEASE_READINESS_CHECKLIST.md)
- Release guard bat buoc truoc merge/deploy: [RELEASE_GUARD_CHECKLIST.md](RELEASE_GUARD_CHECKLIST.md)
- Phan biet source ZIP va Windows setup: [RELEASE_PACKAGE_NOTE.md](RELEASE_PACKAGE_NOTE.md)
- Checklist icon Windows: [WINDOWS_ICON_CHECKLIST.md](WINDOWS_ICON_CHECKLIST.md)
- Huong dan desktop release tong quat: [DESKTOP_RELEASE_GUIDE.md](DESKTOP_RELEASE_GUIDE.md)

## Merge Gate / Policy

- Risk-aware merge policy va enforcement vars: [GREEN_MERGE_POLICY.md](GREEN_MERGE_POLICY.md)

## AI Gateway / Integration / Security

- AI Gateway fallback, vault, diagnostics: [AI_GATEWAY.md](AI_GATEWAY.md)
- Integration Hub va connector model: [INTEGRATION_HUB.md](INTEGRATION_HUB.md)
- Auto-push security model va approval flow: [AI_OPS_AUTOPUSH_SECURITY.md](AI_OPS_AUTOPUSH_SECURITY.md)
- Company OS guardrails: [COMPANY_OS_GUARDRAILS.md](COMPANY_OS_GUARDRAILS.md)
- OpenClaw parity hardening: [OPENCLAW_PARITY_HARDENING.md](OPENCLAW_PARITY_HARDENING.md)

## Nguon script check chinh

- Risk-aware gate planner: scripts/check-pr-readiness.mjs
- Runtime API smoke: scripts/check-runtime-api.mjs
- AI Workforce runtime route smoke: scripts/check-ai-workforce-runtime-routes.mjs
- Mission queue contract check: scripts/check-ai-workforce-mission-execution-queue.mjs
- Docs ops style check: scripts/check-docs-ops-style.mjs

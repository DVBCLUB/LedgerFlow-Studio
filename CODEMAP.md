# LedgerFlow Studio - AI Code Map

Muc tieu: bat ky AI nao (Gemini, ChatGPT, Claude Code, Copilot) vao repo nay deu biet dat code dung cho, sua dung lop, va giam loi khi code truc tiep tren GitHub.

## 1) Diem vao dau tien

Doc theo thu tu:

1. AGENTS.md
2. docs/PROJECT_STRUCTURE.md
3. docs/AI_AGENT_PLAYBOOK.md
4. CONTRIBUTING.md

Neu mau thuan, uu tien theo thu tu tren.

## 2) Quick placement matrix (them tinh nang o dau)

| Neu ban can... | Frontend | Backend | Doc can cap nhat |
|---|---|---|---|
| Them workspace/module company OS | src/modules/<domain>/ | server/services/<domain>Service.ts (neu can API) | docs/PROJECT_STRUCTURE.md |
| Them panel giao dien lon (overlay/tool) | src/components/<Feature>.tsx + src/components/<Feature>Launcher.tsx | Khong bat buoc | docs/PROJECT_STRUCTURE.md |
| Them API client cho frontend | src/utils/<domain>Api.ts | Route trong server.ts + logic trong server/services/ | docs/ARCHITECTURE.md hoac doc module |
| Them AI provider / AI Gateway | src/components/AISettingsManager.tsx, src/utils/aiSettingsApi.ts | server/services/aiRouter.ts, aiClient.ts, aiKeyVault.ts | docs/AI_GATEWAY.md |
| Them connector nen tang | src/components/<Platform>ConnectorPanel.tsx, src/utils/integrationHubApi.ts | server/services/<platform>Connector.ts, integrationRegistry.ts | docs/INTEGRATION_HUB.md |
| Them AgentOps tab/chuc nang | src/components/agent-ops/tabs/ | server/services/ (neu can) | docs/AGENTOPS_HUB_CONSOLIDATION.md |
| Sua dong goi desktop | desktop/main.cjs | scripts/prepare-desktop-icons.mjs + package.json build config | docs/CI_DOCTOR.md + docs/PROJECT_STRUCTURE.md |

## 3) Quy tac dat file

- Khong dat business logic lon trong server.ts. Tach vao server/services/.
- Khong goi provider AI truc tiep tu UI. UI -> src/utils/*Api.ts -> backend API -> server/services/.
- Khong dat code module moi vao src/App.tsx.
- Khong hard-code secret, token, URL private trong frontend hoac docs.
- Moi thay doi user-visible nen cap nhat toi thieu 1 file docs lien quan.

## 4) Quy trinh code truc tiep tren GitHub (an toan)

1. Chia PR nho theo 1 muc tieu ro rang.
2. Sua toi thieu so file can thiet (smallest safe change).
3. Chay check truoc push:

```bash
npm run lint
npm run build
```

4. Neu dong vao desktop/packaging, chay them:

```bash
npm run prepare:icons
npm run check:desktop
```

5. Neu can don file runtime o root, chay:

```bash
npm run runtime:migrate
```

6. Kiem tra codemap discipline nhanh:

```bash
npm run check:codemap
```

7. Truoc merge PR tren GitHub (tat ca AI platforms), theo policy:

```text
docs/GREEN_MERGE_POLICY.md
```

5. Dien day du PR template (Validation + Risk/Rollback + Security checklist).

## 5) Definition of done cho AI

- Dat code dung folder theo matrix.
- Khong pha vo route/module ID cu neu chua co migration.
- Co ghi chu validation ro rang trong PR.
- Co rollback note neu dong vao auth, persistence, connector, import/export, desktop.

## 6) Khong duoc lam

- Khong rebuild toan bo repo.
- Khong doi ngon ngu san pham thanh construction-only.
- Khong them terminal execution khong kiem soat.
- Khong bypass CI de cho pass tam thoi.

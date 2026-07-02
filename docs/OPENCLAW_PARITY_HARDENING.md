# OpenClaw Parity Hardening

Nhanh nay tang cuong LedgerFlow AI Workforce theo mo hinh tro ly tu hanh local kieu OpenClaw, dong thoi van giu safety rules uu tien founder.

## 1. Tool schema sync

`npm run ai:patch-daemon-tools` patch `server/assistant-daemon.ts` de mission creation validate `requestedTools` theo source of truth chung `AGENT_TOOL_IDS`. `npm run check:agent-tool-ids` hien xem daemon schema drift la loi chan (blocking error).

## 2. Telegram / mobile parity

`server/services/telegramMissionCommands.ts` da dinh nghia command surface cho founder tren mobile:

- `/mission create "goal"`
- `/mission status latest`
- `/mission advance latest`
- `/mission approvals`
- `/mission approve <runId> <stepId> <fingerprint>`
- `/mission reject <runId> <stepId> [fingerprint] [reason]`
- `/mission stop <runId>`
- `/mission artifact latest`
- `/robot capabilities`
- `/automation scheduler status`
- `/ai emergency-stop on|off`

`npm run ai:patch-telegram-missions` noi command router vao `telegramBot.ts` truoc cac buoc dev/lint/build.

## 3. Plugin boundary

Plugin system van la vung rui ro cao nhat cua OpenClaw parity. Runtime host-side plugin invocation phai tiep tuc bi chan, tru khi mot signed adapter tuong lai chung minh du tat ca gate sau:

- signed manifest
- sandbox mode enabled
- approved permission scopes
- entry point nam trong dung plugin folder
- co audit event cho moi lan invocation attempt

## 4. Reviewed patch sessions

Patch review routes duoc noi boi `npm run ai:patch-patch-review-routes`. Luong ky vong:

1. agent tao `draft_patch` artifact
2. founder tao/review patch session tu run
3. session chuyen sang `approved_to_apply`
4. apply bat buoc dung exact phrase `APPLY REVIEWED PATCH`
5. rollback bat buoc dung exact phrase `ROLLBACK REVIEWED PATCH`

## 5. Local daemon hardening

`server/services/daemonLocalGuard.ts` bo sung local-first request guard. Daemon mac dinh tu choi request khong phai local va co the bat buoc authenticated local principal khi `LEDGERFLOW_DAEMON_AUTH_REQUIRED=true`.

## Build integration

Nhung script sau hien chay patchers truoc cac buoc dev/release checks:

- `predev`
- `prelint`
- `prebuild`

Dieu nay giu file daemon lon duoc generate nhat quan, dong thoi de cac boundary nho lien quan safety duoc review ro rang trong source control.

# OpenClaw Parity Hardening

This branch tightens LedgerFlow AI Workforce toward the OpenClaw-style local autonomous assistant model while keeping LedgerFlow founder-first safety rules.

## 1. Tool schema sync

`npm run ai:patch-daemon-tools` patches `server/assistant-daemon.ts` so mission creation validates `requestedTools` through the shared `AGENT_TOOL_IDS` source of truth. `npm run check:agent-tool-ids` now treats daemon schema drift as a blocking error.

## 2. Telegram / mobile parity

`server/services/telegramMissionCommands.ts` already defines the founder mobile command surface:

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

`npm run ai:patch-telegram-missions` wires that command router into `telegramBot.ts` before dev/lint/build.

## 3. Plugin boundary

The plugin system remains the highest-risk OpenClaw parity area. Runtime host-side plugin invocation must remain blocked unless a future signed adapter proves all of these gates:

- signed manifest
- sandbox mode enabled
- approved permission scopes
- entry point stays inside its plugin folder
- audit event for every invocation attempt

## 4. Reviewed patch sessions

Patch review routes are wired by `npm run ai:patch-patch-review-routes`. The intended flow is:

1. agent creates `draft_patch` artifact
2. founder creates/reviews patch session from run
3. session moves to `approved_to_apply`
4. apply requires exact phrase `APPLY REVIEWED PATCH`
5. rollback requires exact phrase `ROLLBACK REVIEWED PATCH`

## 5. Local daemon hardening

`server/services/daemonLocalGuard.ts` adds a local-first request guard. The daemon rejects non-local requests by default and can require an authenticated local principal when `LEDGERFLOW_DAEMON_AUTH_REQUIRED=true`.

## Build integration

The following scripts now run patchers before developer and release checks:

- `predev`
- `prelint`
- `prebuild`

This keeps the large daemon file generated consistently while making the smaller safety boundaries reviewable in source control.

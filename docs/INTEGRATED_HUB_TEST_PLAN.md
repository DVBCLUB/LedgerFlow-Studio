# Integrated Hub Test Plan

This plan verifies that the scattered backend capabilities are reachable through the consolidated desktop hubs.

## 1. Prebuild contract

Run first after pulling from GitHub:

```bash
npm run check:ai-desktop-integration
```

Expected result:

```text
All AI desktop integration contract checks passed.
```

This validates that key daemon routes, desktop daemon startup, hub components, navigation labels, and hub-directory documentation are present.

## 2. Build and package

```bash
npm run build
npm run desktop:pack
```

Expected result:

- Vite build completes.
- `dist/server.cjs` exists.
- `dist/assistant-daemon.cjs` exists.
- Electron package step completes without missing-file errors.

## 3. Desktop smoke test

Launch the packaged app or local desktop run and verify both servers are available:

- Main app loads.
- Assistant daemon-backed panels do not show a global daemon connection error.
- API health matrix can reach both main API and assistant daemon routes.

## 4. Hub-by-hub UI checklist

### AI Command Center

Location: `AI Workforce & Labs → AI Command Center`

Verify:

- Agent runtime metrics card loads.
- Recent agent runs list renders even if empty.
- Agent roles list renders.
- Memory context search works or shows empty state.
- AI Governance & Quality panel appears below the command center.
- AI emergency stop buttons are visible and explicit.

Routes covered:

- `/api/status`
- `/api/roles`
- `/api/agent-runtime/metrics`
- `/api/agent-runtime/runs`
- `/api/agent-runtime/emergency-stop`
- `/api/ai-fabric/health`
- `/api/control-plane/runs`
- `/api/intent/classify`
- `/api/validate`
- `/api/explain/traces`
- `/api/finetune/pairs`
- `/api/telemetry/metrics`

### Automation & Robot Control

Location: `AI Workforce & Labs → Automation & Robot Control`

Verify:

- Robot simulation status loads.
- Robot emergency stop controls are visible.
- Automation rules and logs render.
- Agent workflows render.
- Event streams and notification events render.
- Automation Bridge panel appears below with webhooks, tools, swarm and telemetry.

Routes covered:

- `/api/robot-simulation/status`
- `/api/robot-simulation/emergency-stop`
- `/api/automation-rules`
- `/api/automation-rules/logs`
- `/api/agent-workflows`
- `/api/streams/pipelines`
- `/api/notify/events`
- `/api/webhooks/rules`
- `/api/tools`
- `/api/swarm/agents`
- `/api/telemetry/latest`

### Knowledge & Content Studio

Location: `AI Workforce & Labs → Knowledge & Content Studio`

Verify:

- Memory search input is visible.
- Vector namespace panel renders.
- Prompt templates and prompt runs render.
- Content assets and knowledge base results render.
- Document intelligence action requires an explicit file path.
- Raw JSON drawer can open and close.

Routes covered:

- `/api/agent-memory/search`
- `/api/vectors/namespaces`
- `/api/vectors/search`
- `/api/document/structure`
- `/api/prompts/templates`
- `/api/prompts/runs`
- `/api/content/assets`
- `/api/kb/search`
- `/api/context/windows`

### DevOps & Release Center

Location: `System Settings → DevOps & Release Center`

Verify:

- Git status loads.
- CI Doctor section renders even with no recent run.
- Deploy configs/runs render.
- Snapshots render.
- Developer Intelligence panel appears below with architecture, tests, docs, review and refactor.

Routes covered:

- `/api/git/status`
- `/api/git/diff`
- `/api/git/commit-msg`
- `/api/ci-doctor/context`
- `/api/deploy/configs`
- `/api/deploy/runs`
- `/api/snapshot`
- `/api/architecture/graphs`
- `/api/testgen/suites`
- `/api/docs`
- `/api/review/runs`
- `/api/refactor/scan`

### Security & System Health

Location: `System Settings → Security & System Health`

Verify:

- System overview snapshot renders.
- Plugin registry renders.
- Config drift, dependency, SAST, log analysis and performance sections render.
- Risk queue count does not crash when lists are empty.
- Raw JSON drawer can open and close.

Routes covered:

- `/api/system/overview`
- `/api/plugins`
- `/api/drift/reports`
- `/api/deps/reports`
- `/api/sast/reports`
- `/api/logs/analyses`
- `/api/perf/profiles`

### Config Health / Platform Services

Location: `System Settings → Config Health`

Verify:

- System Overview panel renders.
- Platform Services panel appears below.
- Background job queue renders.
- OpenAPI route map renders and Save Spec button is explicit.
- AI gateway providers/configs render.
- Timeline generator and robot draft generator are explicit actions.

Routes covered:

- `/api/system/overview`
- `/api/jobs`
- `/api/openapi/routes`
- `/api/openapi/save`
- `/api/gateway/health`
- `/api/gateway/configs`
- `/api/timeline`
- `/api/timeline/generate`
- `/api/robot/generate`

## 5. Failure handling checks

Temporarily stop the assistant daemon or block port 3001. Expected:

- Hub panels should show a clear daemon/backend error.
- The app shell should remain usable.
- One failed route should not blank an entire hub where `Promise.allSettled` is used.

## 6. Release gate

A build is acceptable for packaging only when:

- Contract check passes.
- Build passes.
- Desktop app opens.
- At least the five primary hub tabs render.
- Emergency-stop controls are visible in AI and Robot areas.
- No dashboard crashes on empty datasets.

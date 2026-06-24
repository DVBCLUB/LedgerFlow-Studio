# LedgerFlow UI Integration Blueprint

Goal: bring scattered AI/robot/automation/devops/security services into the desktop app without turning the UI into a wall of tabs.

## Design principles

1. Fewer top-level destinations. Group backend services into clear work centers instead of one tab per service.
2. Progressive disclosure. Show status cards first, then details/actions only when the founder opens a card.
3. Safe-by-default actions. Read-only status loads automatically; destructive or external actions require explicit buttons and visible risk labels.
4. Daemon-backed data. Desktop UI should call the assistant daemon through `daemonFetch`, not direct public APIs or stale localStorage-only mock data.
5. Founder language. Screens should answer: what is healthy, what needs attention, what can I do next?

## Proposed work centers

### 1. AI Command Center

Purpose: daily operating cockpit for all AI agents.

Includes:
- AI Operations metrics and recent runs
- Agent roles
- Emergency stop state
- Agent memory/RAG health
- Prompt library quick links
- Cost/telemetry summary

Primary UI pattern:
- 4 KPI cards at top
- Recent runs timeline
- Agent role grid
- Search memory/prompt quick box

Existing routes/services:
- `/api/agent-runtime/metrics`
- `/api/agent-runtime/runs`
- `/api/agent-runtime/emergency-stop`
- `/api/agent-memory/search`
- `/api/prompts/templates`
- `/api/prompts/runs`
- `/api/telemetry/*` where available

Current status:
- Partly integrated through AI Operations Center and Project Memory/RAG.

### 2. Automation & Robot Control

Purpose: one safe control room for automation rules, robot simulation, workflows, RPA, event streams, and notifications.

Includes:
- Robot simulator state and command console
- Automation rules list and execution log
- Workflow templates/runs
- Event stream pipelines/events
- Notification templates/events

Primary UI pattern:
- Safety banner with emergency status
- Left column: active automation/workflow cards
- Right column: recent execution/event log
- Action buttons grouped by risk: low-risk refresh/create draft, high-risk run/stop separated

Existing routes/services:
- `/api/robot-simulation/status`
- `/api/robot-simulation/command`
- `/api/automation-rules`
- `/api/automation-rules/logs`
- `/api/agent-workflows`
- `/api/streams/pipelines`
- `/api/streams/events`
- `/api/notify/templates`
- `/api/notify/events`

Current status:
- Robot Lab and Automation Rules are integrated.
- Workflow/Event/Notification UI should be grouped into this work center next.

### 3. Knowledge & Content Studio

Purpose: make all knowledge, documents, prompt, vector, content and contextual help services visible in one clean place.

Includes:
- Project memory/RAG search
- Vector namespaces/search
- Document intelligence
- Prompt library
- Content generation assets
- Knowledge base articles
- Context windows

Primary UI pattern:
- Search-first interface
- Tabs inside the panel: Memory, Documents, Prompts, Content, Context
- Add reviewed memory/content buttons
- Read-only raw detail drawer for debugging

Existing routes/services:
- `/api/agent-memory/search`
- `/api/vectors/namespaces`
- `/api/vectors/search`
- `/api/document/analyze`
- `/api/prompts/templates`
- `/api/content/assets`
- `/api/kb/articles`
- `/api/context/windows`

Current status:
- Memory/RAG search is integrated.
- Document/Prompt/Content/KB/Context should be merged here next.

### 4. DevOps & Release Center

Purpose: one practical release cockpit for git, CI, build, release, deploy, rollback, snapshots.

Includes:
- Git Assistant: status, diff, commit/PR text
- CI Doctor: failed workflow diagnosis
- Release artifacts
- Deploy configs/runs
- Snapshot/restore list
- Build/package checks

Primary UI pattern:
- Release pipeline board: Code → CI → Artifact → Deploy → Rollback
- Git/CI cards at top
- Release/deploy history list
- Copyable handoff prompts

Existing routes/services:
- `/api/git/status`
- `/api/git/diff`
- `/api/git/commit-msg`
- `/api/ci-doctor/context`
- `/api/ci-doctor/analyze`
- `/api/deploy/configs`
- `/api/deploy/runs`
- `/api/snapshot`

Current status:
- Git Assistant and CI Doctor are integrated.
- Deploy/Snapshot/Release should be merged into this work center next.

### 5. Security & System Health

Purpose: one place to verify app safety, plugin health, drift, dependencies, logs and SAST.

Includes:
- System overview
- API connection health matrix
- Plugin registry
- Config drift reports
- Dependency reports
- SAST reports
- Log analyses
- Performance profiles

Primary UI pattern:
- Health matrix with green/yellow/red cards
- Risk queue sorted by severity
- Scan buttons separated from destructive fixes
- Raw JSON drawer for technical troubleshooting

Existing routes/services:
- `/api/system/overview`
- `/api/plugins`
- `/api/drift/reports`
- `/api/deps/reports`
- `/api/sast/reports`
- `/api/logs/analyses`
- `/api/perf/profiles`

Current status:
- System overview and API health matrix are integrated.
- Plugin/SAST/Drift/Deps/Logs/Perf should be merged here next.

## Navigation changes

Keep current top-level workspaces:
- CEO Command Center
- Product Studio
- Growth & Sales
- Finance & Accounting
- AI Workforce & Labs
- System Settings

Do not add new top-level workspaces.

Inside existing workspaces, reduce clutter by mapping service clusters to the following sub-tabs:

AI Workforce & Labs:
- AI Command Center
- Automation & Robot Control
- Knowledge & Content Studio
- Prompt/Quality Labs

System Settings:
- System Health
- DevOps & Release Center
- Security & Governance
- Integrations

## Implementation order

1. Keep existing integrated panels stable.
2. Add compact hub panels that aggregate multiple daemon routes read-only first.
3. Replace older localStorage-only panels with daemon-backed hub panels only when the hub covers the same use case.
4. Add create/run actions after read-only dashboards are stable.
5. Extend `scripts/check-ai-desktop-integration.mjs` for every new hub route and UI file.

## Next coding targets

1. Build `DevOpsReleaseHubPanel` and connect it to Release Artifacts or Dev Handoff.
2. Build `SecuritySystemHubPanel` and connect it to Security Control or Config Health.
3. Build `KnowledgeContentHubPanel` and connect it to Project Memory Log after preserving Memory/RAG.
4. Build `AutomationRobotHubPanel` and merge robot/rules/workflows/events/notifications into one screen.

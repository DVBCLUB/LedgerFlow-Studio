# Integrated Hub Release Notes

## Scope

This release consolidates many scattered LedgerFlow daemon and desktop modules into a smaller set of user-facing hubs. The goal is a cleaner desktop experience: fewer small disconnected panels, clearer navigation, and stronger prebuild contracts.

## New / consolidated hubs

### AI Command Center

Location: `AI Workforce & Labs → AI Command Center`

Adds a central surface for:

- Agent runtime metrics
- Recent agent runs
- AI emergency stop
- Safe agent run creation
- Agent roles
- Memory/RAG context
- AI Fabric health
- Control Plane runs

### AI Governance & Quality

Location: below AI Command Center

Adds quality and safety controls for:

- Intent classification
- Output validation
- Validation rules
- Decision explainability traces
- Fine-tuning pairs and datasets
- Telemetry snapshots and metrics

### Automation & Robot Control

Location: `AI Workforce & Labs → Automation & Robot Control`

Adds a central surface for:

- Robot simulation safety
- Robot emergency stop
- Automation rules
- Automation logs
- Agent workflows
- Event streams
- Notification engine

### Automation Bridge

Location: below Automation & Robot Control

Adds visibility into external automation surfaces:

- Webhook rules
- Webhook events
- Tool router definitions
- Swarm agents
- Swarm missions
- Telemetry

### Knowledge & Content Studio

Location: `AI Workforce & Labs → Knowledge & Content Studio`

Adds a search-first knowledge surface for:

- Agent memory search
- Vector namespaces
- Vector search
- Document structure/intelligence
- Prompt templates
- Prompt runs
- Content assets
- Knowledge base search
- Context windows

### DevOps & Release Center

Location: `System Settings → DevOps & Release Center`

Adds a release and CI surface for:

- Git status
- Git diff
- Commit message generation
- CI Doctor context/analyze
- Deploy configs
- Deploy runs
- Snapshots

### Developer Intelligence

Location: below DevOps & Release Center

Adds developer support tools for:

- Architecture graph generation
- API test suite generation
- Documentation generation
- Code review queue
- Refactor scan

### Security & System Health

Location: `System Settings → Security & System Health`

Adds a security and runtime health surface for:

- System overview
- Plugin registry
- Config drift reports
- Dependency reports
- SAST reports
- Log analyses
- Performance profiles

### Platform Services

Location: `System Settings → Config Health`

Adds daemon platform visibility for:

- Background jobs
- OpenAPI route map
- OpenAPI spec save action
- AI model gateway health
- AI gateway configs
- Project timelines
- Robot script generator drafts

## Navigation changes

The UI now shows hub names in subnavigation while preserving old route IDs for compatibility.

| Old tab | New visible label |
| --- | --- |
| AI Operations Center | AI Command Center |
| Automation Rules | Automation & Robot Control |
| Project Memory Log | Knowledge & Content Studio |
| Release Artifacts | DevOps & Release Center |
| Security Control | Security & System Health |

## Build and integration safeguards

Added/updated:

- `scripts/check-ai-desktop-integration.mjs`
- `.github/workflows/ledgerflow-build.yml`
- `server/assistant-daemon-desktop.ts`
- `docs/INTEGRATED_HUB_DIRECTORY.md`
- `docs/INTEGRATED_HUB_TEST_PLAN.md`

The integration contract checks:

- desktop daemon wrapper exists
- assistant daemon start export exists
- required daemon routes exist
- hub components call expected routes
- legacy assistant API exports remain available
- navigation labels expose hub names
- hub documentation and test plan exist

## Safety notes

This integration pass prioritizes safe visibility and explicit actions:

- dashboards are mostly read-only
- dangerous actions remain explicit buttons
- emergency stop is visible in AI and Robot control areas
- route failures should show panel-level errors instead of crashing the app shell
- local build/test is still required before packaging a production installer

## Recommended local validation

```bash
git pull origin main
npm run check:ai-desktop-integration
npm run build
npm run desktop:pack
```

Then follow `docs/INTEGRATED_HUB_TEST_PLAN.md` for manual smoke testing.

## Known limitations

- GitHub status checks may not appear for direct pushes if no workflow is triggered or if the connector only surfaces PR-triggered runs.
- Some dashboard data may be empty until local daemon storage has records.
- Some generator actions create drafts/reports and still need manual review before applying any risky changes.

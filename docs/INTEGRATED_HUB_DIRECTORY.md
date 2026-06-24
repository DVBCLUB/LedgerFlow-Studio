# LedgerFlow Integrated Hub Directory

This directory explains where the formerly scattered AI, automation, DevOps, security, platform, and knowledge modules now live in the desktop app.

## Primary user-facing hubs

| Hub | App location | Main purpose | Integrated modules/routes |
| --- | --- | --- | --- |
| AI Command Center | AI Workforce & Labs → AI Command Center | Command and supervise AI agents | Agent Runtime, Roles, AI Fabric, Control Plane, Memory context |
| AI Governance & Quality | AI Workforce & Labs → AI Command Center | Validate and audit AI behavior | Intent Classifier, Output Validator, Explainability, Fine-tuning Data, Telemetry |
| Automation & Robot Control | AI Workforce & Labs → Automation & Robot Control | Operate automation and robot workflows | Robot Simulation, Automation Rules, Agent Workflows, Streams, Notification Engine |
| Automation Bridge | AI Workforce & Labs → Automation & Robot Control | Monitor external automation entry points | Webhooks, Tool Router, Swarm, Telemetry |
| Knowledge & Content Studio | AI Workforce & Labs → Knowledge & Content Studio | Search and curate knowledge/content | Agent Memory, Vector Store, Document Intelligence, Prompt Library, Content Assets, KB, Context Windows |
| DevOps & Release Center | System Settings → DevOps & Release Center | Build, CI, release, deploy, rollback | Git Assistant, CI Doctor, Deploy Manager, Snapshots |
| Developer Intelligence | System Settings → DevOps & Release Center | Developer-support intelligence | Architecture Visualizer, API Test Generator, Docs Generator, Code Review Queue, Refactor Scanner |
| Security & System Health | System Settings → Security & System Health | Security and runtime health | Plugins, SAST, Dependency Reports, Config Drift, Logs, Performance Profiles |
| Platform Services | System Settings → Config Health | Core daemon platform visibility | Background Jobs, OpenAPI, AI Gateway, Project Timeline, Robot Script Generator |

## Navigation compatibility

The old route IDs are intentionally preserved so existing URL hashes and internal navigation keep working.

| Old route id | Old label | New displayed hub label |
| --- | --- | --- |
| `ai_ops` | AI Operations Center | AI Command Center |
| `automation_rules` | Automation Rules | Automation & Robot Control |
| `project_memory` | Project Memory Log | Knowledge & Content Studio |
| `release_artifact` | Release Artifacts | DevOps & Release Center |
| `security` | Security Control | Security & System Health |

## Safety model

The first integration pass favors read-only dashboards and review-first actions.

- Read-only dashboards use daemon routes and `Promise.allSettled` where possible so one failing subsystem does not blank the whole hub.
- Risky actions remain explicit buttons, not background auto-runs.
- Emergency-stop controls are kept visible in AI and Robot control surfaces.
- `scripts/check-ai-desktop-integration.mjs` guards the route-to-UI integration contract during prebuild.

## Pulling this into local

When this milestone is ready to test locally, pull once from GitHub:

```bash
git pull origin main
npm run check:ai-desktop-integration
npm run build
npm run desktop:pack
```

Do not run these after every small commit unless actively debugging local build output.

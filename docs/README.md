# LedgerFlow Studio Documentation

This folder contains architecture notes, runbooks, and operating guides for LedgerFlow Studio.

## Start here

Read these first:

```text
../AGENTS.md
PROJECT_STRUCTURE.md
AI_AGENT_PLAYBOOK.md
```

## Core architecture docs

| Document | Purpose |
|---|---|
| `PROJECT_STRUCTURE.md` | Folder map, module boundaries, recommended patterns |
| `AI_AGENT_PLAYBOOK.md` | Rules for AI coding agents and human maintainers |
| `AI_GATEWAY.md` | AI Gateway, provider fallback, vault, diagnostics |
| `INTEGRATION_HUB.md` | Connector registry, platform hub, local tools, GitHub connector |
| `CI_DOCTOR.md` | GitHub Actions failure analysis workflow |
| `DESKTOP_RELEASE_GUIDE.md` | Canonical Windows build, download, and release guide |

## Product direction

LedgerFlow Studio is moving toward a small-company operating hub:

```text
Accounting workflows
AI Gateway
Integration Hub
GitHub / VS Code / Cursor handoff
CI Doctor
Local tool coordination
Document and evidence management
Automation connectors
```

## Documentation rules

When adding a new important module, add or update a document here.

Suggested future structure:

```text
docs/modules/accounting.md
docs/modules/document-vault.md
docs/modules/google-workspace.md
docs/modules/import-export.md
docs/runbooks/windows-desktop-build.md
docs/runbooks/runtime-testing.md
```

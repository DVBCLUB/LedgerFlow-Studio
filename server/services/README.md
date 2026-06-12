# Backend Services

This folder contains backend domain services used by `server.ts`.

Keep business and connector logic here instead of growing route handlers directly in `server.ts`.

## Current service groups

| Group | Files | Purpose |
|---|---|---|
| AI Gateway | `aiClient.ts`, `aiRouter.ts`, `aiKeyVault.ts`, `aiDoctor.ts`, `aiUsageLog.ts`, `aiVaultAutoLock.ts` | Multi-provider AI fallback, encrypted key vault, diagnostics, usage logs |
| Integration Hub | `integrationRegistry.ts` | Connector registry, status, enabled flags, event log |
| GitHub | `githubConnector.ts` | Repo summary, Actions runs, issues, PRs, issue creation |
| Local tools | `localToolConnector.ts` | Safe detection/opening of VS Code, Cursor, GitHub, Actions |

## Add a new backend connector

Use this pattern:

```text
server/services/<platform>Connector.ts
```

Expected functions:

```ts
get<Platform>Summary()
test<Platform>Connection()
```

For write actions, use explicit names:

```ts
create<Platform>Thing()
update<Platform>Thing()
```

## Security rules

- Do not expose raw secrets to frontend.
- Prefer local environment variables, encrypted vaults, or OS credential stores for secrets.
- Read/test/status actions are safer than write actions.
- Write actions must be explicit and user-triggered.
- No arbitrary shell execution in connector services.

## Route wiring

Routes live in `server.ts`. For large route groups, keep route handlers thin and delegate to service functions in this folder.

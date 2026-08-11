# MCP Control Plane

LedgerFlow exposes its internal MCP tool catalog through an authenticated local control plane. It is designed for a desktop/local-first deployment and must not be exposed publicly without an API gateway, TLS, and an identity provider.

## Endpoints

All endpoints below require a valid LedgerFlow local session or configured server-side bearer token.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/mcp/catalog` | Export the signed tool-manifest catalog and current health summary. |
| `POST /api/mcp` | Authenticated JSON-RPC 2.0 boundary for `initialize`, `ping`, `tools/list`, and `tools/call`. |
| `POST /api/mcp/approvals` | Issue a short-lived, one-time token for a reviewed MCP preview fingerprint. |
| `POST /api/mcp/messages` | Legacy JSON-RPC compatibility endpoint. |
| `GET /api/mcp/events` | Existing authenticated SSE event stream for MCP activity. |
| `GET /api/mcp/external/servers` | Inspect configured external MCP server definitions. |
| `POST /api/mcp/external/probe` | Perform a read-only real HTTP MCP `initialize` + `tools/list` handshake. |
| `GET /api/mcp/external/config` | List persisted external MCP endpoint configurations. |
| `PUT /api/mcp/external/config/:id` | Persist a non-secret external MCP endpoint configuration. |

`POST /api/mcp` accepts an optional `X-Correlation-Id`. The server creates one when absent, returns it in the response, and writes it to the operational audit trail. Tool-call health signals persist locally in `runtime/mcp_tool_run_signals.local.json` (or the server-side `MCP_TOOL_RUN_STORE_FILE` override); catalog health is calculated from those persisted signals.

## Execution contract

The transport does not grant a model unrestricted execution. Every tool is resolved through the manifest registry:

1. Tool permission, risk tier, timeout, retry budget, and credential requirement are loaded.
2. The automation safety envelope validates allowed targets and any human checkpoint.
3. High-risk operations produce a fingerprint-bound, single-use approval requirement.
4. The request outcome is auditable with a correlation ID.

Approval authorizes only the reviewed, fingerprint-matched request. It does not imply that an external connector completed successfully.

Before a future write adapter sends an external request, it must claim an idempotency key bound to the reviewed fingerprint in `runtime/mcp_external_execution_ledger.local.json`, then record the remote result or failure. Reusing that key with different reviewed input is blocked.

For a high-risk `tools/call`, first retain the returned `previewId` and `fingerprint`, approve them through `/api/mcp/approvals`, then repeat the same request with `previewId` and `approvalToken`. Any change to title, target, payload, or execution mode invalidates the preview.

## External MCP connectors

The current external-server screen is an integration catalog and safety contract. `POST /api/mcp/external/probe` and `POST /api/mcp/external/connect` support a real, read-only HTTP handshake for a configured `streamable-http` endpoint. It accepts no credentials from the client and only connects to `localhost`, `127.0.0.1`, or `::1` by default. A server owner can explicitly extend this list with `MCP_EXTERNAL_ALLOWED_HOSTS=host-a,host-b`. The old synchronous gateway is disabled. Legacy SSE/stdio catalog entries remain `planned` until their dedicated adapters are installed; they are never reported as connected by a mock handshake.

Do not treat a listed server as a live write connector until a transport-specific adapter has completed a real handshake, authenticated using scoped credentials in the server-side vault, and recorded a successful health signal.

For a HTTP connector that needs bearer authentication, its catalog configuration may reference only a server-side environment variable named `MCP_EXTERNAL_<NAME>_AUTHORIZATION`. The variable value is sent as the `Authorization` header only during the outbound handshake; it is never accepted from the browser, returned by APIs, or written to the audit trail. Move this reference into the encrypted connector vault before enabling shared deployment.

Endpoint configuration is local-first and persisted under `runtime/mcp_external_servers.local.json`. It stores only endpoint metadata and the name of a credential environment variable; no secret is stored in this file. The catalog is hydrated on application startup.

Before enabling an external write connector, require all of:

- owner approval and least-privilege scopes;
- target allowlist and per-tool input schema validation;
- idempotency key and a reconciliation/read-back action;
- durable execution/audit record with correlation ID;
- explicit rollback or compensating-action procedure.

## Production boundary

For a shared/server deployment, put this control plane behind TLS and a real identity provider, persist operational records in a transactional store, and disable direct external write tools until role- and environment-aware policy is in place.

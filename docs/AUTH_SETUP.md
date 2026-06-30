# LedgerFlow Auth Setup

LedgerFlow Hub protects local routes with an HttpOnly session cookie for the app UI and an optional bearer token for trusted automation clients.

## Local/desktop login

1. Copy `.env.example` to `.env`.
2. Set `LOCAL_AUTH_DEV_PASSWORD` to a private value before starting LedgerFlow.
3. Start LedgerFlow and log in with a local email plus the configured value.

There is no default password in source code. If `LOCAL_AUTH_DEV_PASSWORD` is missing, the login endpoint fails closed until it is configured.

## Trusted automation/API access

For local automation clients that cannot keep a browser session cookie, set `LEDGERFLOW_API_TOKEN` server-side and send it as an Authorization bearer token.

Never expose server-side credentials in frontend code, screenshots, logs, docs with real values, or Git history.

## Supabase notes

Supabase env keys remain optional for the current local-first runtime. Keep public browser keys and server-only service keys separated.

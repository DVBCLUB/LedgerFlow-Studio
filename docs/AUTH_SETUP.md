# LedgerFlow Auth Setup

LedgerFlow Hub protects local API routes with an HttpOnly session cookie for the app UI and an optional bearer token for trusted automation clients.

## 1. Local/desktop login

Use this mode for desktop, offline, and normal local development.

1. Copy `.env.example` to `.env`.
2. Generate a private password and set it as `LOCAL_AUTH_DEV_PASSWORD`.
3. Start LedgerFlow.
4. On the login screen, enter any valid local email address and the configured password.

Example:

```env
LOCAL_AUTH_DEV_PASSWORD=replace-with-a-private-random-password
```

There is no default password in source code. If `LOCAL_AUTH_DEV_PASSWORD` is missing, the login endpoint fails closed until you configure it.

## 2. Trusted automation/API access

Use this only for local automation clients that cannot keep a browser session cookie, such as n8n, local scripts, or approved webhook runners.

1. Generate a random 32+ character token.
2. Set it in server-side env as `LEDGERFLOW_API_TOKEN`.
3. Send it as an Authorization bearer token.

```env
LEDGERFLOW_API_TOKEN=replace-with-a-random-32-plus-character-token
```

```http
Authorization: Bearer replace-with-a-random-32-plus-character-token
```

Never expose this token in frontend code, screenshots, logs, docs with real values, or Git history.

## 3. AI Doctor authentication

`npm run ai:doctor` now requires one of these configured values:

- `LOCAL_AUTH_DEV_PASSWORD`, so the script can create a short-lived session cookie.
- `LEDGERFLOW_API_TOKEN`, so the script can call protected APIs as an automation client.

## 4. Supabase notes

Supabase env keys remain optional for the current local-first runtime. If future auth flows use Supabase Email/Password, keep public browser keys and server-only service keys separated:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
```

`VITE_SUPABASE_ANON_KEY` is public by design. `SUPABASE_SERVICE_KEY` is server-only and must never be sent to the browser.

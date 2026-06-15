# LedgerFlow Auth Setup

LedgerFlow Hub supports two login modes.

## 1. Supabase Auth

Use this mode for cloud/web deployments or whenever you want real user accounts.

1. Create a Supabase project.
2. In Supabase Dashboard, open Authentication > Providers.
3. Enable Email provider and configure the email confirmation policy you want.
4. Copy these values into your local `.env` or hosting secret settings:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

5. Create a user in Authentication > Users, or allow signup if your deployment supports it.
6. Open LedgerFlow and sign in with the Supabase email/password form.

Notes:

- `VITE_SUPABASE_ANON_KEY` is public by design and is used by the browser Supabase client.
- `SUPABASE_SERVICE_KEY` is server-only. Never expose it in frontend code, screenshots, logs, or docs with real values.
- The frontend must not call AI providers directly. AI requests still go through the local backend AI Gateway.

## 2. Local/offline mode

Use this mode for desktop or offline use when Supabase is not configured.

1. Generate a random token with at least 32 characters.
2. Add it to `.env`:

```env
LOCAL_ADMIN_TOKEN=replace-with-a-random-32-plus-character-token
```

3. Start LedgerFlow.
4. Select Local/offline mode on the login screen.
5. Paste the token. The browser sends it to the local backend for verification; the token is not stored in localStorage.

There is no default username or password. Rotate `LOCAL_ADMIN_TOKEN` if it was shared accidentally.

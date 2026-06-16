# Offline Vendor Assets Checklist

Use this checklist before calling the Windows desktop build "fully offline".
`npm run check:offline` may pass with warnings while some optional runtimes still depend on online fallbacks.

## Current local-first runtime loaders

| Feature | Runtime file | Local asset path | Current fallback |
|---|---|---|---|
| SQLite WASM sync sandbox | `src/utils/supabaseSync.ts` | `public/vendor/sql.js/` | CDN fallback kept for web builds |
| Python data science sandbox | `src/components/PythonSandbox.tsx` | `public/vendor/pyodide/v0.26.2/full/` | CDN fallback kept for web builds |
| VietQR preview | `src/components/DeployBusiness.tsx` | Not implemented yet | Online VietQR image preview |

## Required sql.js assets

Place these files in `public/vendor/sql.js/`:

- `sql-wasm.js`
- `sql-wasm.wasm`

After adding them:

1. Run `npm.cmd run check:offline`.
2. Run `npm.cmd run check:offline-vendor-assets`.
3. Run `npm.cmd run lint`.
4. Manually open the SQLite/WASM query UI and run a simple `select` query.
5. Remove the CDN fallback in `src/utils/supabaseSync.ts` only after the local asset path is verified.

## Required Pyodide assets

Place a complete Pyodide `v0.26.2/full` runtime under:

```text
public/vendor/pyodide/v0.26.2/full/
```

At minimum, this folder must include the runtime files needed by `loadPyodide`, including:

- `pyodide.js`
- `pyodide.asm.js`
- `pyodide.asm.wasm`
- `python_stdlib.zip`
- package metadata files shipped with the same Pyodide release

After adding them:

1. Run `npm.cmd run check:offline`.
2. Run `npm.cmd run check:offline-vendor-assets`.
3. Run `npm.cmd run lint`.
4. Open Python Sandbox and run the Benford template.
5. Remove the CDN fallback in `src/components/PythonSandbox.tsx` only after the local runtime can initialize without internet.

## VietQR offline renderer

`DeployBusiness` currently uses the online VietQR image endpoint as a fast preview and displays an offline boundary note.

Before marking payment tooling fully offline:

1. Add or reuse a local QR renderer that can encode the VietQR payload without external network calls.
2. Keep a human approval step for bank ID, account number, account name, amount, and memo.
3. Replace the online preview URL with the local renderer output.
4. Keep the online endpoint only as an explicitly labeled optional web preview, if still needed.

## Release verification

Run these checks after vendoring assets:

```bash
npm.cmd run lint
npm.cmd run check:offline
npm.cmd run check:offline-vendor-assets
npm.cmd run build
```

For desktop release candidates, also run:

```bash
npm.cmd run desktop:dist
```

Do not advertise the installer as fully offline while `check:offline` still reports desktop release risks for Pyodide, sql.js, fonts, or other CDN dependencies.

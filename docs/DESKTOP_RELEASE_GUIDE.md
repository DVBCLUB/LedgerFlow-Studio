# LedgerFlow Hub - Desktop Release Guide

LedgerFlow Hub ships as one Windows app folder, not as an installer.

## Standard Windows Build

Run:

```bash
npm install
npm run desktop:dist
```

The only Windows app entrypoint is:

```text
release/win-unpacked/LedgerFlow Hub.exe
```

`npm run desktop:pack` and `npm run desktop:dist` both refresh the same unpacked app folder. Do not create a separate Setup EXE or Portable EXE.

## Local Launcher

Use:

```text
KHOI_DONG_PHAN_MEM.cmd
```

That script opens `release/win-unpacked/LedgerFlow Hub.exe` directly. If the file is missing, rebuild with `npm run desktop:dist`.

## User Handoff

Send or upload the full `release/win-unpacked` folder. The user runs `LedgerFlow Hub.exe` inside that folder.

The app starts its own local Express runtime and AI assistant daemon from the bundled `dist/` files, so running the EXE should include the current UI, AI Gateway, AI Operations Center, knowledge data, prompt libraries, workflow templates, and local integrations that were built into the folder.

## Validation

Before handing off a Windows folder:

```bash
npm run lint
npm run check:desktop
npm run desktop:dist
```

Then open:

```text
release/win-unpacked/LedgerFlow Hub.exe
```

Confirm the app loads, AI Operations Center shows the integration inventory, and no separate installer artifact is required.

# Runtime Data Folder

This folder stores local runtime-generated data files.

Purpose:

- Keep repository root clean.
- Keep AI coding agents focused on source files instead of local state files.
- Reduce accidental commits of local runtime data.

Notes:

- Runtime files in this folder are ignored by git.
- Legacy root files are still read as a fallback for backward compatibility.
- You can migrate existing root runtime files with:

```bash
npm run runtime:migrate
```

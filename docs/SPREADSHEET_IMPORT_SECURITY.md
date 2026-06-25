# Spreadsheet Import Security Baseline

Applies to Excel/Spreadsheet imports used by LedgerFlow Studio.

## Risk model

Spreadsheet files are user-supplied inputs and must be treated as untrusted content.

## Required limits

- Maximum upload size: 10 MB.
- Maximum worksheets processed: 10.
- Maximum rows processed per sheet: 50,000.
- Maximum cells processed: 500,000.
- Import timeout: 30 seconds.
- Reject encrypted/password-protected workbooks.
- Reject unsupported formats.

## Parser requirements

- Route imports through a single adapter layer.
- Do not expose raw workbook objects outside the adapter.
- Validate workbook metadata before parsing rows.
- Fail closed with user-friendly errors.
- Log only summary diagnostics; never log workbook contents.

## Current inventory

Known spreadsheet parsing location:

- server/services/misaBridge.ts

## Follow-up

Issue #27 tracks implementation of enforced limits and adapter isolation.
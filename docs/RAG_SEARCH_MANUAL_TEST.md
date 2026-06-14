# RAG Search Manual Test

Purpose: verify the local-first Knowledge/RAG flow without external APIs, embeddings, or uploads.

## Scope

This test covers:

- Knowledge Base document text import.
- Review flow from `Needs Review` to `Approved`.
- RAG Search local keyword lookup.
- Citation IDs in copied AI context.
- Audit events after search/copy.

## Preconditions

- App opens without a blank screen.
- AgentOpsHub is available.
- Tabs available:
  - Knowledge Base
  - RAG Search
  - Company Memory
  - Memory Versions

## Smoke document

Use this sample text:

```text
LedgerFlow Studio is a Company OS for a solo founder and AI workforce. The system must stay approval-first, audit-first, and sandbox-first. External write actions require founder approval. Knowledge notes should not become AI context until reviewed and approved.
```

Suggested metadata:

```text
Document title: RAG Smoke Test
Tags: smoke, rag, company-os
Source: Process SOP
Status after import: Needs Review
```

## Steps

1. Open AgentOpsHub.
2. Open Knowledge Base.
3. Paste the smoke document into Import document text.
4. Import it.
5. Confirm imported chunks are created as `Needs Review`.
6. Review at least one chunk and set it to `Approved`.
7. Open RAG Search.
8. Search: `approval-first`.
9. Confirm only approved notes appear when Include draft is off.
10. Add one result to the context basket.
11. Copy AI context.
12. Confirm copied text contains citation IDs such as `[K1]`.
13. Open audit trail surfaces and confirm search/copy events were recorded.

## Expected result

- Imported notes do not automatically become AI context.
- Approved notes can be found by RAG Search.
- Copied context includes citation IDs.
- No external API call is required.
- No vector DB or embedding is required.

## Failure handling

If search returns no result:

- Confirm the note status is `Approved`.
- Confirm Include draft is enabled only when intentionally testing draft results.
- Confirm the query keyword exists in title/content/tags.

If copied context has no citation:

- Treat it as a blocking RAG governance issue.
- Do not use the context for AI work until citation output is fixed.

## Release gate

RAG Phase 1 is acceptable only when:

- Import works.
- Review status is respected.
- Search works locally.
- Context copy includes citation.
- Audit is recorded.

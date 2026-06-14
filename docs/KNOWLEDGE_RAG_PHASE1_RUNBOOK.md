# Knowledge / RAG Phase 1 Runbook

## Purpose

This runbook turns the Claude brief item `Knowledge/RAG + Company Memory` into an implementation plan that keeps LedgerFlow Studio safe, local-first and audit-first.

Phase 1 must not introduce a remote vector database, paid API dependency, or hidden external write action. The first version should behave like a controlled company knowledge search layer over local records.

## Guardrails

- Do not upload private company documents to an external AI provider by default.
- Do not store secrets, API keys, or tokens inside knowledge notes.
- Approved knowledge is the only content allowed in AI context exports.
- Draft and Needs Review knowledge can be searched by the founder, but must be clearly marked.
- Every export to AI context must create an audit event.
- Every generated answer must show source note IDs or memory version IDs.
- If evidence is missing, the answer must say so instead of guessing.

## Phase 1 Scope

### In scope

- Local keyword search over `ledgerflow_company_knowledge_v1`.
- Search over approved `Memory Versions`.
- Filter by source type, confidence and status.
- Copy RAG context with citations.
- Audit search/export actions.
- Simple scoring using title/content/source/status matches.

### Out of scope

- Remote vector database.
- Embeddings API.
- Auto-ingesting private files without founder review.
- Auto-answering customer/legal/tax questions without citation.
- Background sync to external storage.

## Local storage contracts

### Knowledge records

Expected key:

```text
ledgerflow_company_knowledge_v1
```

Minimum useful fields:

```ts
type KnowledgeRecord = {
  id: string;
  title: string;
  source: string;
  status: 'Draft' | 'Needs Review' | 'Approved';
  confidence: 'Low' | 'Medium' | 'High';
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};
```

### Memory versions

Expected key:

```text
ledgerflow_company_memory_versions_v1
```

Minimum useful fields:

```ts
type MemoryVersion = {
  id: string;
  version: string;
  status: 'Draft' | 'Needs Review' | 'Approved' | 'Archived';
  summary: string;
  context: string;
  rollbackNote: string;
  createdAt: string;
};
```

## Proposed UI

Add a small `RAG Search` panel inside `Knowledge Base` or as a separate AgentOps tab.

Fields:

- Search query
- Status filter
- Confidence filter
- Source filter
- Include memory versions checkbox
- Approved-only toggle for AI context

Result card:

- Title
- Source
- Status
- Confidence
- Matched snippets
- Citation ID
- Button: Copy source
- Button: Add to context basket

Context basket:

- Selected sources
- Token/length estimate
- Copy AI context
- Audit export

## Search scoring

Start simple:

- +5 exact title match
- +3 content match
- +2 tag/source match
- +2 approved status
- -2 draft status
- -3 low confidence

This is intentionally simple so it can work offline without dependencies.

## Required audit events

- `RAG_SEARCH_RUN`
- `RAG_CONTEXT_COPIED`
- `RAG_SOURCE_SELECTED`
- `RAG_SOURCE_EXCLUDED`
- `RAG_LOW_EVIDENCE_WARNING`

Each audit event should include:

- query
- selected source IDs
- approved-only setting
- timestamp

## Acceptance checklist

- [ ] Search works without backend.
- [ ] Approved-only mode excludes Draft/Needs Review notes.
- [ ] Copied context includes source IDs.
- [ ] Empty search does not crash.
- [ ] Malformed old localStorage records do not crash.
- [ ] Audit logs are written through `appendAgentOpsAudit()`.
- [ ] The UI does not claim certainty when no source exists.

## Phase 2 options

Only after Phase 1 is stable:

- Local file ingestion with founder review.
- Browser-side lightweight indexing.
- Optional embeddings behind Secrets Vault and Connector Approval.
- Export/import company memory packs.
- Evidence-based AI answer composer.

## Rollback plan

If RAG Search causes CI or runtime errors:

1. Disable the tab mount in `AgentOpsHub`.
2. Keep stored knowledge untouched.
3. Revert only the UI/search layer.
4. Keep `Knowledge Base` and `Memory Versions` as the source of truth.

# Knowledge / RAG Phase 1 - Runbook

## Muc dich

Runbook nay chuyen muc `Knowledge/RAG + Company Memory` thanh ke hoach trien khai giu LedgerFlow Studio an toan, local-first va audit-first.

Phase 1 khong duoc dua vao remote vector database, phu thuoc paid API, hoac hanh dong external write bi an. Phien ban dau phai hoat dong nhu lop tim kiem tri thuc cong ty co kiem soat tren local records.

## Guardrails

- Mac dinh khong upload tai lieu noi bo cua cong ty len external AI provider.
- Khong luu secrets, API keys, hoac tokens trong knowledge notes.
- Chi Approved knowledge moi duoc phep dua vao AI context exports.
- Draft va Needs Review van co the tim duoc boi Founder, nhung phai danh dau ro.
- Moi lan export AI context phai tao audit event.
- Moi cau tra loi sinh ra phai hien source note IDs hoac memory version IDs.
- Neu thieu bang chung, cau tra loi phai noi ro la thieu evidence thay vi doan.

## Pham vi Phase 1

### Trong pham vi

- Tim kiem tu khoa local tren `ledgerflow_company_knowledge_v1`.
- Tim tren `Memory Versions` da approved.
- Loc theo source type, confidence va status.
- Copy RAG context kem citations.
- Audit hanh dong search/export.
- Scoring don gian dua tren title/content/source/status.

### Ngoai pham vi

- Remote vector database.
- Embeddings API.
- Tu dong nap private files khi chua co founder review.
- Tu dong tra loi cau hoi khach hang/phap ly/thue khi chua co citation.
- Dong bo nen sang luu tru ben ngoai.

## Local storage contracts

### Knowledge records

Key du kien:

```text
ledgerflow_company_knowledge_v1
```

Truong toi thieu huu ich:

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

Key du kien:

```text
ledgerflow_company_memory_versions_v1
```

Truong toi thieu huu ich:

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

## UI de xuat

Them panel nho `RAG Search` trong `Knowledge Base` hoac mot tab AgentOps rieng.

Truong giao dien:

- Search query
- Status filter
- Confidence filter
- Source filter
- Include memory versions checkbox
- Approved-only toggle cho AI context

Result card:

- Title
- Source
- Status
- Confidence
- Matched snippets
- Citation ID
- Nut: Copy source
- Nut: Add to context basket

Context basket:

- Selected sources
- Uoc tinh token/do dai
- Copy AI context
- Audit export

## Search scoring

Khoi dau don gian:

- +5 exact title match
- +3 content match
- +2 tag/source match
- +2 approved status
- -2 draft status
- -3 low confidence

Co tinh giu scoring don gian de hoat dong offline, khong can them dependency.

## Audit events bat buoc

- `RAG_SEARCH_RUN`
- `RAG_CONTEXT_COPIED`
- `RAG_SOURCE_SELECTED`
- `RAG_SOURCE_EXCLUDED`
- `RAG_LOW_EVIDENCE_WARNING`

Moi audit event can co:

- query
- selected source IDs
- approved-only setting
- timestamp

## Acceptance checklist

- [ ] Search hoat dong ma khong can backend.
- [ ] Approved-only mode loai bo Draft/Needs Review.
- [ ] Context copy co source IDs.
- [ ] Empty search khong lam crash.
- [ ] localStorage record cu bi loi khong lam crash.
- [ ] Audit logs duoc ghi qua `appendAgentOpsAudit()`.
- [ ] UI khong khang dinh chac chan khi khong co source.

## Lua chon Phase 2

Chi lam sau khi Phase 1 on dinh:

- Local file ingestion co founder review.
- Lightweight indexing ben browser.
- Embeddings tuy chon dat sau Secrets Vault va Connector Approval.
- Export/import company memory packs.
- Evidence-based AI answer composer.

## Ke hoach rollback

Neu RAG Search gay loi CI hoac runtime:

1. Tat mount tab trong `AgentOpsHub`.
2. Giu nguyen du lieu knowledge da luu.
3. Chi revert lop UI/search.
4. Van giu `Knowledge Base` va `Memory Versions` la source of truth.

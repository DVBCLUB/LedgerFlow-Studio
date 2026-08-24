export interface RagIndexStats { totalDocuments: number; totalChunks: number; lastReindexedAt: string; indexSizeKb: number; topCorpora: { corpus: string; docs: number }[]; avgQueryLatencyMs: number; }
export interface SemanticSearchResult { query: string; results: { docId: string; title: string; corpus: string; relevanceScore: number; snippet: string; }[]; hybridScoreUsed: boolean; totalFound: number; queryTimeMs: number; }

export function getSemanticSearchData(): RagIndexStats {
  return {
    totalDocuments: 8_742,
    totalChunks: 94_318,
    lastReindexedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    indexSizeKb: 142_560,
    topCorpora: [
      { corpus: 'invoices', docs: 3_200 },
      { corpus: 'contracts', docs: 1_450 },
      { corpus: 'sop_runbooks', docs: 892 },
      { corpus: 'ceo_decisions', docs: 614 },
      { corpus: 'financial_reports', docs: 2_586 },
    ],
    avgQueryLatencyMs: 38,
  };
}

export function semanticSearch(query: string, corpus: string): SemanticSearchResult {
  const results = [
    { docId: 'doc_inv_20260815', title: 'Hoa don GTGT 0015/2026', corpus: 'invoices', relevanceScore: 0.97, snippet: 'Hang hoa/dich vu: Goi phan mem LedgerFlow Enterprise thang 8/2026. Thanh tien: 9.900.000 VND' },
    { docId: 'doc_ctv_2026_q2', title: 'Hop dong phan phoi Q2/2026', corpus: 'contracts', relevanceScore: 0.89, snippet: 'Cac ben dong y su dung LedgerFlow lam nen tang ke toan chinh thuc...' },
    { docId: 'doc_sop_billing', title: 'SOP Quy trinh thu phi dinh ky', corpus: 'sop_runbooks', relevanceScore: 0.83, snippet: 'Buoc 1: He thong tu dong phat lenh thu phi vao ngay 1 hang thang...' },
  ].filter(() => Math.random() > 0.1);
  return {
    query,
    results,
    hybridScoreUsed: true,
    totalFound: results.length,
    queryTimeMs: 28 + Math.floor(Math.random() * 20),
  };
}

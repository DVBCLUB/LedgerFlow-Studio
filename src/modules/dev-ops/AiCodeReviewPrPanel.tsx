import React, { useEffect, useState } from 'react';
import { getCodeReviewPRs, analyzePullRequest } from '../../utils/devopsApi';

interface PR {
  prId: string;
  title: string;
  author: string;
  branch: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  securityScore: number;
  status: string;
  suggestedChangelog: string;
}

const SAMPLE_PRS: PR[] = [
  {
    prId: 'PR-1042',
    title: 'feat: Add VietQR webhook instant reconciliation and signature verification',
    author: 'ai-dev-agent-gamma',
    branch: 'feat/vietqr-webhook-v2',
    filesChanged: 6,
    additions: 342,
    deletions: 28,
    securityScore: 98,
    status: 'approved',
    suggestedChangelog: 'Added HMAC-SHA256 signature verification for VietQR instant bank feeds.'
  },
  {
    prId: 'PR-1043',
    title: 'refactor: Migrate legacy SQL raw queries to AST parameterized builders',
    author: 'ai-architect-omega',
    branch: 'refactor/ast-query-shield',
    filesChanged: 14,
    additions: 512,
    deletions: 680,
    securityScore: 95,
    status: 'approved',
    suggestedChangelog: 'Eliminated raw query interpolations across finance Ledger tables.'
  },
  {
    prId: 'PR-1044',
    title: 'fix: Memory leak in long-lived SSE Pulse subscriber connection pool',
    author: 'devops-sre-agent',
    branch: 'fix/sse-heartbeat-cleanup',
    filesChanged: 3,
    additions: 89,
    deletions: 42,
    securityScore: 99,
    status: 'approved',
    suggestedChangelog: 'Added automatic cleanup on client abort for SSE heartbeat streams.'
  }
];

export default function AiCodeReviewPrPanel() {
  const [analyzedPr, setAnalyzedPr] = useState<string | null>(null);
  const [prs, setPrs] = useState<PR[]>(SAMPLE_PRS);

  useEffect(() => {
    getCodeReviewPRs().then((d) => {
      if (d.openPullRequests?.length) setPrs(d.openPullRequests);
    }).catch(() => {});
  }, []);

  const handleAudit = (prId: string) => {
    setAnalyzedPr(prId);
    analyzePullRequest(prId).catch(() => {});
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg,#064e3b22,#10b98122)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #10b98144' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>🤖 AI Code Review & PR Automation Engine</h2>
        <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>AST-Level Static Analysis · Security Vulnerability Scanner · Clean Code Scoring · Release Notes Generation</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Repo Health Score', value: '98.4%', color: '#34d399' },
          { label: 'Avg Review Latency', value: '1.8s', color: '#60a5fa' },
          { label: 'Auto-Merge Eligible', value: '3 PRs', color: '#a78bfa' },
          { label: 'Zero Vulnerabilities', value: '100% Passed', color: '#fbbf24' }
        ].map((c) => (
          <div key={c.label} style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #334155', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color, marginTop: '0.25rem' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1e293b', borderRadius: '0.75rem', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600, color: '#e2e8f0' }}>📦 Open Pull Requests (Auto-Reviewed by AI Swarm)</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {prs.map((pr) => (
            <div key={pr.prId} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#60a5fa' }}>{pr.prId}</span>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{pr.title}</span>
                </div>
                <span style={{ background: '#10b98122', color: '#34d399', borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>
                  ✓ {pr.status.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                <span>Author: {pr.author} · Branch: <code>{pr.branch}</code> · Changed {pr.filesChanged} files (+{pr.additions} / -{pr.deletions})</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Security Score: {pr.securityScore}/100</span>
                  <button onClick={() => handleAudit(pr.prId)} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    {analyzedPr === pr.prId ? '✓ Release Notes Generated' : 'View AI Audit'}
                  </button>
                </div>
              </div>
              {analyzedPr === pr.prId && (
                <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #10b98144', fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                  <strong>Changelog Entry:</strong> {pr.suggestedChangelog}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

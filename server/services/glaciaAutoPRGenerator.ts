/**
 * server/services/glaciaAutoPRGenerator.ts
 * Động cơ Tạo Draft Pull Request Cải Tiến Tự Động (Auto-PR Generator) của Glacia (Frontier 1).
 */

export interface DraftPullRequest {
  id: string;
  title: string;
  branchName: string;
  targetBranch: string;
  category: 'refactor' | 'performance' | 'security' | 'feature';
  summary: string;
  affectedFiles: string[];
  testAssertions: string[];
  markdownBody: string;
  status: 'draft_ready' | 'submitted' | 'rejected';
  createdAt: string;
}

export function generateRefactorDraftPR(payload: {
  title: string;
  category: 'refactor' | 'performance' | 'security' | 'feature';
  targetFiles: string[];
  rationale: string;
}): DraftPullRequest {
  const prId = `pr-glacia-${Date.now()}`;
  const branchName = `glacia/${payload.category}/${payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;

  const markdownBody = `
## 🤖 Glacia Self-Rewriting Autonomous Pull Request
> **Tạo bởi:** Glacia Robot Core • **Trạng thái:** DRAFT (Cần Founder & CEO David Bao phê duyệt)

### 🎯 Mục đích & Lý do Cải tiến:
${payload.rationale}

### 📂 Danh sách Files tác động:
${payload.targetFiles.map((f) => `- \`${f}\``).join('\n')}

### 🧪 Kế hoạch Kiểm thử & An toàn:
- [ ] Chạy unit tests: \`npx tsx --test server/services/glacia*.test.ts\`
- [ ] Cập nhật wiring baseline: \`npm run wiring:baseline\`
- [ ] Kiểm tra wiring gate: \`npm run check:wiring\`
- [ ] Đóng gói Windows Desktop: \`npm run desktop:pack\`

---
*Glacia Singularity Engine — Tự cải tiến liên tục không phụ thuộc con người.*
  `.trim();

  return {
    id: prId,
    title: `[Glacia Auto-Patch] ${payload.title}`,
    branchName,
    targetBranch: 'main',
    category: payload.category,
    summary: payload.rationale,
    affectedFiles: payload.targetFiles,
    testAssertions: [
      'Pass all existing Glacia unit tests (100% green)',
      'No dead code or dormant service wiring regressions',
      'Windows Desktop binary builds cleanly',
    ],
    markdownBody,
    status: 'draft_ready',
    createdAt: new Date().toISOString(),
  };
}

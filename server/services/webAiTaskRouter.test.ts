import assert from "node:assert/strict";
import test from "node:test";
import { WebAiTaskRouter } from "./webAiTaskRouter.ts";
import { WebAiSessionManager } from "./webAiSessionManager.ts";

test("WebAiTaskRouter - classifyTask matches keywords correctly", () => {
  assert.equal(WebAiTaskRouter.classifyTask("Hãy viết một hàm React component bằng TypeScript"), "coding");
  assert.equal(WebAiTaskRouter.classifyTask("Tính toán báo cáo tài chính và cân đối kế toán"), "finance");
  assert.equal(WebAiTaskRouter.classifyTask("Lập kịch bản video đăng lên TikTok triệu view"), "marketing");
  assert.equal(WebAiTaskRouter.classifyTask("Viết email chào hàng gửi khách hàng tiềm năng"), "sales");
  assert.equal(WebAiTaskRouter.classifyTask("Xin chào, bạn khỏe không?"), "general");
});

test("WebAiTaskRouter - recommend lists sorted recommendations", async () => {
  const result = await WebAiTaskRouter.recommend("Viết mã nguồn xử lý thuật toán sắp xếp nhanh");
  
  // Should classify as coding
  assert.equal(result.taskDomain, "coding");
  
  // Coding top recommendations should be Claude or DeepSeek
  const topRecommended = result.recommendations.find(r => r.isRecommended);
  assert.ok(topRecommended);
  assert.ok(["claude", "deepseek"].includes(topRecommended.platform));
  
  // Recommendations list should be sorted by score descending
  for (let i = 0; i < result.recommendations.length - 1; i++) {
    assert.ok(result.recommendations[i].score >= result.recommendations[i + 1].score);
  }
});

test("WebAiTaskRouter - privacy guard catches credentials", async () => {
  const cleanPrompt = "Hãy viết một email chào hàng cho sản phẩm.";
  const dirtyPrompt = "API Key của tôi là sk-12345abcdefg1234567890, hãy viết code kết nối Supabase.";
  
  const cleanResult = await WebAiTaskRouter.recommend(cleanPrompt);
  assert.equal(cleanResult.privacyScan.risk, "LOW");
  assert.equal(cleanResult.privacyScan.findings.length, 0);

  const dirtyResult = await WebAiTaskRouter.recommend(dirtyPrompt);
  // Privacy scan should flag HIGH or BLOCKED because of 'sk-...' pattern
  assert.ok(["HIGH", "BLOCKED"].includes(dirtyResult.privacyScan.risk));
  assert.ok(dirtyResult.privacyScan.findings.length > 0);
  assert.ok(dirtyResult.privacyScan.redacted.includes("[REDACTED:api_key]"));
});

test("WebAiTaskRouter - fallback profile selection", async () => {
  // Setup mock profiles if needed, or check logic
  // Let's create two temporary profiles
  const p1 = await WebAiSessionManager.createProfile("Test Profile 1", "claude");
  const p2 = await WebAiSessionManager.createProfile("Test Profile 2", "claude");

  try {
    const fallback = await WebAiTaskRouter.getFallbackProfile(p1.id, "claude");
    // Fallback should yield the other Claude profile
    assert.ok(fallback);
    assert.equal(fallback.id, p2.id);
  } finally {
    // Cleanup profiles
    await WebAiSessionManager.deleteProfile(p1.id);
    await WebAiSessionManager.deleteProfile(p2.id);
  }
});

test("WebAiTaskRouter - classifyTaskSemantic uses AI classification when available", async () => {
  const originalFetch = globalThis.fetch;
  
  // Mock global fetch to return a simulated successful response
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: "finance"
            }
          }
        ],
        model: "mocked-model"
      })
    } as any;
  };

  try {
    const domain = await WebAiTaskRouter.classifyTaskSemantic("Some random text that would normally be general");
    assert.equal(domain, "finance");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("WebAiTaskRouter - classifyTaskSemantic falls back to keywords when offline/error", async () => {
  const originalFetch = globalThis.fetch;
  
  // Mock global fetch to throw a network error
  globalThis.fetch = async () => {
    throw new Error("Network offline simulation");
  };

  try {
    // This prompt has the word "react" which keyword classifies to "coding"
    const domain = await WebAiTaskRouter.classifyTaskSemantic("Hãy tạo một component React");
    assert.equal(domain, "coding");
  } finally {
    globalThis.fetch = originalFetch;
  }
});


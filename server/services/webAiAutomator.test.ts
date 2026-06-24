import assert from "node:assert/strict";
import test from "node:test";
import { extractCodeBlocks, PLATFORMS } from "./webAiAutomator.ts";
import { parseQuotaResetTime } from "./webAiPolicy.ts";
import { WEB_AI_PLATFORMS } from "./webAiSessionManager.ts";

test("webAiAutomator - extractCodeBlocks from markdown text", () => {
  const sampleText = `
  Here is the component we designed:
  // file: src/components/MyButton.tsx
  \`\`\`tsx
  export const MyButton = () => <button>Click me</button>;
  \`\`\`
  
  And here is some style:
  index.css
  \`\`\`css
  body { background: #000; }
  \`\`\`
  `;
  
  const blocks = extractCodeBlocks(sampleText, "default.txt");
  assert.equal(blocks.length, 2);
  
  // First block should match MyButton.tsx
  assert.equal(blocks[0].language, "tsx");
  assert.equal(blocks[0].targetFile, "src/components/MyButton.tsx");
  assert.equal(blocks[0].code.trim(), "export const MyButton = () => <button>Click me</button>;");

  // Second block should match index.css
  assert.equal(blocks[1].language, "css");
  assert.equal(blocks[1].targetFile, "index.css");
  assert.equal(blocks[1].code.trim(), "body { background: #000; }");
});

test("webAiAutomator - parseQuotaResetTime extracts correct dates", () => {
  const now = Date.now();
  
  // 1. In 2 hours
  const reset1 = parseQuotaResetTime("Rate limit reached. Please try again in 2 hours.");
  const diff1 = Date.parse(reset1) - now;
  // Should be close to 2 hours (2 * 3600 * 1000 = 7200000 ms)
  assert.ok(Math.abs(diff1 - 2 * 60 * 60 * 1000) < 5000);

  // 2. In 15 minutes
  const reset2 = parseQuotaResetTime("Too many requests, try again in 15 minutes.");
  const diff2 = Date.parse(reset2) - now;
  assert.ok(Math.abs(diff2 - 15 * 60 * 1000) < 5000);

  // 3. Default fallback (1 hour)
  const resetFallback = parseQuotaResetTime("Quota exceeded. Please contact support.");
  const diffFallback = Date.parse(resetFallback) - now;
  assert.ok(Math.abs(diffFallback - 60 * 60 * 1000) < 5000);
});

test("webAiAutomator - PLATFORMS selector validation smoke test", () => {
  for (const platform of WEB_AI_PLATFORMS) {
    const config = PLATFORMS[platform];
    assert.ok(config, `Platform "${platform}" must have a selectors configuration in PLATFORMS.`);
    
    // Core selector strings must be non-empty
    assert.ok(config.url, `Platform "${platform}" URL must be defined.`);
    assert.ok(config.inputSelector, `Platform "${platform}" input selector must be defined.`);
    assert.ok(config.messageSelector, `Platform "${platform}" message response selector must be defined.`);
    
    // Selectors must not contain invalid contains logic
    assert.ok(!config.inputSelector.includes(":contains"), `Platform "${platform}" input selector should not use invalid :contains syntax.`);
    assert.ok(!config.messageSelector.includes(":contains"), `Platform "${platform}" message selector should not use invalid :contains syntax.`);
  }
});

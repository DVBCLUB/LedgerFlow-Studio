import assert from "node:assert/strict";
import test from "node:test";
import { optimizeCodingContext, buildCodingPrompt } from "./codingContext.ts";
import type { FileContext } from "./safeFileManager.ts";

test("optimizeCodingContext - returns all files if total length is below limit", () => {
  const files: FileContext[] = [
    { absolutePath: "d:/CODE/LedgerFlow-Studio/src/App.tsx", relativePath: "src/App.tsx", content: "hello world", language: "tsx", sizeBytes: 11, modifiedAt: "" },
    { absolutePath: "d:/CODE/LedgerFlow-Studio/src/index.css", relativePath: "src/index.css", content: "body { color: red; }", language: "css", sizeBytes: 20, modifiedAt: "" }
  ];

  const result = optimizeCodingContext("find body color", files, undefined, 500);
  assert.equal(result.optimizedFiles.length, 2);
  assert.equal(result.excludedCount, 0);
  assert.equal(result.optimizedFiles[0].relativePath, "src/App.tsx");
});

test("optimizeCodingContext - always includes targetFile and scores other files by relevance", () => {
  const files: FileContext[] = [
    { absolutePath: "d:/CODE/LedgerFlow-Studio/src/App.tsx", relativePath: "src/App.tsx", content: "const app = () => { return <div>App</div> }", language: "tsx", sizeBytes: 43, modifiedAt: "" },
    { absolutePath: "d:/CODE/LedgerFlow-Studio/src/Button.tsx", relativePath: "src/Button.tsx", content: "const button = () => { return <button>Click</button> }", language: "tsx", sizeBytes: 54, modifiedAt: "" },
    { absolutePath: "d:/CODE/LedgerFlow-Studio/src/utils.ts", relativePath: "src/utils.ts", content: "export const add = (a: number, b: number) => a + b;", language: "typescript", sizeBytes: 50, modifiedAt: "" }
  ];

  // We set maxCharLimit to 80 characters.
  // The targetFile is "src/utils.ts" (50 chars).
  // "src/Button.tsx" (54 chars) matches "button" in the instruction.
  // "src/App.tsx" (43 chars) does not match the instruction query.
  // So: utils.ts must be included (target). Button.tsx is next most relevant.
  const result = optimizeCodingContext("create a button", files, "src/utils.ts", 80);

  // Exceeds 80 limit if we add Button.tsx, so only utils.ts is included.
  assert.equal(result.optimizedFiles.length, 1);
  assert.equal(result.optimizedFiles[0].relativePath, "src/utils.ts");
  assert.equal(result.excludedCount, 2);
});

test("buildCodingPrompt - appends note when files are excluded", () => {
  const files: FileContext[] = [
    { absolutePath: "d:/CODE/LedgerFlow-Studio/src/App.tsx", relativePath: "src/App.tsx", content: "const app = () => { return <div>App</div> }", language: "tsx", sizeBytes: 43, modifiedAt: "" },
    { absolutePath: "d:/CODE/LedgerFlow-Studio/src/Button.tsx", relativePath: "src/Button.tsx", content: "const button = () => { return <button>Click</button> }", language: "tsx", sizeBytes: 54, modifiedAt: "" }
  ];

  // Limit = 60 characters. App.tsx (43 chars). Button.tsx (54 chars).
  // Instruction contains "button". So Button.tsx is matched and included. App.tsx is excluded.
  const prompt = buildCodingPrompt({
    instruction: "edit button",
    files,
    maxCharLimit: 60
  });

  const userMsg = prompt.find(m => m.role === "user");
  assert.ok(userMsg);
  assert.ok(userMsg.content.includes("[NOTE] Context window optimized"));
  assert.ok(userMsg.content.includes("Excluded 1 less relevant source files"));
});

test("buildCodingPrompt - filters and injects relevant knowledge notes", () => {
  const notes = [
    { title: "React CSS Rules", body: "Use Vanilla CSS inside index.css, do not use TailwindCSS.", tags: "css, react", source: "Founder Note" },
    { title: "VAS 133 Taxes", body: "Do not require cash flow statement for micro businesses.", tags: "taxes, accounting", source: "Accounting Rule" },
  ];

  const prompt = buildCodingPrompt({
    instruction: "Build the visual interface using CSS.",
    files: [],
    knowledgeNotes: notes,
  });

  const systemMsg = prompt.find(m => m.role === "system");
  assert.ok(systemMsg);
  
  // Should include the matching note
  assert.ok(systemMsg.content.includes("React CSS Rules"));
  assert.ok(systemMsg.content.includes("Use Vanilla CSS"));
  
  // Should NOT include the unrelated note
  assert.ok(!systemMsg.content.includes("VAS 133 Taxes"));
});


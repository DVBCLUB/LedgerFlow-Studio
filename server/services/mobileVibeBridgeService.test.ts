import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import os from "os";
import {
  pushToMobileVibeInbox,
  getMobileVibeInbox,
  pullMobileVibeToDesktop,
  deleteMobileVibeItem,
} from "./mobileVibeBridgeService.ts";

test("MobileVibeBridge - push items, fetch inbox, pull to desktop and merge", async () => {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "lf-mobile-vibe-test-"));
  const storageFile = path.join(tmpDir, "test_db_storage.json");

  try {
    // 1. Push 1 code snippet item from mobile
    const item1 = await pushToMobileVibeInbox({
      type: "code_snippet",
      title: "Quick Auth Hook",
      content: "Hook React đăng nhập qua Mobile Vibe",
      codeSnippet: {
        language: "typescript",
        code: "export function useMobileAuth() { return { user: 'founder' }; }",
        filename: "useMobileAuth.ts",
      },
      tags: ["mobile", "auth"],
    });

    assert.ok(item1.id);
    assert.equal(item1.title, "Quick Auth Hook");

    // 2. Push 1 idea note
    const item2 = await pushToMobileVibeInbox({
      type: "idea",
      title: "AI Voice-to-PR feature",
      content: "Cho phép nói vào micro để sinh pull request tự động.",
      tags: ["idea", "ai"],
    });

    assert.ok(item2.id);

    // 3. Get inbox
    const inbox = await getMobileVibeInbox();
    assert.ok(inbox.some((x) => x.id === item1.id));
    assert.ok(inbox.some((x) => x.id === item2.id));

    // 4. Pull to Desktop (Merge into Studio DB)
    const pullResult = await pullMobileVibeToDesktop(storageFile);
    assert.ok(pullResult.pulledCount >= 2);

    // Check DB storage file
    const rawDb = await fs.promises.readFile(storageFile, "utf-8");
    const db = JSON.parse(rawDb);
    assert.ok(Array.isArray(db.fastrack_saved_snippets));
    assert.ok(Array.isArray(db.guerrilla_unexpected_ideas));

    // 5. Delete item
    await deleteMobileVibeItem(item1.id);
    await deleteMobileVibeItem(item2.id);
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
});

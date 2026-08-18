import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import os from "os";
import { loadHybridDatabase, saveHybridDatabase, getHybridStorageStatus } from "./hybridStorageService.ts";

test("HybridStorage - fallback to local storage when Supabase is not configured", async () => {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "lf-hybrid-test-"));
  const storageFile = path.join(tmpDir, "test_storage.json");

  try {
    // 1. Initial status
    const status = await getHybridStorageStatus(storageFile);
    assert.equal(status.supabaseConfigured, false);
    assert.equal(status.mode, "local_only");

    // 2. Save payload
    const testPayload = {
      lf_db_projects: [{ id: "p1", name: "Project Alpha" }],
      lf_db_users: [{ id: "u1", name: "Founder" }],
    };

    const saveResult = await saveHybridDatabase(storageFile, testPayload);
    assert.equal(saveResult.savedLocal, true);

    // 3. Load payload
    const loadedData = await loadHybridDatabase(storageFile);
    assert.deepEqual(loadedData, testPayload);

    // 4. Status after saving
    const statusAfter = await getHybridStorageStatus(storageFile);
    assert.equal(statusAfter.keysCount, 2);
    assert.ok(statusAfter.lastLocalSyncAt);
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
});

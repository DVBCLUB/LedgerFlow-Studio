import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadLocalDatabase, saveLocalDatabase } from "./localDatabase.ts";

test("database save preserves the previous snapshot as a backup", async (t) => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ledgerflow-db-test-"));
  t.after(() => fs.promises.rm(directory, { recursive: true, force: true }));
  const storageFile = path.join(directory, "db_storage.json");

  await saveLocalDatabase(storageFile, { revision: 1 });
  await saveLocalDatabase(storageFile, { revision: 2 });

  assert.deepEqual(await loadLocalDatabase(storageFile), { revision: 2 });
  assert.deepEqual(JSON.parse(await fs.promises.readFile(`${storageFile}.bak`, "utf-8")), { revision: 1 });
});

test("concurrent saves are serialized and leave valid JSON", async (t) => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ledgerflow-db-queue-test-"));
  t.after(() => fs.promises.rm(directory, { recursive: true, force: true }));
  const storageFile = path.join(directory, "db_storage.json");

  await Promise.all(Array.from({ length: 12 }, (_, revision) => saveLocalDatabase(storageFile, { revision })));

  assert.deepEqual(await loadLocalDatabase(storageFile), { revision: 11 });
  assert.deepEqual(JSON.parse(await fs.promises.readFile(`${storageFile}.bak`, "utf-8")), { revision: 10 });
  assert.equal((await fs.promises.readdir(directory)).some((name) => name.endsWith(".tmp")), false);
});


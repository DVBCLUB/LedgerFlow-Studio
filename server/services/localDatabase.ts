import fs from "fs";
import path from "path";

let saveQueue = Promise.resolve();

export async function loadLocalDatabase(storageFile: string): Promise<Record<string, unknown>> {
  if (!fs.existsSync(storageFile)) return {};
  return JSON.parse(await fs.promises.readFile(storageFile, "utf-8"));
}

export function saveLocalDatabase(storageFile: string, payload: Record<string, unknown>): Promise<void> {
  const operation = async () => {
    const tempFile = `${storageFile}.${process.pid}.${Date.now()}.tmp`;
    const backupFile = `${storageFile}.bak`;
    await fs.promises.mkdir(path.dirname(storageFile), { recursive: true });
    try {
      await fs.promises.writeFile(tempFile, JSON.stringify(payload, null, 2), "utf-8");
      if (fs.existsSync(storageFile)) await fs.promises.copyFile(storageFile, backupFile);
      await fs.promises.rename(tempFile, storageFile);
    } finally {
      await fs.promises.rm(tempFile, { force: true }).catch(() => undefined);
    }
  };
  const queued = saveQueue.then(operation, operation);
  saveQueue = queued.catch(() => undefined);
  return queued;
}


import fs from "fs";
import path from "path";

let saveQueue = Promise.resolve();

export async function loadLocalDatabase(storageFile: string): Promise<Record<string, unknown>> {
  if (!fs.existsSync(storageFile)) return {};
  return JSON.parse(await fs.promises.readFile(storageFile, "utf-8"));
}

export function saveLocalDatabase(storageFile: string, payload: Record<string, unknown>): Promise<void> {
  const operation = async () => {
    const backupFile = `${storageFile}.bak`;
    await fs.promises.mkdir(path.dirname(storageFile), { recursive: true });
    if (fs.existsSync(storageFile)) await fs.promises.copyFile(storageFile, backupFile).catch(() => undefined);
    await fs.promises.writeFile(storageFile, JSON.stringify(payload, null, 2), "utf-8");
  };
  const queued = saveQueue.then(operation, operation);
  saveQueue = queued.catch(() => undefined);
  return queued;
}


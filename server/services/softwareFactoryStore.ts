import fs from "fs";
import path from "path";

export interface SoftwareFactoryStoreSnapshot<T> {
  version: number;
  updatedAt: string;
  records: T[];
}

const STORE_DIR = path.join(process.cwd(), "data", "software-factory");

function ensureStoreDir() {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

function filePath(name: string) {
  ensureStoreDir();
  return path.join(STORE_DIR, `${name}.json`);
}

export function readSoftwareFactoryStore<T>(name: string): T[] {
  const target = filePath(name);
  if (!fs.existsSync(target)) return [];
  const raw = fs.readFileSync(target, "utf8");
  if (!raw.trim()) return [];
  const snapshot = JSON.parse(raw) as SoftwareFactoryStoreSnapshot<T>;
  return Array.isArray(snapshot.records) ? snapshot.records : [];
}

export function writeSoftwareFactoryStore<T>(name: string, records: T[]) {
  const snapshot: SoftwareFactoryStoreSnapshot<T> = {
    version: 1,
    updatedAt: new Date().toISOString(),
    records,
  };
  fs.writeFileSync(filePath(name), JSON.stringify(snapshot, null, 2), "utf8");
  return snapshot;
}

export function appendSoftwareFactoryStore<T>(name: string, record: T) {
  const records = readSoftwareFactoryStore<T>(name);
  records.push(record);
  writeSoftwareFactoryStore(name, records);
  return record;
}

export function getSoftwareFactoryStoreInfo() {
  ensureStoreDir();
  const files = fs.readdirSync(STORE_DIR).filter((file) => file.endsWith(".json"));
  return {
    directory: STORE_DIR,
    files,
    count: files.length,
  };
}

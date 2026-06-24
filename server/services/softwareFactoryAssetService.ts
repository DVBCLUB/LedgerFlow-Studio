import fs from "fs";
import path from "path";
import { readSoftwareFactoryStore, writeSoftwareFactoryStore } from "./softwareFactoryStore";

export type SoftwareFactoryAssetKind = "code" | "package" | "media" | "document" | "release" | "log";
export type SoftwareFactoryAssetStatus = "new" | "checked" | "linked" | "stored";

export interface SoftwareFactoryAssetRecord {
  id: string;
  runId: string;
  kind: SoftwareFactoryAssetKind;
  status: SoftwareFactoryAssetStatus;
  title: string;
  fileName: string;
  relativePath: string;
  sizeBytes: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareFactoryAssetInput {
  runId: string;
  kind: SoftwareFactoryAssetKind;
  title: string;
  fileName?: string;
  content: string;
  notes?: string;
}

const STORE_NAME = "assets";
const ASSET_DIR = path.join(process.cwd(), "data", "software-factory", "assets");
const records = new Map<string, SoftwareFactoryAssetRecord>();

function now() {
  return new Date().toISOString();
}

function createId(prefix = "sfa") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureAssetDir() {
  fs.mkdirSync(ASSET_DIR, { recursive: true });
}

function safeFileName(name: string) {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned || "asset.txt";
}

function hydrate() {
  if (records.size > 0) return;
  for (const record of readSoftwareFactoryStore<SoftwareFactoryAssetRecord>(STORE_NAME)) {
    records.set(record.id, record);
  }
}

function persist() {
  writeSoftwareFactoryStore(STORE_NAME, Array.from(records.values()));
}

export function createSoftwareFactoryAsset(input: SoftwareFactoryAssetInput) {
  hydrate();
  ensureAssetDir();
  const timestamp = now();
  const id = createId();
  const fileName = `${id}-${safeFileName(input.fileName || `${input.kind}.md`)}`;
  const absolutePath = path.join(ASSET_DIR, fileName);
  fs.writeFileSync(absolutePath, input.content, "utf8");
  const stat = fs.statSync(absolutePath);
  const record: SoftwareFactoryAssetRecord = {
    id,
    runId: input.runId,
    kind: input.kind,
    status: "stored",
    title: input.title,
    fileName,
    relativePath: path.relative(process.cwd(), absolutePath),
    sizeBytes: stat.size,
    notes: input.notes || "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  records.set(record.id, record);
  persist();
  return record;
}

export function listSoftwareFactoryAssets() {
  hydrate();
  return Array.from(records.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSoftwareFactoryAsset(id: string) {
  hydrate();
  return records.get(id) || null;
}

export function readSoftwareFactoryAssetContent(id: string) {
  const record = getSoftwareFactoryAsset(id);
  if (!record) return null;
  const absolutePath = path.join(process.cwd(), record.relativePath);
  if (!fs.existsSync(absolutePath)) return { record, content: null };
  return { record, content: fs.readFileSync(absolutePath, "utf8") };
}

export function updateSoftwareFactoryAssetStatus(id: string, status: SoftwareFactoryAssetStatus, notes?: string) {
  hydrate();
  const record = records.get(id);
  if (!record) return null;
  const updated: SoftwareFactoryAssetRecord = {
    ...record,
    status,
    notes: notes ?? record.notes,
    updatedAt: now(),
  };
  records.set(id, updated);
  persist();
  return updated;
}

export function seedSoftwareFactoryAssets(runId = "sample-run") {
  hydrate();
  if (records.size > 0) return listSoftwareFactoryAssets();
  createSoftwareFactoryAsset({ runId, kind: "document", title: "Product brief", fileName: "product-brief.md", content: "# Product brief\n\nGenerated starter brief for Software Factory.", notes: "Seed document" });
  createSoftwareFactoryAsset({ runId, kind: "log", title: "Execution log", fileName: "execution-log.md", content: "# Execution log\n\nNo runtime errors recorded.", notes: "Seed log" });
  createSoftwareFactoryAsset({ runId, kind: "release", title: "Release checklist", fileName: "release-checklist.md", content: "# Release checklist\n\n- Build checked\n- Review pending\n- Release kit drafted", notes: "Seed release checklist" });
  return listSoftwareFactoryAssets();
}

export function getSoftwareFactoryAssetStats() {
  const all = listSoftwareFactoryAssets();
  const byStatus = all.reduce<Record<SoftwareFactoryAssetStatus, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, { new: 0, checked: 0, linked: 0, stored: 0 });
  return { total: all.length, byStatus, latest: all[0] || null };
}

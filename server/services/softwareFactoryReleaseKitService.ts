import { readSoftwareFactoryStore, writeSoftwareFactoryStore } from "./softwareFactoryStore";

export type SoftwareFactoryReleaseChannel = "landing_page" | "short_video" | "store_listing" | "creative_pack" | "email_draft" | "social_draft";
export type SoftwareFactoryReleaseStatus = "draft" | "ready" | "review" | "scheduled" | "complete";

export interface SoftwareFactoryReleaseItem {
  id: string;
  runId: string;
  channel: SoftwareFactoryReleaseChannel;
  title: string;
  status: SoftwareFactoryReleaseStatus;
  owner: string;
  deliverable: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareFactoryReleaseInput {
  runId: string;
  channel: SoftwareFactoryReleaseChannel;
  title: string;
  owner?: string;
  deliverable: string;
  notes?: string;
}

const STORE_NAME = "release-kit-items";
const items = new Map<string, SoftwareFactoryReleaseItem>();

function now() {
  return new Date().toISOString();
}

function createId(prefix = "sfrk") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hydrate() {
  if (items.size > 0) return;
  for (const item of readSoftwareFactoryStore<SoftwareFactoryReleaseItem>(STORE_NAME)) {
    items.set(item.id, item);
  }
}

function persist() {
  writeSoftwareFactoryStore(STORE_NAME, Array.from(items.values()));
}

export function createSoftwareFactoryReleaseItem(input: SoftwareFactoryReleaseInput) {
  hydrate();
  const timestamp = now();
  const item: SoftwareFactoryReleaseItem = {
    id: createId(),
    runId: input.runId,
    channel: input.channel,
    title: input.title,
    status: "draft",
    owner: input.owner || "Growth Automation",
    deliverable: input.deliverable,
    notes: input.notes || "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  items.set(item.id, item);
  persist();
  return item;
}

export function listSoftwareFactoryReleaseItems() {
  hydrate();
  return Array.from(items.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSoftwareFactoryReleaseItem(id: string) {
  hydrate();
  return items.get(id) || null;
}

export function updateSoftwareFactoryReleaseStatus(id: string, status: SoftwareFactoryReleaseStatus, notes?: string) {
  hydrate();
  const item = items.get(id);
  if (!item) return null;
  const updated: SoftwareFactoryReleaseItem = {
    ...item,
    status,
    notes: notes ?? item.notes,
    updatedAt: now(),
  };
  items.set(id, updated);
  persist();
  return updated;
}

export function seedSoftwareFactoryReleaseItems(runId = "sample-run") {
  hydrate();
  if (items.size > 0) return listSoftwareFactoryReleaseItems();
  createSoftwareFactoryReleaseItem({ runId, channel: "landing_page", title: "Main landing page", deliverable: "Hero, CTA, feature blocks, pricing and FAQ" });
  createSoftwareFactoryReleaseItem({ runId, channel: "short_video", title: "Short video script pack", owner: "Media Cell", deliverable: "15s, 30s and 60s video scripts" });
  createSoftwareFactoryReleaseItem({ runId, channel: "store_listing", title: "Store listing copy", deliverable: "Title, description, keywords and screenshots checklist" });
  createSoftwareFactoryReleaseItem({ runId, channel: "creative_pack", title: "Creative hook variants", owner: "Monetization Analyst", deliverable: "Audience angles, hooks and creative notes" });
  return listSoftwareFactoryReleaseItems();
}

export function getSoftwareFactoryReleaseStats() {
  const all = listSoftwareFactoryReleaseItems();
  const byStatus = all.reduce<Record<SoftwareFactoryReleaseStatus, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, { draft: 0, ready: 0, review: 0, scheduled: 0, complete: 0 });
  return { total: all.length, byStatus, latest: all[0] || null };
}

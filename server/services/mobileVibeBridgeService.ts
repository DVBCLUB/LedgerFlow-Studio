import fs from "fs";
import path from "path";
import { getSupabaseClient } from "./hybridStorageService.ts";
import { loadLocalDatabase, saveLocalDatabase } from "./localDatabase.ts";

export interface MobileVibeItem {
  id: string;
  type: "code_snippet" | "idea" | "ai_task" | "voice_note" | "bug_report";
  title: string;
  content: string;
  codeSnippet?: {
    language: string;
    code: string;
    filename?: string;
  };
  aiProvider?: string;
  aiResponse?: string;
  tags?: string[];
  createdAt: string;
  syncedToDesktop?: boolean;
}

const INBOX_FILE = path.join(process.cwd(), "runtime", "mobile_vibe_inbox.json");

/**
 * Đọc toàn bộ danh sách Inbox đang chờ từ Mobile
 */
export async function getMobileVibeInbox(): Promise<MobileVibeItem[]> {
  let localItems: MobileVibeItem[] = [];

  // 1. Đọc từ local file cache
  if (fs.existsSync(INBOX_FILE)) {
    try {
      const raw = await fs.promises.readFile(INBOX_FILE, "utf-8");
      localItems = JSON.parse(raw);
    } catch {
      localItems = [];
    }
  }

  // 2. Thử đọc từ Supabase Cloud Inbox nếu có
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("mobile_vibe_inbox")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const cloudItems: MobileVibeItem[] = data.map((row: any) => ({
          id: row.id,
          type: row.type || "idea",
          title: row.title || "Untitled",
          content: row.content || "",
          codeSnippet: row.code_snippet,
          aiProvider: row.ai_provider,
          aiResponse: row.ai_response,
          tags: row.tags,
          createdAt: row.created_at,
          syncedToDesktop: row.synced_to_desktop ?? false,
        }));

        // Merge theo ID (ưu tiên mới nhất)
        const itemMap = new Map<string, MobileVibeItem>();
        for (const item of [...cloudItems, ...localItems]) {
          itemMap.set(item.id, item);
        }
        return Array.from(itemMap.values());
      }
    } catch (err) {
      console.warn("⚠️ [MobileVibe] Supabase inbox fetch fallback to local:", err);
    }
  }

  return localItems;
}

/**
 * Đẩy một item mới từ Mobile vào Inbox
 */
export async function pushToMobileVibeInbox(item: Omit<MobileVibeItem, "id" | "createdAt"> & { id?: string }): Promise<MobileVibeItem> {
  const newItem: MobileVibeItem = {
    id: item.id || `vibe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: item.type,
    title: item.title || "Ý tưởng từ Mobile",
    content: item.content || "",
    codeSnippet: item.codeSnippet,
    aiProvider: item.aiProvider,
    aiResponse: item.aiResponse,
    tags: item.tags || ["mobile_vibe"],
    createdAt: new Date().toISOString(),
    syncedToDesktop: false,
  };

  // 1. Ghi vào Local file
  const current = await getMobileVibeInbox();
  const updated = [newItem, ...current.filter((x) => x.id !== newItem.id)];
  await fs.promises.mkdir(path.dirname(INBOX_FILE), { recursive: true });
  await fs.promises.writeFile(INBOX_FILE, JSON.stringify(updated, null, 2), "utf-8");

  // 2. Ghi lên Supabase nếu có
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("mobile_vibe_inbox").upsert(
        {
          id: newItem.id,
          type: newItem.type,
          title: newItem.title,
          content: newItem.content,
          code_snippet: newItem.codeSnippet,
          ai_provider: newItem.aiProvider,
          ai_response: newItem.aiResponse,
          tags: newItem.tags,
          created_at: newItem.createdAt,
          synced_to_desktop: false,
        },
        { onConflict: "id" }
      );
    } catch (err) {
      console.warn("⚠️ [MobileVibe] Supabase upsert error:", err);
    }
  }

  return newItem;
}

/**
 * Kéo toàn bộ dữ liệu từ Mobile Inbox về kho lưu trữ chính của PC Studio (db_storage.json)
 */
export async function pullMobileVibeToDesktop(storageFile: string): Promise<{
  pulledCount: number;
  mergedItems: MobileVibeItem[];
}> {
  const inbox = await getMobileVibeInbox();
  const unsynced = inbox.filter((x) => !x.syncedToDesktop);

  if (unsynced.length === 0) {
    return { pulledCount: 0, mergedItems: [] };
  }

  // Đọc database hiện tại của PC
  const dbData = await loadLocalDatabase(storageFile);
  const fastrackSnippets: any[] = Array.isArray(dbData.fastrack_saved_snippets)
    ? [...dbData.fastrack_saved_snippets]
    : [];
  const guerrillaIdeas: any[] = Array.isArray(dbData.guerrilla_unexpected_ideas)
    ? [...dbData.guerrilla_unexpected_ideas]
    : [];

  for (const item of unsynced) {
    if (item.type === "code_snippet" && item.codeSnippet) {
      fastrackSnippets.unshift({
        id: item.id,
        title: item.title,
        description: item.content,
        code: item.codeSnippet.code,
        language: item.codeSnippet.language,
        tags: item.tags,
        source: "mobile_vibe",
        createdAt: item.createdAt,
      });
    } else {
      guerrillaIdeas.unshift({
        id: item.id,
        title: item.title,
        description: item.content,
        type: item.type,
        aiResponse: item.aiResponse,
        source: "mobile_vibe",
        createdAt: item.createdAt,
      });
    }
  }

  dbData.fastrack_saved_snippets = fastrackSnippets;
  dbData.guerrilla_unexpected_ideas = guerrillaIdeas;
  await saveLocalDatabase(storageFile, dbData);

  // Đánh dấu đã sync
  const updatedInbox = inbox.map((x) => ({ ...x, syncedToDesktop: true }));
  await fs.promises.writeFile(INBOX_FILE, JSON.stringify(updatedInbox, null, 2), "utf-8");

  // Cập nhật Supabase nếu có
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const ids = unsynced.map((x) => x.id);
      await supabase.from("mobile_vibe_inbox").update({ synced_to_desktop: true }).in("id", ids);
    } catch {
      // bỏ qua lỗi cloud
    }
  }

  return {
    pulledCount: unsynced.length,
    mergedItems: unsynced,
  };
}

/**
 * Xóa 1 item khỏi inbox
 */
export async function deleteMobileVibeItem(id: string): Promise<boolean> {
  const current = await getMobileVibeInbox();
  const updated = current.filter((x) => x.id !== id);
  await fs.promises.writeFile(INBOX_FILE, JSON.stringify(updated, null, 2), "utf-8");

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("mobile_vibe_inbox").delete().eq("id", id);
    } catch {
      // bỏ qua
    }
  }
  return true;
}

import fs from "fs";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { loadLocalDatabase, saveLocalDatabase } from "./localDatabase.ts";

export interface HybridStorageStatus {
  mode: "local_only" | "hybrid_synced" | "hybrid_degraded";
  supabaseConfigured: boolean;
  supabaseConnected: boolean;
  localStoragePath: string;
  lastLocalSyncAt: string | null;
  lastCloudSyncAt: string | null;
  keysCount: number;
  lastError?: string;
}

let cachedSupabaseClient: SupabaseClient | null = null;
let lastCloudSyncTimestamp: string | null = null;
let lastLocalSyncTimestamp: string | null = null;
let lastSyncError: string | undefined = undefined;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!cachedSupabaseClient) {
    try {
      cachedSupabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err: any) {
      lastSyncError = `Supabase client init failed: ${err?.message || String(err)}`;
      return null;
    }
  }

  return cachedSupabaseClient;
}

/**
 * Đọc dữ liệu từ Dual-Engine:
 * 1. Ưu tiên đọc file local trước (tốc độ cao, không gián đoạn nếu offline).
 * 2. Nếu local rỗng hoặc đang ở môi trường Cloud (Railway), thử fetch từ Supabase.
 */
export async function loadHybridDatabase(storageFile: string): Promise<Record<string, unknown>> {
  let localData: Record<string, unknown> = {};

  try {
    localData = await loadLocalDatabase(storageFile);
    if (Object.keys(localData).length > 0) {
      lastLocalSyncTimestamp = new Date().toISOString();
    }
  } catch (err: any) {
    console.warn("⚠️ [HybridStorage] Local read warning:", err?.message || err);
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Đọc bản snapshot từ bảng ledgerflow_app_state (key='main_state')
      const { data, error } = await supabase
        .from("ledgerflow_app_state")
        .select("payload, updated_at")
        .eq("key", "main_state")
        .maybeSingle();

      if (!error && data?.payload && typeof data.payload === "object") {
        lastCloudSyncTimestamp = data.updated_at || new Date().toISOString();
        const cloudData = data.payload as Record<string, unknown>;

        // Merge dữ liệu thông minh: kết hợp local và cloud
        if (Object.keys(localData).length === 0) {
          // Local chưa có gì, cập nhật local từ cloud
          await saveLocalDatabase(storageFile, cloudData).catch(() => undefined);
          return cloudData;
        } else {
          // Cả hai đều có, merge kết quả (ưu tiên local cập nhật nhất)
          const merged = { ...cloudData, ...localData };
          return merged;
        }
      }
    } catch (err: any) {
      lastSyncError = `Supabase load error: ${err?.message || String(err)}`;
    }
  }

  return localData;
}

/**
 * Lưu dữ liệu vào Dual-Engine:
 * 1. Luôn ghi an toàn xuống Local PC File `db_storage.json` trước.
 * 2. Đồng thời đẩy bất đồng bộ lên Supabase Free Tier (nếu có config).
 */
export async function saveHybridDatabase(storageFile: string, payload: Record<string, unknown>): Promise<{
  savedLocal: boolean;
  savedCloud: boolean;
  error?: string;
}> {
  let savedLocal = false;
  let savedCloud = false;
  let errorMsg: string | undefined;

  // 1. Lưu Local PC
  try {
    await saveLocalDatabase(storageFile, payload);
    savedLocal = true;
    lastLocalSyncTimestamp = new Date().toISOString();
  } catch (err: any) {
    errorMsg = `Local save error: ${err?.message || String(err)}`;
    console.error("🔴 [HybridStorage]", errorMsg);
  }

  // 2. Lưu Cloud Supabase (Free Tier)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from("ledgerflow_app_state")
        .upsert(
          {
            key: "main_state",
            payload: payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (error) {
        lastSyncError = error.message;
        errorMsg = errorMsg ? `${errorMsg}; Supabase: ${error.message}` : `Supabase: ${error.message}`;
      } else {
        savedCloud = true;
        lastCloudSyncTimestamp = new Date().toISOString();
        lastSyncError = undefined;
      }
    } catch (err: any) {
      const msg = `Supabase push failed: ${err?.message || String(err)}`;
      lastSyncError = msg;
      errorMsg = errorMsg ? `${errorMsg}; ${msg}` : msg;
    }
  }

  return { savedLocal, savedCloud, error: errorMsg };
}

/**
 * Kiểm tra trạng thái Hybrid Storage (Local & Cloud Sync)
 */
export async function getHybridStorageStatus(storageFile: string): Promise<HybridStorageStatus> {
  const supabase = getSupabaseClient();
  const supabaseConfigured = !!supabase;
  let supabaseConnected = false;

  if (supabase) {
    try {
      const { error } = await supabase.from("ledgerflow_app_state").select("key").limit(1);
      supabaseConnected = !error;
    } catch {
      supabaseConnected = false;
    }
  }

  let keysCount = 0;
  try {
    const localData = await loadLocalDatabase(storageFile);
    keysCount = Object.keys(localData).length;
  } catch {
    keysCount = 0;
  }

  let mode: HybridStorageStatus["mode"] = "local_only";
  if (supabaseConfigured && supabaseConnected) {
    mode = "hybrid_synced";
  } else if (supabaseConfigured && !supabaseConnected) {
    mode = "hybrid_degraded";
  }

  return {
    mode,
    supabaseConfigured,
    supabaseConnected,
    localStoragePath: storageFile,
    lastLocalSyncAt: lastLocalSyncTimestamp,
    lastCloudSyncAt: lastCloudSyncTimestamp,
    keysCount,
    lastError: lastSyncError,
  };
}

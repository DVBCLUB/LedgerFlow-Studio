/**
 * supabaseClient.ts
 * ============================================================
 * Shared server-side Supabase helpers (admin/service role).
 * Dùng SUPABASE_URL + SUPABASE_SERVICE_KEY — fallback VITE_* khi dev local.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function supabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) throw new Error('SUPABASE_URL và SUPABASE_SERVICE_KEY chưa cấu hình.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Upload 1 file local lên Supabase Storage (bucket mặc định 'media').
 * Dùng để archive video/ảnh/game — giữ máy nhẹ.
 */
export async function archiveMediaToSupabase(
  localPath: string,
  bucket = 'media'
): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Supabase chưa cấu hình.' };
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const data = await fs.readFile(localPath);
    const fileName = path.basename(localPath);
    const objectPath = `archive/${Date.now()}_${fileName}`;
    const sb = supabaseAdmin();
    const { error } = await sb.storage.from(bucket).upload(objectPath, data, { upsert: true });
    if (error) return { ok: false, error: error.message };
    const { data: pub } = sb.storage.from(bucket).getPublicUrl(objectPath);
    return { ok: true, url: pub.publicUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

import fs from 'fs';
import path from 'path';
import { ensureRuntimeRootSync, resolveRuntimeDirPath, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

export interface WebAIProfile {
  id: string; // e.g. "profile_1718000000"
  name: string; // e.g. "Gmail Cá Nhân", "Gmail Công Ty"
  platform: string; // "chatgpt" | "gemini" | "claude" | "deepseek" | "grok" | "copilot"
  profileDir: string; // Folder name under .chrome_profiles/ or absolute path for local profiles
  createdAt: string;
  lastUsedAt?: string;
  enabled: boolean;
  status: WebAIProfileStatus;
  quotaResetAt?: string;
  lastError?: string;
  consecutiveFailures: number;
  type?: "sandboxed" | "local";
  metadata?: {
    lastConversationId?: string;
  };
}

export const WEB_AI_PLATFORMS = ["chatgpt", "gemini", "claude", "deepseek", "grok", "copilot"] as const;
export type WebAIPlatform = (typeof WEB_AI_PLATFORMS)[number];
export type WebAIProfileStatus = "untested" | "ready" | "quota" | "login_required" | "error";

export interface WebAIProfileResult {
  status: Exclude<WebAIProfileStatus, "untested">;
  error?: string;
  quotaResetAt?: string;
}

export interface WebAIProfilePatch {
  name?: string;
  enabled?: boolean;
  status?: WebAIProfileStatus;
  quotaResetAt?: string | null;
  lastError?: string | null;
}

const PROFILES_FILE = resolveRuntimePathFromEnv('WEB_AI_PROFILES_FILE', 'web_ai_profiles.json');
const CHROME_PROFILES_DIR = resolveRuntimeDirPath('.chrome_profiles');

export class WebAiSessionManager {
  public static isSupportedPlatform(platform: string): platform is WebAIPlatform {
    return WEB_AI_PLATFORMS.includes(platform.trim().toLowerCase() as WebAIPlatform);
  }

  private static normalizeProfile(profile: Partial<WebAIProfile>): WebAIProfile | null {
    const platform = String(profile.platform || "").trim().toLowerCase();
    if (!profile.id || !profile.name || !profile.profileDir || !profile.createdAt || !this.isSupportedPlatform(platform)) return null;
    return {
      id: profile.id,
      name: profile.name,
      platform,
      profileDir: path.isAbsolute(profile.profileDir) ? profile.profileDir : path.basename(profile.profileDir),
      createdAt: profile.createdAt,
      lastUsedAt: profile.lastUsedAt,
      enabled: profile.enabled !== false,
      status: profile.status ?? "untested",
      quotaResetAt: profile.quotaResetAt,
      lastError: profile.lastError,
      consecutiveFailures: Math.max(0, profile.consecutiveFailures ?? 0),
      type: profile.type ?? (path.isAbsolute(profile.profileDir) ? "local" : "sandboxed"),
      metadata: profile.metadata,
    };
  }

  private static async readProfiles(): Promise<WebAIProfile[]> {
    try {
      const profilesFile = resolveRuntimeReadPathFromEnv('WEB_AI_PROFILES_FILE', 'web_ai_profiles.json');
      if (!fs.existsSync(profilesFile)) {
        return [];
      }
      const data = await fs.promises.readFile(profilesFile, 'utf8');
      const parsed = JSON.parse(data) as Partial<WebAIProfile>[];
      return Array.isArray(parsed)
        ? parsed.map((profile) => this.normalizeProfile(profile)).filter((profile): profile is WebAIProfile => Boolean(profile))
        : [];
    } catch (err) {
      console.error('[Web AI Session Manager] Error reading profiles file:', err);
      return [];
    }
  }

  private static async writeProfiles(profiles: WebAIProfile[]): Promise<void> {
    try {
      ensureRuntimeRootSync();
      await fs.promises.writeFile(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf8');
    } catch (err) {
      console.error('[Web AI Session Manager] Error writing profiles file:', err);
    }
  }

  public static async listProfiles(): Promise<WebAIProfile[]> {
    return this.readProfiles();
  }

  public static async createProfile(name: string, platform: string, customPath?: string): Promise<WebAIProfile> {
    const normalizedPlatform = platform.trim().toLowerCase();
    if (!this.isSupportedPlatform(normalizedPlatform)) throw new Error(`Unsupported Web AI platform: ${platform}`);
    const id = `profile_${Date.now()}`;
    
    let profileDir = "";
    let type: "sandboxed" | "local" = "sandboxed";

    if (customPath?.trim()) {
      profileDir = customPath.trim();
      type = "local";
    } else {
      profileDir = `${normalizedPlatform}_${id}`;
      // Ensure .chrome_profiles dir exists
      if (!fs.existsSync(CHROME_PROFILES_DIR)) {
        fs.mkdirSync(CHROME_PROFILES_DIR, { recursive: true });
      }
      const newProfilePath = path.join(CHROME_PROFILES_DIR, profileDir);
      if (!fs.existsSync(newProfilePath)) {
        fs.mkdirSync(newProfilePath, { recursive: true });
      }
    }

    const profiles = await this.readProfiles();
    const newProfile: WebAIProfile = {
      id,
      name,
      platform: normalizedPlatform,
      profileDir,
      createdAt: new Date().toISOString(),
      enabled: true,
      status: "untested",
      consecutiveFailures: 0,
      type,
    };

    profiles.push(newProfile);
    await this.writeProfiles(profiles);
    return newProfile;
  }

  public static async deleteProfile(id: string): Promise<boolean> {
    const profiles = await this.readProfiles();
    const idx = profiles.findIndex(p => p.id === id);
    if (idx < 0) return false;

    const profile = profiles[idx];
    const profilePath = this.getProfilePath(profile.profileDir);

    // Remove the profile directory if it is a sandboxed one
    if (profile.type !== "local" && !path.isAbsolute(profile.profileDir)) {
      try {
        if (fs.existsSync(profilePath)) {
          fs.rmSync(profilePath, { recursive: true, force: true });
        }
      } catch (err) {
        console.error(`[Web AI Session Manager] Error deleting profile directory ${profilePath}:`, err);
      }
    }

    profiles.splice(idx, 1);
    await this.writeProfiles(profiles);
    return true;
  }

  public static async updateProfileLastUsed(id: string): Promise<void> {
    const profiles = await this.readProfiles();
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      profile.lastUsedAt = new Date().toISOString();
      await this.writeProfiles(profiles);
    }
  }

  public static async getProfileForPlatform(id: string, platform: string): Promise<WebAIProfile> {
    const normalizedPlatform = platform.trim().toLowerCase();
    const profile = (await this.readProfiles()).find((item) => item.id === id);
    if (!profile) throw new Error(`Web AI profile not found: ${id}`);
    if (!profile.enabled) throw new Error(`Web AI profile is disabled: ${profile.name}`);
    if (profile.platform !== normalizedPlatform) {
      throw new Error(`Profile "${profile.name}" belongs to ${profile.platform}, not ${normalizedPlatform}.`);
    }
    return profile;
  }

  public static async listAvailableProfiles(platform: string, preferredId?: string): Promise<WebAIProfile[]> {
    const now = Date.now();
    const profiles = (await this.readProfiles()).filter((profile) => {
      if (!profile.enabled || profile.platform !== platform.trim().toLowerCase()) return false;
      if (profile.status !== "quota") return true;
      if (!profile.quotaResetAt) return false;
      return Date.parse(profile.quotaResetAt) <= now;
    });
    return profiles.sort((a, b) => {
      if (a.id === preferredId) return -1;
      if (b.id === preferredId) return 1;
      const rank = (profile: WebAIProfile) => profile.status === "ready" ? 0 : profile.status === "untested" ? 1 : 2;
      return rank(a) - rank(b) || a.consecutiveFailures - b.consecutiveFailures;
    });
  }

  public static async recordProfileResult(id: string, result: WebAIProfileResult): Promise<void> {
    const profiles = await this.readProfiles();
    const profile = profiles.find((item) => item.id === id);
    if (!profile) return;
    profile.lastUsedAt = new Date().toISOString();
    profile.status = result.status;
    profile.lastError = result.error;
    profile.quotaResetAt = result.status === "quota" ? result.quotaResetAt : undefined;
    profile.consecutiveFailures = result.status === "ready" ? 0 : profile.consecutiveFailures + 1;
    await this.writeProfiles(profiles);
  }

  public static async updateProfileConversation(id: string, conversationId: string): Promise<void> {
    const profiles = await this.readProfiles();
    const profile = profiles.find((item) => item.id === id);
    if (!profile) return;
    profile.metadata = {
      ...profile.metadata,
      lastConversationId: conversationId,
    };
    await this.writeProfiles(profiles);
  }

  public static async updateProfile(id: string, patch: WebAIProfilePatch): Promise<WebAIProfile> {
    const profiles = await this.readProfiles();
    const profile = profiles.find((item) => item.id === id);
    if (!profile) {
      throw new Error(`Web AI profile not found: ${id}`);
    }

    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) {
        throw new Error("Profile name cannot be empty.");
      }
      profile.name = name;
    }
    if (patch.enabled !== undefined) {
      profile.enabled = patch.enabled;
    }
    if (patch.status !== undefined) {
      profile.status = patch.status;
    }
    if (patch.quotaResetAt !== undefined) {
      profile.quotaResetAt = patch.quotaResetAt || undefined;
    }
    if (patch.lastError !== undefined) {
      profile.lastError = patch.lastError || undefined;
    }

    await this.writeProfiles(profiles);
    return profile;
  }

  public static getProfilePath(profileDir: string): string {
    if (path.isAbsolute(profileDir)) return profileDir;
    const safeName = path.basename(profileDir);
    const resolved = path.resolve(CHROME_PROFILES_DIR, safeName);
    const root = path.resolve(CHROME_PROFILES_DIR) + path.sep;
    if (!resolved.startsWith(root)) throw new Error("Unsafe Web AI profile path.");
    return resolved;
  }
}

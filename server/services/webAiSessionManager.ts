import fs from 'fs';
import path from 'path';

export interface WebAIProfile {
  id: string; // e.g. "profile_1718000000"
  name: string; // e.g. "Gmail Cá Nhân", "Gmail Công Ty"
  platform: string; // "chatgpt" | "gemini" | "claude" | "deepseek" | "grok" | "copilot"
  profileDir: string; // Folder name under .chrome_profiles/
  createdAt: string;
  lastUsedAt?: string;
}

const PROFILES_FILE = path.join(process.cwd(), 'web_ai_profiles.json');
const CHROME_PROFILES_DIR = path.join(process.cwd(), '.chrome_profiles');

export class WebAiSessionManager {
  private static async readProfiles(): Promise<WebAIProfile[]> {
    try {
      if (!fs.existsSync(PROFILES_FILE)) {
        return [];
      }
      const data = await fs.promises.readFile(PROFILES_FILE, 'utf8');
      return JSON.parse(data) as WebAIProfile[];
    } catch (err) {
      console.error('[Web AI Session Manager] Error reading profiles file:', err);
      return [];
    }
  }

  private static async writeProfiles(profiles: WebAIProfile[]): Promise<void> {
    try {
      await fs.promises.writeFile(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf8');
    } catch (err) {
      console.error('[Web AI Session Manager] Error writing profiles file:', err);
    }
  }

  public static async listProfiles(): Promise<WebAIProfile[]> {
    return this.readProfiles();
  }

  public static async createProfile(name: string, platform: string): Promise<WebAIProfile> {
    const id = `profile_${Date.now()}`;
    const profileDir = `${platform}_${id}`;
    
    // Ensure .chrome_profiles dir exists
    if (!fs.existsSync(CHROME_PROFILES_DIR)) {
      fs.mkdirSync(CHROME_PROFILES_DIR, { recursive: true });
    }

    const newProfilePath = path.join(CHROME_PROFILES_DIR, profileDir);
    if (!fs.existsSync(newProfilePath)) {
      fs.mkdirSync(newProfilePath, { recursive: true });
    }

    const profiles = await this.readProfiles();
    const newProfile: WebAIProfile = {
      id,
      name,
      platform: platform.toLowerCase(),
      profileDir,
      createdAt: new Date().toISOString(),
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
    const profilePath = path.join(CHROME_PROFILES_DIR, profile.profileDir);

    // Remove the profile directory
    try {
      if (fs.existsSync(profilePath)) {
        fs.rmSync(profilePath, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`[Web AI Session Manager] Error deleting profile directory ${profilePath}:`, err);
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

  public static getProfilePath(profileDir: string): string {
    return path.join(CHROME_PROFILES_DIR, profileDir);
  }
}

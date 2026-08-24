import fs from "fs";
import path from "path";
import { appendIntegrationEvent } from "./integrationRegistry.ts";
import { appendCompanyOsEvent } from "./companyOsControlPlane.ts";

const MEDIA_DIR = path.join(process.cwd(), ".media_pipeline");
const CALENDAR_FILE = path.join(MEDIA_DIR, "calendar.json");
const UPLOADS_LOG = path.join(MEDIA_DIR, "uploads.log");

export interface MediaSyncDetails {
  ok: boolean;
  scheduledCount: number;
  publishedCount: number;
  totalViews: number;
  localPath: string;
}

export interface VideoSchedule {
  id: string;
  title: string;
  platform: "tiktok" | "youtube" | "facebook";
  scheduledDate: string;
  status: "draft" | "scheduled" | "published";
  views: number;
  notes?: string;
  createdAt: string;
}

export class MediaSyncConnector {
  /**
   * Ensure local simulation structure exists
   */
  public static ensureInitialized(): void {
    if (!fs.existsSync(MEDIA_DIR)) {
      fs.mkdirSync(MEDIA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CALENDAR_FILE)) {
      fs.writeFileSync(CALENDAR_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  }

  /**
   * Test connection: returns video calendar schedule stats and view count metrics
   */
  public static async testConnection(): Promise<MediaSyncDetails> {
    this.ensureInitialized();

    let calendar: VideoSchedule[] = [];
    try {
      const raw = fs.readFileSync(CALENDAR_FILE, "utf-8");
      calendar = JSON.parse(raw);
    } catch {
      calendar = [];
    }

    const scheduled = calendar.filter(v => v.status === "scheduled").length;
    const published = calendar.filter(v => v.status === "published").length;
    const totalViews = calendar.reduce((acc, v) => acc + (v.views || 0), 0);

    const details: MediaSyncDetails = {
      ok: true,
      scheduledCount: scheduled,
      publishedCount: published,
      totalViews,
      localPath: MEDIA_DIR,
    };

    await appendIntegrationEvent({
      connectorId: "media-pipeline",
      type: "status",
      level: "success",
      message: `Media Pipeline Active. Tracked ${calendar.length} videos: ${scheduled} scheduled, ${published} published with ${totalViews.toLocaleString()} total views.`,
    });

    await appendCompanyOsEvent({
      source: "system",
      eventType: "workspace.sync_status",
      title: "Media Pipeline Checked",
      body: `Media pipeline calendar verified successfully at ${MEDIA_DIR}.`,
      risk: "low",
      payload: details as any,
    });

    return details;
  }

  /**
   * Schedule a video to the content calendar
   */
  public static async scheduleVideo(
    title: string,
    platform: "tiktok" | "youtube" | "facebook",
    scheduledDate: string,
    notes?: string
  ): Promise<VideoSchedule> {
    this.ensureInitialized();

    let calendar: VideoSchedule[] = [];
    try {
      const raw = await fs.promises.readFile(CALENDAR_FILE, "utf-8");
      calendar = JSON.parse(raw);
    } catch {
      calendar = [];
    }

    const newVideo: VideoSchedule = {
      id: `vid_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
      title,
      platform,
      scheduledDate,
      status: "scheduled",
      views: 0,
      notes,
      createdAt: new Date().toISOString(),
    };

    calendar.push(newVideo);
    await fs.promises.writeFile(CALENDAR_FILE, JSON.stringify(calendar, null, 2), "utf-8");

    await appendIntegrationEvent({
      connectorId: "media-pipeline",
      type: "note",
      level: "success",
      message: `Scheduled media content: "${title}" [${platform.toUpperCase()}] for ${scheduledDate}`,
    });

    return newVideo;
  }

  /**
   * Log media upload run and sync database status
   */
  public static async logVideoUpload(videoId: string, viewCount = 0): Promise<void> {
    this.ensureInitialized();

    let calendar: VideoSchedule[] = [];
    try {
      const raw = await fs.promises.readFile(CALENDAR_FILE, "utf-8");
      calendar = JSON.parse(raw);
    } catch {
      calendar = [];
    }

    const video = calendar.find(v => v.id === videoId);
    if (video) {
      video.status = "published";
      video.views = viewCount;
      await fs.promises.writeFile(CALENDAR_FILE, JSON.stringify(calendar, null, 2), "utf-8");
      
      const logEntry = `
Timestamp: ${new Date().toISOString()}
Video ID: ${videoId}
Title: "${video.title}"
Platform: ${video.platform.toUpperCase()}
Status: UPLOADED
Views Logged: ${viewCount}
========================================
`;
      await fs.promises.appendFile(UPLOADS_LOG, logEntry, "utf-8");

      await appendIntegrationEvent({
        connectorId: "media-pipeline",
        type: "handoff",
        level: "info",
        message: `Published video "${video.title}" on ${video.platform.toUpperCase()} with ${viewCount} initial views.`,
      });
    }
  }
}

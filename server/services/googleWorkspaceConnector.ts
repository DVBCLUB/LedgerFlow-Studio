import fs from "fs";
import path from "path";
import { appendIntegrationEvent } from "./integrationRegistry.ts";
import { appendCompanyOsEvent } from "./companyOsControlPlane.ts";

const GOOGLE_DRIVE_DIR = path.join(process.cwd(), ".google_drive");
const DRIVE_SUBDIR = path.join(GOOGLE_DRIVE_DIR, "Drive");
const SHEETS_SUBDIR = path.join(GOOGLE_DRIVE_DIR, "Sheets");
const GMAIL_SUBDIR = path.join(GOOGLE_DRIVE_DIR, "Gmail");

export interface WorkspaceSyncDetails {
  ok: boolean;
  driveFilesCount: number;
  sheetsCount: number;
  emailsSentCount: number;
  localPath: string;
}

export class GoogleWorkspaceConnector {
  /**
   * Ensure local simulation structure exists
   */
  public static ensureInitialized(): void {
    const dirs = [GOOGLE_DRIVE_DIR, DRIVE_SUBDIR, SHEETS_SUBDIR, GMAIL_SUBDIR];
    for (const d of dirs) {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    }
  }

  /**
   * Test connection: initializes folders and logs connection status
   */
  public static async testConnection(): Promise<WorkspaceSyncDetails> {
    this.ensureInitialized();
    
    // Read statistics
    const driveFiles = fs.readdirSync(DRIVE_SUBDIR);
    const sheetsFiles = fs.readdirSync(SHEETS_SUBDIR);
    
    let emailsCount = 0;
    const emailLogPath = path.join(GMAIL_SUBDIR, "sent_emails.log");
    if (fs.existsSync(emailLogPath)) {
      const content = fs.readFileSync(emailLogPath, "utf-8");
      emailsCount = content.split("========================================").length - 1;
    }

    const details: WorkspaceSyncDetails = {
      ok: true,
      driveFilesCount: driveFiles.length,
      sheetsCount: sheetsFiles.length,
      emailsSentCount: emailsCount,
      localPath: GOOGLE_DRIVE_DIR,
    };

    await appendIntegrationEvent({
      connectorId: "google-workspace",
      type: "status",
      level: "success",
      message: `Google Workspace Local Sandbox active. Found ${details.driveFilesCount} Drive files, ${details.sheetsCount} Sheets, ${details.emailsSentCount} Gmail records.`,
    });

    await appendCompanyOsEvent({
      source: "system",
      eventType: "workspace.sync_status",
      title: "Google Workspace Sandbox Checked",
      body: `Local directory synced successfully at ${GOOGLE_DRIVE_DIR}.`,
      risk: "low",
      payload: details as any,
    });

    return details;
  }

  /**
   * Sync/save file to Drive
   */
  public static async uploadToDrive(filename: string, content: string | Buffer): Promise<string> {
    this.ensureInitialized();
    const filePath = path.join(DRIVE_SUBDIR, filename);
    await fs.promises.writeFile(filePath, content);
    
    await appendIntegrationEvent({
      connectorId: "google-workspace",
      type: "note",
      level: "info",
      message: `Uploaded file to Google Drive: ${filename}`,
    });

    return filePath;
  }

  /**
   * Sync/save CSV spreadsheet to Google Sheets
   */
  public static async exportToSheets(sheetName: string, headers: string[], rows: any[][]): Promise<string> {
    this.ensureInitialized();
    const filename = `${sheetName.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`;
    const filePath = path.join(SHEETS_SUBDIR, filename);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => {
        const val = String(cell ?? "");
        return val.includes(",") ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(","))
    ].join("\n");

    await fs.promises.writeFile(filePath, csvContent, "utf-8");

    await appendIntegrationEvent({
      connectorId: "google-workspace",
      type: "note",
      level: "success",
      message: `Exported worksheet to Google Sheets: ${filename} (${rows.length} rows)`,
    });

    return filePath;
  }

  /**
   * Send notification/email simulation
   */
  public static async sendGmail(to: string, subject: string, body: string): Promise<void> {
    this.ensureInitialized();
    const emailLogPath = path.join(GMAIL_SUBDIR, "sent_emails.log");
    
    const entry = `
Date: ${new Date().toISOString()}
To: ${to}
Subject: ${subject}
Body:
${body}
========================================
`;

    await fs.promises.appendFile(emailLogPath, entry, "utf-8");

    await appendIntegrationEvent({
      connectorId: "google-workspace",
      type: "note",
      level: "info",
      message: `Gmail notification dispatched to ${to} (Subject: "${subject}")`,
    });
  }
}

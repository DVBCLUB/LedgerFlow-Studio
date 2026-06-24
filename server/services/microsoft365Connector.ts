import fs from "fs";
import path from "path";
import { appendIntegrationEvent } from "./integrationRegistry";
import { appendCompanyOsEvent } from "./companyOsControlPlane";

const M365_DIR = path.join(process.cwd(), ".microsoft_365");
const ONEDRIVE_SUBDIR = path.join(M365_DIR, "OneDrive");
const EXCEL_SUBDIR = path.join(M365_DIR, "Excel");
const OUTLOOK_SUBDIR = path.join(M365_DIR, "Outlook");

export interface M365SyncDetails {
  ok: boolean;
  oneDriveFilesCount: number;
  excelFilesCount: number;
  emailsSentCount: number;
  localPath: string;
}

export class Microsoft365Connector {
  /**
   * Ensure local simulation structure exists
   */
  public static ensureInitialized(): void {
    const dirs = [M365_DIR, ONEDRIVE_SUBDIR, EXCEL_SUBDIR, OUTLOOK_SUBDIR];
    for (const d of dirs) {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    }
  }

  /**
   * Test connection: initializes folders and logs connection status
   */
  public static async testConnection(): Promise<M365SyncDetails> {
    this.ensureInitialized();
    
    // Read statistics
    const oneDriveFiles = fs.readdirSync(ONEDRIVE_SUBDIR);
    const excelFiles = fs.readdirSync(EXCEL_SUBDIR);
    
    let emailsCount = 0;
    const emailLogPath = path.join(OUTLOOK_SUBDIR, "sent_emails.log");
    if (fs.existsSync(emailLogPath)) {
      const content = fs.readFileSync(emailLogPath, "utf-8");
      emailsCount = content.split("========================================").length - 1;
    }

    const details: M365SyncDetails = {
      ok: true,
      oneDriveFilesCount: oneDriveFiles.length,
      excelFilesCount: excelFiles.length,
      emailsSentCount: emailsCount,
      localPath: M365_DIR,
    };

    await appendIntegrationEvent({
      connectorId: "microsoft-365",
      type: "status",
      level: "success",
      message: `Microsoft 365 Local Sandbox active. Found ${details.oneDriveFilesCount} OneDrive files, ${details.excelFilesCount} Excel ledgers, ${details.emailsSentCount} Outlook records.`,
    });

    await appendCompanyOsEvent({
      source: "system",
      eventType: "workspace.sync_status",
      title: "Microsoft 365 Sandbox Checked",
      body: `Local OneDrive/Excel synced successfully at ${M365_DIR}.`,
      risk: "low",
      payload: details as any,
    });

    return details;
  }

  /**
   * Sync/save file to OneDrive
   */
  public static async uploadToOneDrive(filename: string, content: string | Buffer): Promise<string> {
    this.ensureInitialized();
    const filePath = path.join(ONEDRIVE_SUBDIR, filename);
    await fs.promises.writeFile(filePath, content);
    
    await appendIntegrationEvent({
      connectorId: "microsoft-365",
      type: "note",
      level: "info",
      message: `Uploaded file to Microsoft OneDrive: ${filename}`,
    });

    return filePath;
  }

  /**
   * Sync/save CSV spreadsheet to Excel
   */
  public static async exportToExcel(sheetName: string, headers: string[], rows: any[][]): Promise<string> {
    this.ensureInitialized();
    const filename = `${sheetName.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`;
    const filePath = path.join(EXCEL_SUBDIR, filename);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => {
        const val = String(cell ?? "");
        return val.includes(",") ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(","))
    ].join("\n");

    await fs.promises.writeFile(filePath, csvContent, "utf-8");

    await appendIntegrationEvent({
      connectorId: "microsoft-365",
      type: "note",
      level: "success",
      message: `Exported worksheet to Microsoft Excel: ${filename} (${rows.length} rows)`,
    });

    return filePath;
  }

  /**
   * Send notification/Outlook email simulation
   */
  public static async sendOutlookEmail(to: string, subject: string, body: string): Promise<void> {
    this.ensureInitialized();
    const emailLogPath = path.join(OUTLOOK_SUBDIR, "sent_emails.log");
    
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
      connectorId: "microsoft-365",
      type: "note",
      level: "info",
      message: `Outlook notification dispatched to ${to} (Subject: "${subject}")`,
    });
  }
}

import fs from "fs";
import path from "path";
import { appendIntegrationEvent } from "./integrationRegistry.ts";
import { appendCompanyOsEvent } from "./companyOsControlPlane.ts";

const NOTION_DIR = path.join(process.cwd(), ".notion_workspace");
const PAGES_SUBDIR = path.join(NOTION_DIR, "Pages");
const DATABASES_SUBDIR = path.join(NOTION_DIR, "Databases");

export interface NotionSyncDetails {
  ok: boolean;
  pagesCount: number;
  databasesCount: number;
  localPath: string;
}

export class NotionConnector {
  /**
   * Ensure local simulation structure exists
   */
  public static ensureInitialized(): void {
    const dirs = [NOTION_DIR, PAGES_SUBDIR, DATABASES_SUBDIR];
    for (const d of dirs) {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    }
  }

  /**
   * Test connection: returns count of local workspace documents
   */
  public static async testConnection(): Promise<NotionSyncDetails> {
    this.ensureInitialized();
    
    const pages = fs.readdirSync(PAGES_SUBDIR).filter(f => f.endsWith(".md"));
    const databases = fs.readdirSync(DATABASES_SUBDIR).filter(f => f.endsWith(".json"));

    const details: NotionSyncDetails = {
      ok: true,
      pagesCount: pages.length,
      databasesCount: databases.length,
      localPath: NOTION_DIR,
    };

    await appendIntegrationEvent({
      connectorId: "notion",
      type: "status",
      level: "success",
      message: `Notion Local Sandbox active. Found ${details.pagesCount} document pages, ${details.databasesCount} databases.`,
    });

    await appendCompanyOsEvent({
      source: "system",
      eventType: "workspace.sync_status",
      title: "Notion Workspace Sandbox Checked",
      body: `Local Notion markdown/json pages checked successfully at ${NOTION_DIR}.`,
      risk: "low",
      payload: details as any,
    });

    return details;
  }

  /**
   * Create/update a markdown page in Notion Pages
   */
  public static async createNotionPage(title: string, markdownContent: string): Promise<string> {
    this.ensureInitialized();
    const slug = title.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "untitled";
    const filename = `${slug}.md`;
    const filePath = path.join(PAGES_SUBDIR, filename);

    const fullContent = `# ${title}\n\n*Created via LedgerFlow Notion Connector on ${new Date().toLocaleString()}*\n\n${markdownContent}`;
    await fs.promises.writeFile(filePath, fullContent, "utf-8");

    await appendIntegrationEvent({
      connectorId: "notion",
      type: "note",
      level: "success",
      message: `Created Notion Page: ${title} (${filename})`,
    });

    return filePath;
  }

  /**
   * Update Notion Database JSON record
   */
  public static async updateNotionDatabase(dbName: string, id: string, record: Record<string, any>): Promise<string> {
    this.ensureInitialized();
    const filename = `${dbName.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
    const filePath = path.join(DATABASES_SUBDIR, filename);

    let database: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      try {
        const raw = await fs.promises.readFile(filePath, "utf-8");
        database = JSON.parse(raw);
      } catch (err) {
        database = {};
      }
    }

    database[id] = {
      ...record,
      _updatedAt: new Date().toISOString(),
    };

    await fs.promises.writeFile(filePath, JSON.stringify(database, null, 2), "utf-8");

    await appendIntegrationEvent({
      connectorId: "notion",
      type: "note",
      level: "info",
      message: `Updated Notion Database "${dbName}" record for ID: ${id}`,
    });

    return filePath;
  }
}

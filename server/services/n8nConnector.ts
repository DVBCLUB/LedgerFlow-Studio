import fs from "fs";
import path from "path";
import { appendIntegrationEvent } from "./integrationRegistry";
import { appendCompanyOsEvent } from "./companyOsControlPlane";

const N8N_DIR = path.join(process.cwd(), ".n8n_workflows");
const TEMPLATES_SUBDIR = path.join(N8N_DIR, "Templates");

export interface N8nSyncDetails {
  ok: boolean;
  templatesCount: number;
  executionsCount: number;
  localPath: string;
}

export class N8nConnector {
  /**
   * Ensure local simulation structure exists
   */
  public static ensureInitialized(): void {
    const dirs = [N8N_DIR, TEMPLATES_SUBDIR];
    for (const d of dirs) {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    }
  }

  /**
   * Test connection: returns workflow template and execution stats
   */
  public static async testConnection(): Promise<N8nSyncDetails> {
    this.ensureInitialized();
    
    const templates = fs.readdirSync(TEMPLATES_SUBDIR).filter(f => f.endsWith(".json"));
    
    let executionsCount = 0;
    const logPath = path.join(N8N_DIR, "executions.log");
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, "utf-8");
      executionsCount = content.split("========================================").length - 1;
    }

    const details: N8nSyncDetails = {
      ok: true,
      templatesCount: templates.length,
      executionsCount,
      localPath: N8N_DIR,
    };

    await appendIntegrationEvent({
      connectorId: "automation",
      type: "status",
      level: "success",
      message: `n8n Local Sandbox active. Registered ${details.templatesCount} workflows, tracked ${details.executionsCount} runs.`,
    });

    await appendCompanyOsEvent({
      source: "system",
      eventType: "workspace.sync_status",
      title: "n8n Workflow Sandbox Checked",
      body: `Local n8n workflow blueprints verified at ${N8N_DIR}.`,
      risk: "low",
      payload: details as any,
    });

    return details;
  }

  /**
   * Register a JSON template for n8n
   */
  public static async registerWorkflowTemplate(name: string, workflowJson: any): Promise<string> {
    this.ensureInitialized();
    const filename = `${name.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "workflow"}.json`;
    const filePath = path.join(TEMPLATES_SUBDIR, filename);

    await fs.promises.writeFile(filePath, JSON.stringify(workflowJson, null, 2), "utf-8");

    await appendIntegrationEvent({
      connectorId: "automation",
      type: "note",
      level: "success",
      message: `Registered n8n workflow template: ${name} (${filename})`,
    });

    return filePath;
  }

  /**
   * Trigger a workflow execution (mock run)
   */
  public static async triggerWorkflowExecution(workflowName: string, payload: any): Promise<void> {
    this.ensureInitialized();
    const logPath = path.join(N8N_DIR, "executions.log");

    const entry = `
Timestamp: ${new Date().toISOString()}
Workflow: ${workflowName}
Status: SUCCESS
Payload:
${JSON.stringify(payload, null, 2)}
========================================
`;

    await fs.promises.appendFile(logPath, entry, "utf-8");

    await appendIntegrationEvent({
      connectorId: "automation",
      type: "handoff",
      level: "info",
      message: `Triggered n8n workflow execution for: "${workflowName}"`,
    });
  }
}

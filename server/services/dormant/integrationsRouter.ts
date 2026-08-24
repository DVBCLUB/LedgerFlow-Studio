import type { Express, Request, Response } from 'express';
import { GoogleWorkspaceConnector } from '../googleWorkspaceConnector.ts';
import { Microsoft365Connector } from '../microsoft365Connector.ts';
import { NotionConnector } from '../notionConnector.ts';
import { N8nConnector } from '../n8nConnector.ts';
import { convertFigmaToReactComponent } from '../figmaCodeBridge.ts';
import { listSupportedHybridMediaProviders, dispatchHybridMediaJob } from '../aiMediaHybridConnectors.ts';

function successResponse(res: Response, data: any) {
  return res.json({ success: true, ...data });
}

function errorResponse(res: Response, err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : String(err);
  return res.status(status).json({ success: false, error: message });
}

export function registerIntegrationsRoutes(app: Express): void {
  app.get('/api/dormant/integrations/google-workspace/test', async (_req: Request, res: Response) => {
    try {
      const details = await GoogleWorkspaceConnector.testConnection();
      return successResponse(res, { details });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/integrations/google-workspace/sheets', async (req: Request, res: Response) => {
    try {
      const { sheetName, headers, rows } = req.body || {};
      if (!sheetName || !headers || !rows) {
        return res.status(400).json({ success: false, error: 'Missing sheetName, headers, or rows.' });
      }
      const filePath = await GoogleWorkspaceConnector.exportToSheets(sheetName, headers, rows);
      return successResponse(res, { filePath });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 🟢 3. Microsoft 365 Connector API

  app.get('/api/dormant/integrations/microsoft-365/test', async (_req: Request, res: Response) => {
    try {
      const details = await Microsoft365Connector.testConnection();
      return successResponse(res, { details });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/integrations/microsoft-365/excel', async (req: Request, res: Response) => {
    try {
      const { sheetName, headers, rows } = req.body || {};
      if (!sheetName || !headers || !rows) {
        return res.status(400).json({ success: false, error: 'Missing sheetName, headers, or rows.' });
      }
      const filePath = await Microsoft365Connector.exportToExcel(sheetName, headers, rows);
      return successResponse(res, { filePath });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 🟢 4. Notion Connector API

  app.get('/api/dormant/integrations/notion/test', async (_req: Request, res: Response) => {
    try {
      const details = await NotionConnector.testConnection();
      return successResponse(res, { details });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/integrations/notion/page', async (req: Request, res: Response) => {
    try {
      const { title, markdownContent } = req.body || {};
      if (!title || !markdownContent) {
        return res.status(400).json({ success: false, error: 'Missing title or markdownContent.' });
      }
      const filePath = await NotionConnector.createNotionPage(title, markdownContent);
      return successResponse(res, { filePath });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 🟢 5. n8n Connector API

  app.get('/api/dormant/integrations/n8n/test', async (_req: Request, res: Response) => {
    try {
      const details = await N8nConnector.testConnection();
      return successResponse(res, { details });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/integrations/n8n/trigger', async (req: Request, res: Response) => {
    try {
      const { workflowName, payload } = req.body || {};
      if (!workflowName) return res.status(400).json({ success: false, error: "Missing 'workflowName'." });
      await N8nConnector.triggerWorkflowExecution(workflowName, payload || {});
      return successResponse(res, { message: `Triggered n8n workflow "${workflowName}".` });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 🟢 6. Business Twin Simulation API

  app.post('/api/dormant/figma-bridge/import', async (req: Request, res: Response) => {
    try {
      const { figmaUrl, componentName } = req.body || {};
      const result = await convertFigmaToReactComponent({
        figmaUrl: figmaUrl || 'https://figma.com/file/sample',
        componentName: componentName || 'FigmaComponent',
      });
      return successResponse(res, { result });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 🟢 10. AI Long-Term Memory API

  app.get('/api/dormant/media-hybrid/providers', (_req: Request, res: Response) => {
    try {
      const providers = listSupportedHybridMediaProviders();
      return successResponse(res, { providers });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  app.post('/api/dormant/media-hybrid/dispatch', async (req: Request, res: Response) => {
    try {
      const { title, steps } = req.body || {};
      if (!title || !steps || !Array.isArray(steps)) {
        return res.status(400).json({ success: false, error: 'Missing title or steps array.' });
      }
      const job = await dispatchHybridMediaJob({ title, steps });
      return successResponse(res, { job });
    } catch (err) {
      return errorResponse(res, err);
    }
  });

  // 🟢 20. Industry Template Engine API
}

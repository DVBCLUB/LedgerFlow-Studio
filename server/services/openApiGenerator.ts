/**
 * openApiGenerator.ts
 * ============================================================
 * Auto-OpenAPI Generator — quét toàn bộ Express routes
 * và sinh OpenAPI 3.0 spec tự động.
 * 
 * Output: openapi.json + Swagger UI HTML
 */
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface RouteInfo {
  method: string;
  path: string;
  params: string[];
  description?: string;
}

export interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string; description: string };
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, Record<string, any>>;
  tags: Array<{ name: string; description: string }>;
}

// ─── Core API ───────────────────────────────────────────────────────

export function scanRoutes(routes: RouteInfo[]): OpenApiSpec {
  const tags = [
    { name: 'AI Core', description: 'AI Fabric, Agent Loop, Multi-Agent operations' },
    { name: 'Code & File', description: 'File editing, diff, rollback, search' },
    { name: 'Memory & Knowledge', description: 'Compound memory, knowledge graph, RAG' },
    { name: 'Security & Quality', description: 'Security audit, refactoring, validation, A/B testing' },
    { name: 'Automation & RPA', description: 'RPA scripts, workflows, file watchers, remediation' },
    { name: 'Analytics & Reports', description: 'Analytics, telemetry, cost, reports, benchmarking' },
    { name: 'Integration', description: 'Webhooks, agents, voting, swarm, fine-tuning' },
    { name: 'System', description: 'Health, observer, self-healing, threads, explainability' },
  ];

  const paths: Record<string, Record<string, any>> = {};

  for (const route of routes) {
    const openApiPath = route.path.replace(/:(\w+)/g, '{$1}');
    if (!paths[openApiPath]) paths[openApiPath] = {};

    const tag = determineTag(route.path);

    paths[openApiPath][route.method.toLowerCase()] = {
      tags: [tag],
      summary: route.description || `${route.method.toUpperCase()} ${route.path}`,
      operationId: `${route.method.toLowerCase()}_${route.path.replace(/[\/:]/g, '_').replace(/[{}]/g, '')}`.slice(0, 80),
      parameters: route.params.map(p => ({
        name: p,
        in: 'path',
        required: true,
        schema: { type: 'string' },
      })),
      responses: {
        '200': {
          description: 'Successful response',
          content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
        },
        '400': { description: 'Bad request' },
        '404': { description: 'Not found' },
        '500': { description: 'Server error' },
      },
    };
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'LedgerFlow Studio AI API',
      version: '1.0.0',
      description: 'Auto-generated OpenAPI specification for the LedgerFlow Studio AI Coding Assistant Daemon. All AI, automation, and robot endpoints.',
    },
    servers: [
      { url: 'http://127.0.0.1:3001', description: 'Local daemon server' },
    ],
    paths,
    tags,
  };
}

export function scanDaemonRoutes(sourcePath: string): RouteInfo[] {
  const routes: RouteInfo[] = [];

  try {
    const content = fs.readFileSync(sourcePath, 'utf8');

    // Match Express route patterns: app.get/post/put/patch/delete("path", ...)
    const routeRegex = /app\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gi;
    let match: RegExpExecArray | null;

    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1];
      const routePath = match[2];
      const params = (routePath.match(/:(\w+)/g) || []).map(p => p.slice(1));

      // Try to find a comment above this route
      const beforeContent = content.slice(Math.max(0, match.index - 300), match.index);
      const commentMatch = beforeContent.match(/\/\/\s*(.+?)(?:\n|$)/);
      const description = commentMatch ? commentMatch[1].trim() : undefined;

      routes.push({ method: method.toUpperCase(), path: routePath, params, description });
    }
  } catch { }

  return routes;
}

export function generateOpenApiSpec(sourcePath: string): OpenApiSpec {
  const routes = scanDaemonRoutes(sourcePath);
  return scanRoutes(routes);
}

export function generateSwaggerHtml(spec: OpenApiSpec): string {
  const specJson = JSON.stringify(spec);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LedgerFlow Studio AI — API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>html{background:#0f172a}body{margin:0}.swagger-ui{filter:invert(88%) hue-rotate(180deg)}.swagger-ui .topbar{background:#1e293b}.swagger-ui .info .title{color:#e2e8f0}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ spec: ${specJson}, dom_id: '#swagger-ui', deepLinking: true, defaultModelsExpandDepth: -1 });
  </script>
</body>
</html>`;
}

export function saveOpenApi(outputDir: string, sourcePath: string): { jsonPath: string; htmlPath: string; routeCount: number } {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const spec = generateOpenApiSpec(sourcePath);

  const jsonPath = path.join(outputDir, 'openapi.json');
  fs.writeFileSync(jsonPath, JSON.stringify(spec, null, 2), 'utf8');

  const htmlPath = path.join(outputDir, 'api-docs.html');
  fs.writeFileSync(htmlPath, generateSwaggerHtml(spec), 'utf8');

  const routeCount = Object.values(spec.paths).reduce((s, methods) => s + Object.keys(methods).length, 0);

  return { jsonPath, htmlPath, routeCount };
}

function determineTag(routePath: string): string {
  if (routePath.includes('/ask') || routePath.includes('/fabric') || routePath.includes('/agentic-loop') || routePath.includes('/multi-agent') || routePath.includes('/agent-loop')) return 'AI Core';
  if (routePath.includes('/edit') || routePath.includes('/diff') || routePath.includes('/rollback') || routePath.includes('/create') || routePath.includes('/search') || routePath.includes('/apply')) return 'Code & File';
  if (routePath.includes('/memory') || routePath.includes('/knowledge') || routePath.includes('/rag') || routePath.includes('/curator')) return 'Memory & Knowledge';
  if (routePath.includes('/security') || routePath.includes('/refactor') || routePath.includes('/validate') || routePath.includes('/ab-test')) return 'Security & Quality';
  if (routePath.includes('/rpa') || routePath.includes('/workflows') || routePath.includes('/watcher') || routePath.includes('/remediate')) return 'Automation & RPA';
  if (routePath.includes('/analytics') || routePath.includes('/telemetry') || routePath.includes('/cost') || routePath.includes('/benchmark') || routePath.includes('/reports/generated')) return 'Analytics & Reports';
  if (routePath.includes('/webhook') || routePath.includes('/voting') || routePath.includes('/swarm') || routePath.includes('/finetune') || routePath.includes('/handoff')) return 'Integration';
  if (routePath.includes('/health') || routePath.includes('/observer') || routePath.includes('/healing') || routePath.includes('/threads') || routePath.includes('/explain') || routePath.includes('/status') || routePath.includes('/intent') || routePath.includes('/tools') || routePath.includes('/multimodal') || routePath.includes('/reports/schedules') || routePath.includes('/chains') || routePath.includes('/strategy') || routePath.includes('/skills') || routePath.includes('/learning') || routePath.includes('/docs') || routePath.includes('/feedback')) return 'System';
  return 'AI Core';
}

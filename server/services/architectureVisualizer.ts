/**
 * architectureVisualizer.ts
 * ============================================================
 * Architecture Visualizer — phân tích codebase và tạo
 * sơ đồ kiến trúc dạng Mermaid, Graphviz, HTML SVG.
 *
 * Auto-detect: services, modules, dependencies,
 * data flow, và system boundaries.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { searchCodebase } from './localSearchService';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface ArchitectureNode {
  id: string;
  name: string;
  type: 'service' | 'module' | 'utility' | 'data_store' | 'external_api' | 'ui_component' | 'config' | 'unknown';
  filePath: string;
  size: number;
  imports: string[];
  exportedSymbols: string[];
  dependencies: string[];
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  label: string;
  type: 'import' | 'extend' | 'implement' | 'call' | 'data_flow' | 'config';
}

export interface ArchitectureGraph {
  id: string;
  name: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  clusters: Array<{ name: string; nodes: string[]; description: string }>;
  summary: string;
  generatedAt: string;
  durationMs: number;
}

export type DiagramFormat = 'mermaid' | 'graphviz' | 'html_svg' | 'json';

// ─── Storage ────────────────────────────────────────────────────────
const FILE = path.join(process.cwd(), 'architecture_graphs.json');
let graphs: ArchitectureGraph[] = [];

async function load(): Promise<void> {
  try { if (fs.existsSync(FILE)) graphs = JSON.parse(await fs.promises.readFile(FILE, 'utf8')); } catch { }
}
load().catch(() => undefined);

async function save(): Promise<void> { await fs.promises.writeFile(FILE, JSON.stringify(graphs.slice(-20), null, 2), 'utf8'); }

// ─── Core Analysis ──────────────────────────────────────────────────

async function analyzeArchitecture(targetDir: string, maxFiles = 20): Promise<ArchitectureGraph> {
  const graphId = `arch_${Date.now()}`;
  const started = Date.now();
  const nodes: ArchitectureNode[] = [];

  // Gather service files
  const servicePattern = path.join(targetDir, '**/*.ts').replace(/\\/g, '/');
  const serviceFiles = await searchCodebase('service', maxFiles);

  for (const file of serviceFiles) {
    const fullPath = path.join(process.cwd(), file.relativePath);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const size = content.length;

      // Detect imports
      const imports: string[] = [];
      const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
      let m: RegExpExecArray | null;
      while ((m = importRegex.exec(content)) !== null) {
        imports.push(m[1]);
      }

      // Detect exports
      const exportedSymbols: string[] = [];
      const exportRegex = /export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/g;
      let em: RegExpExecArray | null;
      while ((em = exportRegex.exec(content)) !== null) {
        exportedSymbols.push(em[1]);
      }

      // Detect dependencies (local imports)
      const dependencies = imports.filter(i => i.startsWith('.') || i.startsWith('./') || i.startsWith('../'));

      // Type detection
      let type: ArchitectureNode['type'] = 'unknown';
      if (file.relativePath.includes('service')) type = 'service';
      else if (file.relativePath.includes('component') || file.relativePath.includes('Component')) type = 'ui_component';
      else if (file.relativePath.includes('utils') || file.relativePath.includes('helpers')) type = 'utility';
      else if (file.relativePath.includes('config') || file.relativePath.includes('.env')) type = 'config';
      else if (file.relativePath.includes('module')) type = 'module';

      nodes.push({
        id: `node_${nodes.length}`,
        name: path.basename(file.relativePath, path.extname(file.relativePath)),
        type, filePath: file.relativePath,
        size, imports: imports.slice(0, 20), exportedSymbols: exportedSymbols.slice(0, 10),
        dependencies: dependencies.slice(0, 10),
      });
    } catch { }
  }

  // Build edges from dependencies
  const edges: ArchitectureEdge[] = [];
  const addedEdges = new Set<string>();

  for (const node of nodes) {
    for (const dep of node.dependencies) {
      const depBase = path.basename(dep, path.extname(dep));
      const target = nodes.find(n => n.name === depBase || n.filePath.includes(dep.replace(/^\.\//, '')));
      if (target && target.id !== node.id) {
        const edgeKey = `${node.id}->${target.id}`;
        if (!addedEdges.has(edgeKey)) {
          edges.push({ from: node.id, to: target.id, label: 'imports', type: 'import' });
          addedEdges.add(edgeKey);
        }
      }
    }
  }

  // Cluster by type
  const clusterMap = new Map<string, string[]>();
  for (const node of nodes) {
    if (!clusterMap.has(node.type)) clusterMap.set(node.type, []);
    clusterMap.get(node.type)!.push(node.id);
  }
  const clusters = Array.from(clusterMap.entries()).map(([name, ids]) => ({
    name, nodes: ids,
    description: `${ids.length} ${name} components`,
  }));

  const graph: ArchitectureGraph = {
    id: graphId, name: `Architecture: ${targetDir}`,
    nodes, edges, clusters,
    summary: `${nodes.length} components, ${edges.length} edges, ${clusters.length} clusters`,
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
  };

  graphs.push(graph);
  save().catch(() => undefined);

  return graph;
}

// ─── Diagram Generators ─────────────────────────────────────────────

export function toMermaid(graph: ArchitectureGraph): string {
  let mermaid = `graph TB\n`;
  mermaid += `  %% ${graph.name}\n`;
  mermaid += `  %% ${graph.summary}\n\n`;

  // Style nodes by type
  const typeStyles: Record<string, string> = {
    service: 'fill:#1e40af,color:#93c5fd',
    module: 'fill:#065f46,color:#6ee7b7',
    utility: 'fill:#92400e,color:#fcd34d',
    data_store: 'fill:#7e22ce,color:#d8b4fe',
    external_api: 'fill:#b91c1c,color:#fca5a5',
    ui_component: 'fill:#0f766e,color:#5eead4',
    config: 'fill:#57534e,color:#d6d3d1',
    unknown: 'fill:#1f2937,color:#9ca3af',
  };

  for (const node of graph.nodes) {
    const label = node.exportedSymbols.length > 0
      ? `${node.name}<br/><small>${node.exportedSymbols.slice(0, 3).join(', ')}</small>`
      : node.name;
    const style = typeStyles[node.type] || typeStyles.unknown;
    mermaid += `  ${node.id}["${label}"]:::${node.type}\n`;
  }

  for (const edge of graph.edges) {
    mermaid += `  ${edge.from} -->|${edge.label}| ${edge.to}\n`;
  }

  // Subgraphs for clusters
  for (const cluster of graph.clusters) {
    mermaid += `  subgraph ${cluster.name}\n`;
    for (const nodeId of cluster.nodes) {
      mermaid += `    ${nodeId}\n`;
    }
    mermaid += `  end\n`;
  }

  // Class definitions for styling
  for (const [type, style] of Object.entries(typeStyles)) {
    mermaid += `  classDef ${type} ${style}\n`;
  }

  return mermaid;
}

export function toGraphviz(graph: ArchitectureGraph): string {
  let gv = `digraph "${graph.name}" {\n`;
  gv += `  rankdir=TB;\n`;
  gv += `  node [shape=box, style=rounded];\n\n`;

  for (const node of graph.nodes) {
    const colors: Record<string, string> = {
      service: '#3b82f6', module: '#10b981', utility: '#f59e0b',
      ui_component: '#06b6d4', config: '#6b7280', unknown: '#4b5563',
    };
    const color = colors[node.type] || '#4b5563';
    gv += `  ${node.id} [label="${node.name}", color="${color}", fontcolor="${color}"];\n`;
  }

  for (const edge of graph.edges) {
    gv += `  ${edge.from} -> ${edge.to} [label="${edge.label}"];\n`;
  }

  gv += `}\n`;
  return gv;
}

export function toHtmlSvg(graph: ArchitectureGraph): string {
  const nodes = graph.nodes;
  const edges = graph.edges;

  // Simple force-layout simulation
  const positions = new Map<string, { x: number; y: number }>();
  const cx = 500, cy = 400;

  // Arrange nodes in a circle
  for (let i = 0; i < nodes.length; i++) {
    const angle = (2 * Math.PI * i) / nodes.length;
    positions.set(nodes[i].id, {
      x: cx + 300 * Math.cos(angle),
      y: cy + 200 * Math.sin(angle),
    });
  }

  const colors: Record<string, string> = {
    service: '#3b82f6', module: '#10b981', utility: '#f59e0b',
    ui_component: '#06b6d4', config: '#6b7280', data_store: '#8b5cf6',
    external_api: '#ef4444', unknown: '#4b5563',
  };

  let svgNodes = '';
  for (const node of nodes) {
    const pos = positions.get(node.id)!;
    const color = colors[node.type] || '#4b5563';
    svgNodes += `  <g transform="translate(${pos.x}, ${pos.y})">
    <rect x="-80" y="-20" width="160" height="40" rx="6" fill="${color}" opacity="0.8"/>
    <text x="0" y="5" text-anchor="middle" fill="white" font-size="11" font-weight="bold">${node.name}</text>
  </g>\n`;
  }

  let svgEdges = '';
  for (const edge of edges) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (from && to) {
      svgEdges += `  <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#4b5563" stroke-width="1" marker-end="url(#arrow)"/>\n`;
    }
  }

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${graph.name}</title>
<style>body{margin:0;background:#0f172a;color:#e2e8f0;font-family:system-ui}
svg{width:100vw;height:100vh}.legend{position:fixed;top:10px;right:10px;background:#1e293b;border-radius:8px;padding:10px;font-size:11px}</style></head>
<body>
<div class="legend">
  <strong>${graph.name}</strong><br/>
  ${graph.summary}<br/><br/>
  ${Object.entries(colors).map(([t, c]) => `<div style="display:flex;align-items:center;gap:4px;margin:2px 0"><span style="width:10px;height:10px;background:${c};border-radius:2px;display:inline-block"></span> ${t}</div>`).join('')}
</div>
<svg viewBox="0 0 1000 800">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="90" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#4b5563"/>
    </marker>
    <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.3"/></filter>
  </defs>
${svgEdges}
${svgNodes}
</svg></body></html>`;
}

// ─── Core API ───────────────────────────────────────────────────────

export async function generateArchitectureDiagram(
  targetDir: string,
  format: DiagramFormat = 'mermaid',
  maxFiles?: number,
): Promise<{ graph: ArchitectureGraph; diagram: string; format: DiagramFormat; htmlPath?: string }> {
  const graph = await analyzeArchitecture(targetDir, maxFiles);

  let diagram = '';
  let htmlPath: string | undefined;

  switch (format) {
    case 'mermaid':
      diagram = toMermaid(graph);
      break;
    case 'graphviz':
      diagram = toGraphviz(graph);
      break;
    case 'html_svg': {
      diagram = toHtmlSvg(graph);
      htmlPath = path.join(process.cwd(), 'docs', 'architecture.html');
      if (!fs.existsSync(path.dirname(htmlPath))) fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
      fs.writeFileSync(htmlPath, diagram, 'utf8');
      break;
    }
    case 'json':
      diagram = JSON.stringify(graph, null, 2);
      break;
  }

  return { graph, diagram, format, htmlPath };
}

export function getGraph(id: string): ArchitectureGraph | undefined { return graphs.find(g => g.id === id); }
export function listGraphs(): ArchitectureGraph[] { return [...graphs].reverse(); }

export function convertToFormat(graphId: string, format: DiagramFormat): string | undefined {
  const graph = graphs.find(g => g.id === graphId);
  if (!graph) return undefined;

  switch (format) {
    case 'mermaid': return toMermaid(graph);
    case 'graphviz': return toGraphviz(graph);
    case 'html_svg': return toHtmlSvg(graph);
    case 'json': return JSON.stringify(graph, null, 2);
  }
}

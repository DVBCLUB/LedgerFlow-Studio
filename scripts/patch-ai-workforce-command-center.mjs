import fs from 'node:fs';
import path from 'node:path';

const rendererPath = path.resolve('src/app/WorkspaceRenderer.tsx');

if (!fs.existsSync(rendererPath)) {
  throw new Error(`WorkspaceRenderer not found at ${rendererPath}`);
}

let source = fs.readFileSync(rendererPath, 'utf8');
let changed = false;

function replaceOnce(search, replacement, label) {
  if (source.includes(replacement)) return;
  if (!source.includes(search)) {
    throw new Error(`Cannot patch AI Workforce Command Center: missing anchor ${label}`);
  }
  source = source.replace(search, replacement);
  changed = true;
}

replaceOnce(
  "const AgentAssemblyBuilder     = React.lazy(() => import('../modules/ai-hr/AgentAssemblyBuilder'));",
  "const AgentAssemblyBuilder     = React.lazy(() => import('../modules/ai-hr/AgentAssemblyBuilder'));\nconst AIWorkforceCommandCenter = React.lazy(() => import('../modules/ai-hr/AIWorkforceCommandCenter'));",
  'AgentAssemblyBuilder lazy import',
);

replaceOnce(
  "            {currentSubTabId === 'overview' && (\n              <div className=\"space-y-6\">\n                <AIOperationsCenter />",
  "            {currentSubTabId === 'overview' && (\n              <div className=\"space-y-6\">\n                <AIWorkforceCommandCenter />\n                <AIOperationsCenter />",
  'AI Workforce overview slot',
);

replaceOnce(
  "            {currentSubTabId === 'agents' && (\n              <div className=\"space-y-6\">\n                <AgentAssemblyBuilder />",
  "            {currentSubTabId === 'agents' && (\n              <div className=\"space-y-6\">\n                <AIWorkforceCommandCenter />\n                <AgentAssemblyBuilder />",
  'AI Workforce agents slot',
);

replaceOnce(
  "            {currentSubTabId === 'labs' && (\n              <div className=\"space-y-6\">\n                <PythonSandbox />",
  "            {currentSubTabId === 'labs' && (\n              <div className=\"space-y-6\">\n                <AIWorkforceCommandCenter />\n                <PythonSandbox />",
  'AI Workforce labs slot',
);

if (changed) {
  fs.writeFileSync(rendererPath, source);
  console.log('AI Workforce Command Center patched into WorkspaceRenderer.');
} else {
  console.log('AI Workforce Command Center patch already applied.');
}

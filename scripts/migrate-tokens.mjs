import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Backgrounds
  content = content.replace(/bg-slate-950(\/\d+)?/g, 'bg-bg-primary');
  content = content.replace(/bg-slate-900(\/\d+)?/g, 'bg-bg-surface');
  content = content.replace(/bg-slate-800(\/\d+)?/g, 'bg-bg-elevated');
  
  // Borders
  content = content.replace(/border-slate-900/g, 'border-border-primary');
  content = content.replace(/border-slate-800/g, 'border-border-primary');
  content = content.replace(/border-slate-850/g, 'border-border-secondary');
  content = content.replace(/border-slate-700/g, 'border-border-secondary');
  
  // Text colors
  content = content.replace(/text-slate-100/g, 'text-text-primary');
  content = content.replace(/text-slate-200/g, 'text-text-primary');
  content = content.replace(/text-white/g, 'text-text-primary');
  content = content.replace(/text-slate-300/g, 'text-text-secondary');
  content = content.replace(/text-slate-400/g, 'text-text-secondary');
  content = content.replace(/text-slate-500/g, 'text-text-muted');
  content = content.replace(/text-slate-600/g, 'text-text-muted');

  // Accents / Brand
  content = content.replace(/bg-purple-500(\/\d+)?/g, (match, p1) => `bg-brand${p1 || ''}`);
  content = content.replace(/bg-purple-900(\/\d+)?/g, (match, p1) => `bg-brand${p1 || ''}`);
  content = content.replace(/bg-purple-950(\/\d+)?/g, (match, p1) => `bg-brand${p1 || ''}`);
  content = content.replace(/border-purple-500(\/\d+)?/g, (match, p1) => `border-brand${p1 || ''}`);
  content = content.replace(/text-purple-400/g, 'text-brand');
  content = content.replace(/text-purple-500/g, 'text-brand');
  content = content.replace(/text-purple-600/g, 'text-brand');
  content = content.replace(/from-purple-500/g, 'from-brand');
  content = content.replace(/to-purple-500/g, 'to-brand');
  content = content.replace(/to-indigo-500/g, 'to-accent-tertiary');
  content = content.replace(/text-indigo-400/g, 'text-accent-tertiary');
  content = content.replace(/bg-indigo-500(\/\d+)?/g, (match, p1) => `bg-accent-tertiary${p1 || ''}`);
  content = content.replace(/border-indigo-500(\/\d+)?/g, (match, p1) => `border-accent-tertiary${p1 || ''}`);
  content = content.replace(/text-violet-400/g, 'text-accent-secondary');
  content = content.replace(/bg-violet-500(\/\d+)?/g, (match, p1) => `bg-accent-secondary${p1 || ''}`);
  content = content.replace(/border-violet-500(\/\d+)?/g, (match, p1) => `border-accent-secondary${p1 || ''}`);

  // Status colors - emerald (success)
  content = content.replace(/text-emerald-200/g, 'text-success');
  content = content.replace(/text-emerald-300/g, 'text-success');
  content = content.replace(/text-emerald-400/g, 'text-success');
  content = content.replace(/text-emerald-500/g, 'text-success');
  content = content.replace(/bg-emerald-500(\/\d+)?/g, (match, p1) => `bg-success${p1 || ''}`);
  content = content.replace(/bg-emerald-950(\/\d+)?/g, (match, p1) => `bg-success${p1 || ''}`);
  content = content.replace(/border-emerald-500(\/\d+)?/g, (match, p1) => `border-success${p1 || ''}`);

  // Status colors - amber (warning)
  content = content.replace(/text-amber-200/g, 'text-warning');
  content = content.replace(/text-amber-300/g, 'text-warning');
  content = content.replace(/text-amber-400/g, 'text-warning');
  content = content.replace(/text-amber-500/g, 'text-warning');
  content = content.replace(/bg-amber-500(\/\d+)?/g, (match, p1) => `bg-warning${p1 || ''}`);
  content = content.replace(/bg-amber-950(\/\d+)?/g, (match, p1) => `bg-warning${p1 || ''}`);
  content = content.replace(/border-amber-500(\/\d+)?/g, (match, p1) => `border-warning${p1 || ''}`);

  // Status colors - rose (error)
  content = content.replace(/text-rose-200/g, 'text-error');
  content = content.replace(/text-rose-300/g, 'text-error');
  content = content.replace(/text-rose-400/g, 'text-error');
  content = content.replace(/text-rose-500/g, 'text-error');
  content = content.replace(/bg-rose-500(\/\d+)?/g, (match, p1) => `bg-error${p1 || ''}`);
  content = content.replace(/bg-rose-950(\/\d+)?/g, (match, p1) => `bg-error${p1 || ''}`);
  content = content.replace(/border-rose-500(\/\d+)?/g, (match, p1) => `border-error${p1 || ''}`);

  // Status colors - cyan (info)
  content = content.replace(/text-cyan-200/g, 'text-info');
  content = content.replace(/text-cyan-300/g, 'text-info');
  content = content.replace(/text-cyan-400/g, 'text-info');
  content = content.replace(/text-cyan-500/g, 'text-info');
  content = content.replace(/bg-cyan-500(\/\d+)?/g, (match, p1) => `bg-info${p1 || ''}`);
  content = content.replace(/bg-cyan-950(\/\d+)?/g, (match, p1) => `bg-info${p1 || ''}`);
  content = content.replace(/border-cyan-500(\/\d+)?/g, (match, p1) => `border-info${p1 || ''}`);

  // Typo cleanup
  content = content.replace(/font-black/g, 'font-bold');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

const targets = [
  path.join(process.cwd(), 'src', 'modules', 'command-center'),
  path.join(process.cwd(), 'src', 'modules', 'finance-accounting')
];

for (const target of targets) {
  processDirectory(target);
}

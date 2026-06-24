import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcDir = path.join(root, 'src');

// Keep track of visited files to prevent infinite recursion
const visited = new Set();
// Set of all absolute file paths that are actually imported
const activeFiles = new Set();

const extensions = ['.tsx', '.ts', '.js', '.jsx'];

function resolveImport(sourceFile, importPath) {
  // Ignore absolute imports or external node_modules imports
  if (!importPath.startsWith('.')) return null;

  const sourceDir = path.dirname(sourceFile);
  let targetPath = path.resolve(sourceDir, importPath);

  // Check if it's a file directly
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return targetPath;
  }

  // Check with extensions
  for (const ext of extensions) {
    const p = targetPath + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return p;
    }
  }

  // Check if it's a directory containing index or default file
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    for (const ext of extensions) {
      const p = path.join(targetPath, 'index' + ext);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return p;
      }
    }
  }

  return null;
}

function traverse(file) {
  const resolvedPath = path.resolve(file);
  if (visited.has(resolvedPath)) return;
  visited.add(resolvedPath);
  activeFiles.add(resolvedPath);

  if (!fs.existsSync(resolvedPath)) return;

  const content = fs.readFileSync(resolvedPath, 'utf-8');
  // Simple regex to extract relative imports
  const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    const targetFile = resolveImport(resolvedPath, importPath);
    if (targetFile) {
      traverse(targetFile);
    }
  }

  // Also match dynamic imports React.lazy(() => import('...'))
  const lazyRegex = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = lazyRegex.exec(content)) !== null) {
    const importPath = match[1];
    const targetFile = resolveImport(resolvedPath, importPath);
    if (targetFile) {
      traverse(targetFile);
    }
  }
}

// Start traversal from main entrypoint
const entrypoint = path.join(srcDir, 'main.tsx');
traverse(entrypoint);

// Also check index.html if it references scripts
const indexHtml = path.join(root, 'index.html');
if (fs.existsSync(indexHtml)) {
  const htmlContent = fs.readFileSync(indexHtml, 'utf-8');
  const scriptRegex = /src=['"]([^'"]+)['"]/g;
  let match;
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const srcPath = match[1];
    const resolvedScript = resolveImport(root, srcPath);
    if (resolvedScript) {
      traverse(resolvedScript);
    }
  }
}

// Scan src/components/ to find which files are NOT in activeFiles set
const componentsDir = path.join(srcDir, 'components');
const unusedFiles = [];
const usedFiles = [];

function scanComponents(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanComponents(fullPath);
    } else if (entry.isFile()) {
      if (activeFiles.has(fullPath)) {
        usedFiles.push(fullPath);
      } else {
        unusedFiles.push(fullPath);
      }
    }
  }
}

if (fs.existsSync(componentsDir)) {
  scanComponents(componentsDir);
}

console.log('--- SCAN RESULTS ---');
console.log(`Total Active Files traversed: ${activeFiles.size}`);
console.log(`Active files in src/components: ${usedFiles.length}`);
console.log(`Unused files in src/components: ${unusedFiles.length}`);

// Print unused files
fs.writeFileSync(
  path.join(root, 'unused_components.json'),
  JSON.stringify(unusedFiles.map(p => path.relative(root, p)), null, 2)
);
console.log('\nUnused components written to unused_components.json');

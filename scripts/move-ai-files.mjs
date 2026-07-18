import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('src');
const moduleDir = path.join(srcDir, 'modules', 'ai-nhan-su');
const panelsDir = path.join(moduleDir, 'panels');

if (!fs.existsSync(panelsDir)) {
  fs.mkdirSync(panelsDir, { recursive: true });
}

// Get all top-level files in ai-nhan-su
const files = fs.readdirSync(moduleDir).filter(f => fs.statSync(path.join(moduleDir, f)).isFile() && f.endsWith('.tsx'));

// Decide which files to move to panels/
const filesToMove = files.filter(f => f.includes('Panel') || f.includes('Center') || f.includes('Dashboard') || f.includes('Page') || f.includes('Review') || f.includes('Guard') || f.includes('Matrix') || f.includes('Engine') || f.includes('Builder') || f.includes('Monitor') || f.includes('Bar') || f.includes('Board') || f.includes('Directory') || f.includes('Planner') || f.includes('Catalog') || f.includes('Tab') && f !== 'PeopleTab.tsx');

if (!filesToMove.includes('PeopleTab.tsx') && files.includes('PeopleTab.tsx')) {
    filesToMove.push('PeopleTab.tsx');
}

// 1. Move all files first and fix internal relative imports
for (const fileToMove of filesToMove) {
  const oldPath = path.join(moduleDir, fileToMove);
  const newPath = path.join(panelsDir, fileToMove);
  
  let content = fs.readFileSync(oldPath, 'utf-8');
  content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, p1) => {
    if (p1.startsWith('./')) {
      return `from '../${p1.slice(2)}'`;
    } else if (p1.startsWith('../')) {
      return `from '../${p1}'`;
    }
    return match;
  });
  
  fs.writeFileSync(newPath, content, 'utf-8');
  fs.unlinkSync(oldPath);
}

// Function to recursively find all ts/tsx files in src/
function getAllTsFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllTsFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = getAllTsFiles(srcDir);

// 2. Update imports globally
for (const f of allFiles) {
  let content = fs.readFileSync(f, 'utf-8');
  let changed = false;
  
  for (const fileToMove of filesToMove) {
    const baseName = fileToMove.replace('.tsx', '');
    
    const importRegex = new RegExp(`from\\s+['"]([^'"]*\\b${baseName})['"]`, 'g');
    content = content.replace(importRegex, (match, p1) => {
       if (!p1.includes('/panels/')) {
           changed = true;
           if (path.dirname(f) === moduleDir) {
               if (p1 === `./${baseName}`) return `from './panels/${baseName}'`;
           } else if (path.dirname(f) === panelsDir) {
               if (p1 === `../${baseName}`) return `from './${baseName}'`;
           } else {
               const parts = p1.split('/');
               const last = parts.pop();
               return `from '${parts.join('/')}/panels/${last}'`;
           }
       }
       return match;
    });
    
    const dynamicRegex = new RegExp(`import\\(['"]([^'"]*\\b${baseName})['"]\\)`, 'g');
    content = content.replace(dynamicRegex, (match, p1) => {
       if (!p1.includes('/panels/')) {
           changed = true;
           if (path.dirname(f) === moduleDir) {
               if (p1 === `./${baseName}`) return `import('./panels/${baseName}')`;
           } else if (path.dirname(f) === panelsDir) {
               if (p1 === `../${baseName}`) return `import('./${baseName}')`;
           } else {
               const parts = p1.split('/');
               const last = parts.pop();
               return `import('${parts.join('/')}/panels/${last}')`;
           }
       }
       return match;
    });
  }

  if (changed) {
    fs.writeFileSync(f, content, 'utf-8');
  }
}

console.log('Moved', filesToMove.length, 'files to panels/ and updated imports globally.');

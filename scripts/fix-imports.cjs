const fs = require('fs');
const content = fs.readFileSync('server/services/accountingRoutes.ts', 'utf8');
const updated = content.replace(/from "\.\/([^"]+)"/g, (match, p1) => {
  if (p1.endsWith('.js') || p1.endsWith('.ts')) return match;
  return `from "./${p1}.js"`;
});
fs.writeFileSync('server/services/accountingRoutes.ts', updated);
console.log('Fixed accountingRoutes.ts');

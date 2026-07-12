const fs = require('fs');
let content = fs.readFileSync('src/lib/utils.ts', 'utf8');
content = content.replace(
  'export function formatDate(dateStr: string) {',
  'export function formatDate(dateStr: any) {\n  if (typeof dateStr !== "string") return String(dateStr || "");'
);
fs.writeFileSync('src/lib/utils.ts', content);

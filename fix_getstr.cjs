const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');
const replacement = `const getStr = (val: any, defaultVal = ''): string => {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val._text !== undefined) return getStr(val._text, defaultVal);
    if (Array.isArray(val)) {
      if (val.length === 0) return defaultVal;
      if (val.length === 1) return getStr(val[0], defaultVal);
      return val.map(v => getStr(v, '')).filter(Boolean).join(', ');
    }
    return defaultVal;
  }
  return defaultVal;
};`;
content = content.replace(/const getStr = \([\s\S]*?\n\};\n/, replacement + '\n');
fs.writeFileSync('src/pages/ImportExport.tsx', content);

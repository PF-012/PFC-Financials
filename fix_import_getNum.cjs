const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const getNumDef = `const getNum = (val: any): number => {
  const str = getStr(val, '0');
  let cleaned = str.replace(/,/g, '');
  let isCr = cleaned.toUpperCase().includes('CR');
  cleaned = cleaned.replace(/[^\\d.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return 0;
  let num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (isCr && num > 0) return -num;
  return num;
};`;

content = content.replace(
  /const getNum = \([\s\S]*?\n\};\n/,
  getNumDef + '\n'
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);

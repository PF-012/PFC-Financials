const fs = require('fs');
let content = fs.readFileSync('src/pages/Ledgers.tsx', 'utf8');

content = content.replace(
  /const filteredLedgers = ledgers\.filter\(l => \n     String\(l\.name \|\| ''\)\.toLowerCase\(\)\.includes\(\(searchTerm \|\| ''\)\.toLowerCase\(\)\) \|\|\n     String\(l\.group \|\| ''\)\.toLowerCase\(\)\.includes\(\(searchTerm \|\| ''\)\.toLowerCase\(\)\)\n  \);/,
  `const filteredLedgers = ledgers.filter(l => {
    const name = String(l.name || '').trim();
    if (!name) return false;
    return name.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
           String(l.group || '').toLowerCase().includes((searchTerm || '').toLowerCase());
  });`
);

fs.writeFileSync('src/pages/Ledgers.tsx', content);

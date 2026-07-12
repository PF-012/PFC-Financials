const fs = require('fs');
let content = fs.readFileSync('src/pages/Ledgers.tsx', 'utf8');

const replacement = `const filteredLedgers = ledgers.filter(l => {
    const name = String(l.name || '').trim();
    if (!name || name === 'Unknown') return false;
    return name.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
           String(l.group || '').toLowerCase().includes((searchTerm || '').toLowerCase());
  });`;

content = content.replace(/const filteredLedgers = ledgers\.filter\(l =>[\s\S]*? \);/, replacement);

fs.writeFileSync('src/pages/Ledgers.tsx', content);

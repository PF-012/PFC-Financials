const fs = require('fs');
let content = fs.readFileSync('src/pages/Ledgers.tsx', 'utf8');

content = content.replace(
  /snap\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \} as Ledger\)\)\.filter\(l => l\.companyId === activeCompany\.id\)/,
  `snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ledger)).filter(l => l.companyId === activeCompany.id && String(l.name || '').trim() && l.name !== 'Unknown')`
);

fs.writeFileSync('src/pages/Ledgers.tsx', content);

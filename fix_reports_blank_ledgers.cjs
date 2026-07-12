const fs = require('fs');
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

content = content.replace(
  /const ledgers = lSnap\.docs\.filter\(doc => doc\.data\(\)\.companyId === activeCompany\?\.id\)\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \} as Ledger\)\);/,
  `const ledgers = lSnap.docs.filter(doc => doc.data().companyId === activeCompany?.id).map(doc => ({ id: doc.id, ...doc.data() } as Ledger)).filter(l => {
    const name = String(l.name || '').trim();
    return name && name !== 'Unknown';
  });`
);

fs.writeFileSync('src/pages/Reports.tsx', content);

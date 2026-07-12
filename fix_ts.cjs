const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

content = content.replace(
  /existingLedgers = snap\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \}\)\);/,
  "existingLedgers = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];"
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);

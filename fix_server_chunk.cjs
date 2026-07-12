const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /const itemsToProcess = rawData\.slice\(0, 100\);/,
  "const itemsToProcess = rawData.slice(0, 15);"
);

fs.writeFileSync('server.ts', content);

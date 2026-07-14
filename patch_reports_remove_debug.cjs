const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(
  /<p className="text-sm text-red-500">DEBUG \| TS:[\s\S]*?<\/p>/,
  ""
);

fs.writeFileSync('src/pages/Reports.tsx', code);

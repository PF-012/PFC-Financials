const fs = require('fs');
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

content = content.replace(/active:underline md:hover:underline/g, 'underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600');

fs.writeFileSync('src/pages/Reports.tsx', content);

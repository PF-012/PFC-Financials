const fs = require('fs');
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

content = content.replace(/hover:bg-gray-100/g, 'active:bg-gray-200 md:hover:bg-gray-100');
content = content.replace(/hover:underline/g, 'active:underline md:hover:underline');

fs.writeFileSync('src/pages/Reports.tsx', content);

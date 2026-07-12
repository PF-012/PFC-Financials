const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const routeContent = content.match(/app\.post\('\/api\/map-imported-vouchers'[\s\S]*?\}\);\s*app\.listen/)[0].replace(/\s*app\.listen$/, '');

content = content.replace(routeContent, '');

content = content.replace(
  /\/\/ Vite middleware for development/,
  routeContent + '\n\n  // Vite middleware for development'
);

fs.writeFileSync('server.ts', content);

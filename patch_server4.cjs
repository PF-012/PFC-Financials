const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const { createServer: createViteServer } = await import('vite');",
  "const viteName = 'vi' + 'te';\n    const { createServer: createViteServer } = await import(viteName);"
);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts to hide vite from vercel nft");

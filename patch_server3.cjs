const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove static import
code = code.replace("import { createServer as createViteServer } from 'vite';", "");

// Replace usage with dynamic import
code = code.replace(
  "const vite = await createViteServer({",
  "const { createServer: createViteServer } = await import('vite');\n    const vite = await createViteServer({"
);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with dynamic vite import");

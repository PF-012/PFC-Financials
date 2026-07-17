const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/gemini-flash-latest/g, 'gemini-1.5-flash');

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with gemini-1.5-flash");

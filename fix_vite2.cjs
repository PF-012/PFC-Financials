const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

const regex = /build: \{[\s\S]*?server: \{/g;
const replacement = `server: {`;

code = code.replace(regex, replacement);
fs.writeFileSync('vite.config.ts', code);

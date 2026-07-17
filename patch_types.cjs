const fs = require('fs');

// Fix server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace('const currentParts = [{ text: message }];', 'const currentParts: any[] = [{ text: message }];');
serverCode = serverCode.replace('const parts = [];', 'const parts: any[] = [];');
serverCode = serverCode.replace('const contents = [];', 'const contents: any[] = [];');
fs.writeFileSync('server.ts', serverCode);

// Fix AIGuide.tsx
let uiCode = fs.readFileSync('src/pages/AIGuide.tsx', 'utf8');
uiCode = uiCode.replace('files.forEach(file => {', 'files.forEach((file: File) => {');
fs.writeFileSync('src/pages/AIGuide.tsx', uiCode);

console.log("Patched types");

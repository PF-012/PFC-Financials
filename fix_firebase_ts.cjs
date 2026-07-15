const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');
code = code.replace(/export async function setDoc\(docObj: any, data: any, options\?: \{ merge\?: boolean \}\) \{ merge\?: boolean \}\) \{/, 'export async function setDoc(docObj: any, data: any, options?: { merge?: boolean }) {');
fs.writeFileSync('src/lib/firebase.ts', code);

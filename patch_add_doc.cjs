const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(
  /export async function addDoc.*?\{([\s\S]*?)if \(error\) throw error;([\s\S]*?)\}/,
  `export async function addDoc(coll: any, data: any) {$1if (error) throw error;$2  eventTarget.dispatchEvent(new Event('mutation'));\n}`
);

fs.writeFileSync('src/lib/firebase.ts', code);

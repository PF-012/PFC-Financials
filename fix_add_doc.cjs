const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(
  /export async function addDoc.*?\{([\s\S]*?)if \(error\) throw error;([\s\S]*?)eventTarget\.dispatchEvent\(new Event\('mutation'\)\);(\s*)\}/,
  `export async function addDoc(coll: any, data: any) {$1if (error) throw error;\n  eventTarget.dispatchEvent(new Event('mutation'));$2}`
);

fs.writeFileSync('src/lib/firebase.ts', code);

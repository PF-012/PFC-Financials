const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const str = `export function doc(db: any, path: string, id: string) {
  if (typeof db === 'object' && db.type === 'collection') {
    return { type: 'doc', path: db.path, id: path };
  }
  return { type: 'doc', path, id };
}`;

const rep = `export function doc(db: any, path?: string, id?: string) {
  if (typeof db === 'object' && db.type === 'collection') {
    return { type: 'doc', path: db.path, id: path || Math.random().toString(36).substring(2, 15) };
  }
  return { type: 'doc', path: path, id: id || Math.random().toString(36).substring(2, 15) };
}`;

content = content.replace(str, rep);
fs.writeFileSync('src/lib/firebase.ts', content);

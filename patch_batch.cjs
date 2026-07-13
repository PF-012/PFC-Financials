const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const str = `export function writeBatch(db: any) {
  const operations: any[] = [];
  return {
    set(docObj: any, data: any) {
      operations.push({ type: 'set', doc: docObj, data });
    },
    update(docObj: any, data: any) {
      operations.push({ type: 'update', doc: docObj, data });
    },
    delete(docObj: any) {
      operations.push({ type: 'delete', doc: docObj });
    },
    async commit() {
      // Supabase RPC or individual calls (we'll do individual for simplicity)
      for (const op of operations) {
        if (op.type === 'set') await setDoc(op.doc, op.data);
        else if (op.type === 'update') await updateDoc(op.doc, op.data);
        else if (op.type === 'delete') await deleteDoc(op.doc);
      }
    }
  };
}`;

const rep = `export function writeBatch(db: any) {
  const operations: any[] = [];
  return {
    set(docObj: any, data: any) {
      operations.push({ type: 'set', doc: docObj, data });
      return this;
    },
    update(docObj: any, data: any) {
      operations.push({ type: 'update', doc: docObj, data });
      return this;
    },
    delete(docObj: any) {
      operations.push({ type: 'delete', doc: docObj });
      return this;
    },
    async commit() {
      // Supabase RPC or individual calls (we'll do individual for simplicity)
      for (const op of operations) {
        if (op.type === 'set') await setDoc(op.doc, op.data);
        else if (op.type === 'update') await updateDoc(op.doc, op.data);
        else if (op.type === 'delete') await deleteDoc(op.doc);
      }
    }
  };
}`;

content = content.replace(str, rep);
fs.writeFileSync('src/lib/firebase.ts', content);

import { supabase } from './supabase';

export const db = {};
export const auth = {}; // Auth is handled directly via supabase in AuthContext

export function collection(db: any, path: string) {
  return { type: 'collection', path };
}

export function doc(db: any, path?: string, id?: string) {
  if (typeof db === 'object' && db.type === 'collection') {
    return { type: 'doc', path: db.path, id: path || Math.random().toString(36).substring(2, 15) };
  }
  return { type: 'doc', path: path, id: id || Math.random().toString(36).substring(2, 15) };
}

export function where(field: string, op: string, value: any) {
  return { field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function query(coll: any, ...constraints: any[]) {
  const wheres = constraints.filter(c => c.field);
  const orderBys = constraints.filter(c => c.type === 'orderBy');
  return { ...coll, wheres, orderBys };
}

function applyConstraints(builder: any, queryObj: any) {
  if (queryObj.wheres) {
    for (const w of queryObj.wheres) {
      if (w.op === '==') builder = builder.eq(w.field, w.value);
      else if (w.op === '>') builder = builder.gt(w.field, w.value);
      else if (w.op === '<') builder = builder.lt(w.field, w.value);
      else if (w.op === '>=') builder = builder.gte(w.field, w.value);
      else if (w.op === '<=') builder = builder.lte(w.field, w.value);
    }
  }
  if (queryObj.orderBys) {
    for (const o of queryObj.orderBys) {
      builder = builder.order(o.field, { ascending: o.direction === 'asc' });
    }
  }
  return builder;
}

export async function getDocs(queryObj: any) {
  let builder = supabase.from(queryObj.path).select('*');
  builder = applyConstraints(builder, queryObj);
  const { data, error } = await builder;
  if (error) throw error;
  
  const docs = (data || []).map((row: any) => ({
    id: row.id,
    data: () => row,
    ref: { type: 'doc', path: queryObj.path, id: row.id }
  }));
  
  return {
    docs,
    forEach: (cb: (doc: any) => void) => docs.forEach(cb)
  };
}

export async function getDoc(docObj: any) {
  const { data, error } = await supabase.from(docObj.path).select('*').eq('id', docObj.id).maybeSingle();
  if (error) throw error;
  return {
    id: docObj.id,
    exists: () => !!data,
    data: () => data,
    ref: docObj
  };
}

export async function addDoc(coll: any, data: any) {
  const { data: res, error } = await supabase.from(coll.path).insert(data).select().single();
  if (error) throw error;
  return { id: res.id, type: 'doc', path: coll.path };
}

export async function setDoc(docObj: any, data: any, options?: { merge?: boolean }) {
  const payload = { id: docObj.id, ...data };
  const { error } = await supabase.from(docObj.path).upsert(payload);
  if (error) throw error;
}

export async function updateDoc(docObj: any, data: any) {
  const { error } = await supabase.from(docObj.path).update(data).eq('id', docObj.id);
  if (error) throw error;
}

export async function deleteDoc(docObj: any) {
  const { error } = await supabase.from(docObj.path).delete().eq('id', docObj.id);
  if (error) throw error;
}

export function onSnapshot(queryObj: any, callback: (snapshot: any) => void) {
  // Initial fetch
  getDocs(queryObj).then(callback).catch(console.error);

  // Subscribe to realtime
  const channelId = `public:${queryObj.path}-${Math.random().toString(36).substring(7)}`;
  const channel = supabase.channel(channelId)
    .on('postgres_changes', { event: '*', schema: 'public', table: queryObj.path }, payload => {
      // Re-fetch everything on change for simplicity, to match the snapshot behaviour correctly
      // In a production app, you'd merge the payload manually.
      getDocs(queryObj).then(callback).catch(console.error);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function writeBatch(db: any) {
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
}

export function serverTimestamp() {
  return new Date().toISOString();
}

const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

if (!code.includes('const eventTarget = new EventTarget();')) {
  code = code.replace(
    /import \{ supabase \} from '\.\/supabase';/,
    `import { supabase } from './supabase';\n\nconst eventTarget = new EventTarget();`
  );
}

// add event dispatching
code = code.replace(
  /export async function setDoc.*?\{([\s\S]*?)if \(error\) throw error;(\s*)\}/,
  `export async function setDoc(docObj: any, data: any, options?: { merge?: boolean }) {$1if (error) throw error;$2eventTarget.dispatchEvent(new Event('mutation'));\n}`
);

code = code.replace(
  /export async function updateDoc.*?\{([\s\S]*?)if \(error\) throw error;(\s*)\}/,
  `export async function updateDoc(docObj: any, data: any) {$1if (error) throw error;$2eventTarget.dispatchEvent(new Event('mutation'));\n}`
);

code = code.replace(
  /export async function deleteDoc.*?\{([\s\S]*?)if \(error\) throw error;(\s*)\}/,
  `export async function deleteDoc(docObj: any) {$1if (error) throw error;$2eventTarget.dispatchEvent(new Event('mutation'));\n}`
);

// update onSnapshot
code = code.replace(
  /export function onSnapshot.*?\{([\s\S]*?)const channelId =/,
  `export function onSnapshot(queryObj: any, callback: (snapshot: any) => void) {
  const fetch = () => getDocs(queryObj).then(callback).catch(console.error);
  fetch();
  const listener = () => fetch();
  eventTarget.addEventListener('mutation', listener);
  const channelId =`
);

code = code.replace(
  /return \(\) => \{([\s\S]*?)supabase\.removeChannel\(channel\);(\s*)\};/,
  `return () => {$1eventTarget.removeEventListener('mutation', listener);\n    supabase.removeChannel(channel);$2};`
);

// wait, writeBatch also needs to trigger it.
code = code.replace(
  /async commit\(\) \{([\s\S]*?)for \(const op of operations\) \{([\s\S]*?)\}(\s*)\}/,
  `async commit() {$1for (const op of operations) {$2}$3eventTarget.dispatchEvent(new Event('mutation'));\n    }`
);

fs.writeFileSync('src/lib/firebase.ts', code);

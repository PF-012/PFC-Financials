const fs = require('fs');
let fb = fs.readFileSync('src/lib/firebase.ts', 'utf8');
fb = fb.replace(/Math\.random\(\)\.toString\(36\)\.substring\(2, 15\)/g, "crypto.randomUUID()");
fs.writeFileSync('src/lib/firebase.ts', fb);

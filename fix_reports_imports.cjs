const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(/import \{ collection, query, where, getDocs \} from '\.\.\/lib\/firebase';/, "import { collection, query, where, getDocs, onSnapshot } from '../lib/firebase';");

fs.writeFileSync('src/pages/Reports.tsx', code);

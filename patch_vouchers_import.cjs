const fs = require('fs');
let content = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

content = content.replace(
  /import \{ Plus, Search, FileText, ChevronDown, ChevronRight \} from 'lucide-react';/,
  "import { Plus, Search, FileText, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';"
);

fs.writeFileSync('src/pages/Vouchers.tsx', content);

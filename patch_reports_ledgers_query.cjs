const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');
code = code.replace(
  "const lq = query(collection(db, 'ledgers'), where('userId', '==', user?.id));",
  "const lq = query(collection(db, 'ledgers'), where('companyId', '==', activeCompany?.id), where('userId', '==', user?.id));"
);
fs.writeFileSync('src/pages/Reports.tsx', code);

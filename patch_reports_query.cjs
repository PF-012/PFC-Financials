const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');
code = code.replace(
  "const vq = query(collection(db, 'vouchers'), where('userId', '==', user?.id));",
  "const vq = query(collection(db, 'vouchers'), where('companyId', '==', activeCompany?.id), where('userId', '==', user?.id));"
);
fs.writeFileSync('src/pages/Reports.tsx', code);

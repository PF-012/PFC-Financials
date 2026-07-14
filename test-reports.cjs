const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');
code = code.replace(
  "const relevantVouchers = allVouchers.filter(v => v.date <= toDate);",
  "const relevantVouchers = allVouchers.filter(v => v.date <= toDate);\n      console.log('Reports fetched vouchers:', allVouchers.length, 'relevant:', relevantVouchers.length);"
);
fs.writeFileSync('src/pages/Reports.tsx', code);

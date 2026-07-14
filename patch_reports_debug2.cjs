const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');
code = code.replace(
  "<p className=\"text-sm text-gray-500\">Financial Performance | Vouchers: {reportData?.allVouchers?.length} | Ledgers: {reportData?.allLedgers?.length}</p>",
  "<p className=\"text-sm text-red-500\">DEBUG | Vouchers total: {reportData?.allVouchers?.length} | fromDate: {fromDate} | toDate: {toDate} | Sales: {reportData?.totalSales}</p>"
);
fs.writeFileSync('src/pages/Reports.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');
code = code.replace(
  "<p className=\"text-sm text-red-500\">DEBUG | Vouchers: {reportData?.allVouchers?.length} | Ledgers: {reportData?.allLedgers?.length} | Sales: {reportData?.totalSales}</p>",
  "<p className=\"text-sm text-red-500\">DEBUG | Vouchers: {reportData?.allVouchers?.length} | Ledgers: {reportData?.allLedgers?.length} | Sales: {reportData?.totalSales} | SL: {reportData?.allLedgers?.filter(l=>l.group==='Sales Accounts').map(l=>l.name + '=' + reportData.currentChanges[l.id]).join(', ')}</p>"
);
fs.writeFileSync('src/pages/Reports.tsx', code);

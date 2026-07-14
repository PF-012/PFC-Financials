const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(
  "DEBUG | Vouchers: {reportData?.allVouchers?.length} | Ledgers: {reportData?.allLedgers?.length} | Sales: {reportData?.totalSales} | SL: {reportData?.allLedgers?.filter(l=>l.group==='Sales Accounts').map(l=>l.name + '=' + reportData.currentChanges[l.id]).join(', ')}",
  "DEBUG | TS: {reportData?.totalSales} | Vouchers: {reportData?.allVouchers?.map(v => v.type + ':' + v.date + '=' + v.totalAmount).join(', ')}"
);

fs.writeFileSync('src/pages/Reports.tsx', code);

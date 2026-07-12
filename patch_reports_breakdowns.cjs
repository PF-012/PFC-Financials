const fs = require('fs');
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// Replace Sales Accounts breakdown
content = content.replace(
  /handleBreakdown\('Sales Accounts', 'vouchers', v => v\.type === 'Sales'\)/g,
  "handleBreakdown('Sales Accounts', 'ledgers', l => l.group === 'Sales Accounts')"
);

// Replace Purchase Accounts breakdown
content = content.replace(
  /handleBreakdown\('Purchase Accounts', 'vouchers', v => v\.type === 'Purchase'\)/g,
  "handleBreakdown('Purchase Accounts', 'ledgers', l => l.group === 'Purchase Accounts')"
);

fs.writeFileSync('src/pages/Reports.tsx', content);

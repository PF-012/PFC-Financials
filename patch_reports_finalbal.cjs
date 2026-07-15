const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(
  /if \(l\.group === 'Indirect Expenses'\) indirectExpenses \+= curChange;/g,
  "if (l.group === 'Indirect Expenses') indirectExpenses += finalBal;"
);
code = code.replace(
  /else if \(l\.group === 'Indirect Incomes'\) indirectIncomes -= curChange;/g,
  "else if (l.group === 'Indirect Incomes') indirectIncomes -= finalBal;"
);
code = code.replace(
  /else if \(l\.group === 'Direct Expenses'\) directExpenses \+= curChange;/g,
  "else if (l.group === 'Direct Expenses') directExpenses += finalBal;"
);
code = code.replace(
  /else if \(l\.group === 'Direct Incomes'\) directIncomes -= curChange;/g,
  "else if (l.group === 'Direct Incomes') directIncomes -= finalBal;"
);
code = code.replace(
  /else if \(l\.group === 'Purchase Accounts'\) totalPurchases \+= curChange;/g,
  "else if (l.group === 'Purchase Accounts') totalPurchases += finalBal;"
);
code = code.replace(
  /else if \(l\.group === 'Sales Accounts'\) totalSales -= curChange;/g,
  "else if (l.group === 'Sales Accounts') totalSales -= finalBal;"
);

// We need to also patch handleBreakdown to use finalBal instead of curChange for PnL groups
code = code.replace(
  /bal = \(reportData\.currentChanges \|\| \{\}\)\[l\.id\] \|\| 0;/g,
  "bal = (reportData.ledgerBalances || {})[l.id] || 0;"
);

fs.writeFileSync('src/pages/Reports.tsx', code);

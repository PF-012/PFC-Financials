const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(
  /if \(l\.group === 'Indirect Expenses'\) indirectExpenses \+= finalBal;/g,
  "if (l.group === 'Indirect Expenses') indirectExpenses += curChange;"
);
code = code.replace(
  /else if \(l\.group === 'Indirect Incomes'\) indirectIncomes -= finalBal;/g,
  "else if (l.group === 'Indirect Incomes') indirectIncomes -= curChange;"
);
code = code.replace(
  /else if \(l\.group === 'Direct Expenses'\) directExpenses \+= finalBal;/g,
  "else if (l.group === 'Direct Expenses') directExpenses += curChange;"
);
code = code.replace(
  /else if \(l\.group === 'Direct Incomes'\) directIncomes -= finalBal;/g,
  "else if (l.group === 'Direct Incomes') directIncomes -= curChange;"
);
code = code.replace(
  /else if \(l\.group === 'Purchase Accounts'\) totalPurchases \+= finalBal;/g,
  "else if (l.group === 'Purchase Accounts') totalPurchases += curChange;"
);
code = code.replace(
  /else if \(l\.group === 'Sales Accounts'\) totalSales -= finalBal;/g,
  "else if (l.group === 'Sales Accounts') totalSales -= curChange;"
);

fs.writeFileSync('src/pages/Reports.tsx', code);

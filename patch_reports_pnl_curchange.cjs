const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const target = `         if (l.group === 'Indirect Expenses') indirectExpenses += finalBal;
         else if (l.group === 'Indirect Incomes') indirectIncomes -= finalBal;
         else if (l.group === 'Direct Expenses') directExpenses += finalBal;
         else if (l.group === 'Direct Incomes') directIncomes -= finalBal;
         else if (l.group === 'Purchase Accounts') totalPurchases += finalBal;
         else if (l.group === 'Sales Accounts') totalSales -= finalBal;`;

const replacement = `         if (l.group === 'Indirect Expenses') indirectExpenses += curChange;
         else if (l.group === 'Indirect Incomes') indirectIncomes -= curChange;
         else if (l.group === 'Direct Expenses') directExpenses += curChange;
         else if (l.group === 'Direct Incomes') directIncomes -= curChange;
         else if (l.group === 'Purchase Accounts') totalPurchases += curChange;
         else if (l.group === 'Sales Accounts') totalSales -= curChange;`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Reports.tsx', code);
console.log("Patched PnL to use curChange");

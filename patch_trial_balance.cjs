const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const targetStr = `                 if (l.group === 'Capital Account') bal = -((reportData.ledgerBalances || {})[l.id] || 0);
                 if (['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes'].includes(l.group)) bal = -((reportData.ledgerBalances || {})[l.id] || 0);
                 
                 // P&L items: Incomes are credit (negative bal here means credit), Expenses are debit (positive)
                 if (['Sales Accounts', 'Indirect Incomes', 'Direct Incomes'].includes(l.group)) bal = -bal;`;

code = code.replace(
  /if \(l\.group === 'Capital Account'\) bal = -\(\(reportData\.ledgerBalances \|\| \{\}\)\[l\.id\] \|\| 0\);\s+if \(\['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes'\]\.includes\(l\.group\)\) bal = -\(\(reportData\.ledgerBalances \|\| \{\}\)\[l\.id\] \|\| 0\);\s+\/\/ P&L items: Incomes are credit \(negative bal here means credit\), Expenses are debit \(positive\)\s+if \(\['Sales Accounts', 'Indirect Incomes', 'Direct Incomes'\]\.includes\(l\.group\)\) bal = -bal;/,
  ""
);

// We need to do the same for the Total reducers in the tfoot!
code = code.replace(
  /if \(l\.group === 'Capital Account'\) bal = -\(\(reportData\.ledgerBalances \|\| \{\}\)\[l\.id\] \|\| 0\);\s+if \(\['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes'\]\.includes\(l\.group\)\) bal = -\(\(reportData\.ledgerBalances \|\| \{\}\)\[l\.id\] \|\| 0\);\s+if \(\['Sales Accounts', 'Indirect Incomes', 'Direct Incomes'\]\.includes\(l\.group\)\) bal = -bal;/g,
  ""
);

fs.writeFileSync('src/pages/Reports.tsx', code);

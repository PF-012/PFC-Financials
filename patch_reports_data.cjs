const fs = require('fs');
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// Update variable declaration
content = content.replace(
  /let indirectExpenses = 0, indirectIncomes = 0, directExpenses = 0;/,
  "let indirectExpenses = 0, indirectIncomes = 0, directExpenses = 0, directIncomes = 0;"
);
content = content.replace(
  /let prevIndirectExpenses = 0, prevIndirectIncomes = 0, prevDirectExpenses = 0;/,
  "let prevIndirectExpenses = 0, prevIndirectIncomes = 0, prevDirectExpenses = 0, prevDirectIncomes = 0;"
);

// Update ledger loop P&L mapping
const newCurrentMap = `
         if (l.group === 'Indirect Expenses') indirectExpenses += curChange;
         else if (l.group === 'Indirect Incomes') indirectIncomes -= curChange;
         else if (l.group === 'Direct Expenses') directExpenses += curChange;
         else if (l.group === 'Direct Incomes') directIncomes -= curChange;
`;
content = content.replace(
  /if \(l\.group === 'Indirect Expenses'\) indirectExpenses \+= curChange;\s*else if \(l\.group === 'Indirect Incomes'\) indirectIncomes -= curChange;\s*else if \(l\.group === 'Direct Expenses'\) directExpenses \+= curChange;\s*else if \(l\.group === 'Direct Incomes'\) indirectIncomes -= curChange;/,
  newCurrentMap.trim()
);

const newPrevMap = `
         if (l.group === 'Indirect Expenses') prevIndirectExpenses += prevChange;
         else if (l.group === 'Indirect Incomes') prevIndirectIncomes -= prevChange;
         else if (l.group === 'Direct Expenses') prevDirectExpenses += prevChange;
         else if (l.group === 'Direct Incomes') prevDirectIncomes -= prevChange;
`;
content = content.replace(
  /if \(l\.group === 'Indirect Expenses'\) prevIndirectExpenses \+= prevChange;\s*else if \(l\.group === 'Indirect Incomes'\) prevIndirectIncomes -= prevChange;\s*else if \(l\.group === 'Direct Expenses'\) prevDirectExpenses \+= prevChange;\s*else if \(l\.group === 'Direct Incomes'\) prevIndirectIncomes -= prevChange;/,
  newPrevMap.trim()
);

// Update Gross Profit Calculation
content = content.replace(
  /const grossProfit = totalSales - \(totalPurchases \+ directExpenses\);/,
  "const grossProfit = (totalSales + directIncomes) - (totalPurchases + directExpenses);"
);
content = content.replace(
  /const prevGrossProfit = prevTotalSales - \(prevTotalPurchases \+ prevDirectExpenses\);/,
  "const prevGrossProfit = (prevTotalSales + prevDirectIncomes) - (prevTotalPurchases + prevDirectExpenses);"
);

// Add directIncomes to setReportData
content = content.replace(
  /directExpenses,/,
  "directExpenses,\n        directIncomes,"
);

fs.writeFileSync('src/pages/Reports.tsx', content);

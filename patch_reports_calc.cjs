const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// Initialize prevUnassigned variables
code = code.replace(
  /let unassignedReceipts = 0, unassignedPayments = 0, unassignedDuties = 0, unassignedSales = 0, unassignedPurchases = 0;/,
  "let unassignedReceipts = 0, unassignedPayments = 0, unassignedDuties = 0, unassignedSales = 0, unassignedPurchases = 0;\n      let prevUnassignedSales = 0, prevUnassignedPurchases = 0;"
);

// Fix Sales
code = code.replace(
  /if \(isCurrent\) totalSales \+= baseAmt; else prevTotalSales \+= baseAmt;\s+if \(v\.accountId\) applyToLedger\(v\.accountId, -baseAmt\);\s+else if \(isCurrent\) unassignedSales \+= baseAmt;/,
  `if (v.accountId) applyToLedger(v.accountId, -baseAmt);
            else { if (isCurrent) unassignedSales += baseAmt; else prevUnassignedSales += baseAmt; }`
);

// Fix Purchase
code = code.replace(
  /if \(isCurrent\) totalPurchases \+= baseAmt; else prevTotalPurchases \+= baseAmt;\s+if \(v\.accountId\) applyToLedger\(v\.accountId, baseAmt\);\s+else if \(isCurrent\) unassignedPurchases \+= baseAmt;/,
  `if (v.accountId) applyToLedger(v.accountId, baseAmt);
            else { if (isCurrent) unassignedPurchases += baseAmt; else prevUnassignedPurchases += baseAmt; }`
);

// Add unassigned to totals AFTER ledger loop
code = code.replace(
  /if \(unassignedDuties < 0\) \{/,
  `totalSales += unassignedSales;
      prevTotalSales += prevUnassignedSales;
      totalPurchases += unassignedPurchases;
      prevTotalPurchases += prevUnassignedPurchases;
      
      if (unassignedDuties < 0) {`
);

fs.writeFileSync('src/pages/Reports.tsx', code);

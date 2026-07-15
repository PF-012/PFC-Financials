const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const target = `      const ledgerBalances: Record<string, number> = {};
      ledgers.forEach(l => {
         ledgerBalances[l.id] = l.openingBalance || 0;
      });
      let totalSales = 0, totalPurchases = 0, totalReceipts = 0, totalPayments = 0;
      let prevTotalSales = 0, prevTotalPurchases = 0;
      let unassignedReceipts = 0, unassignedPayments = 0, unassignedDuties = 0, unassignedSales = 0, unassignedPurchases = 0;
      let prevUnassignedSales = 0, prevUnassignedPurchases = 0;
      const currentChanges: Record<string, number> = {};
      const prevChanges: Record<string, number> = {};`;

const replacement = `      const ledgerBalances: Record<string, number> = {};
      const currentChanges: Record<string, number> = {};
      const prevChanges: Record<string, number> = {};
      ledgers.forEach(l => {
         ledgerBalances[l.id] = l.openingBalance || 0;
         if (['Indirect Expenses', 'Indirect Incomes', 'Direct Expenses', 'Direct Incomes', 'Purchase Accounts', 'Sales Accounts'].includes(l.group)) {
             prevChanges[l.id] = l.openingBalance || 0;
         }
      });
      let totalSales = 0, totalPurchases = 0, totalReceipts = 0, totalPayments = 0;
      let prevTotalSales = 0, prevTotalPurchases = 0;
      let unassignedReceipts = 0, unassignedPayments = 0, unassignedDuties = 0, unassignedSales = 0, unassignedPurchases = 0;
      let prevUnassignedSales = 0, prevUnassignedPurchases = 0;`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/Reports.tsx', code);
console.log("Patched Reports.tsx opening balances");

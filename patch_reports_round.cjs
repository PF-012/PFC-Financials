const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const target = `      const grossProfit = totalSales + directIncomes + closingStock - (openingStock + totalPurchases + directExpenses);
      const netProfit = grossProfit + indirectIncomes - indirectExpenses;
      const prevGrossProfit = prevTotalSales + prevDirectIncomes + closingStock - (openingStock + prevTotalPurchases + prevDirectExpenses);
      const prevNetProfit = prevGrossProfit + prevIndirectIncomes - prevIndirectExpenses;
      
      setReportData({`;

const replacement = `      const R = (v: number) => Math.round(v * 100) / 100;
      const grossProfit = R(totalSales) + R(directIncomes) + R(closingStock) - (R(openingStock) + R(totalPurchases) + R(directExpenses));
      const netProfit = R(grossProfit) + R(indirectIncomes) - R(indirectExpenses);
      const prevGrossProfit = R(prevTotalSales) + R(prevDirectIncomes) + R(closingStock) - (R(openingStock) + R(prevTotalPurchases) + R(prevDirectExpenses));
      const prevNetProfit = R(prevGrossProfit) + R(prevIndirectIncomes) - R(prevIndirectExpenses);
      
      setReportData({`;

code = code.replace(target, replacement);

const target2 = `        totalSales,
        totalPurchases,
        totalReceipts,
        totalPayments,
        openingStock,
        closingStock,
        directExpenses,
        indirectExpenses,
        directIncomes,
        indirectIncomes,
        grossProfit,
        netProfit,
        prevGrossProfit,
        prevNetProfit,
        capital,
        currentLiabilities,
        fixedAssets,
        currentAssets,
        ledgerBalances,`;

const replacement2 = `        totalSales: R(totalSales),
        totalPurchases: R(totalPurchases),
        totalReceipts: R(totalReceipts),
        totalPayments: R(totalPayments),
        openingStock: R(openingStock),
        closingStock: R(closingStock),
        directExpenses: R(directExpenses),
        indirectExpenses: R(indirectExpenses),
        directIncomes: R(directIncomes),
        indirectIncomes: R(indirectIncomes),
        grossProfit: R(grossProfit),
        netProfit: R(netProfit),
        prevGrossProfit: R(prevGrossProfit),
        prevNetProfit: R(prevNetProfit),
        capital: R(capital),
        currentLiabilities: R(currentLiabilities),
        fixedAssets: R(fixedAssets),
        currentAssets: R(currentAssets),
        ledgerBalances,`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/pages/Reports.tsx', code);
console.log("Patched Reports.tsx rounding");

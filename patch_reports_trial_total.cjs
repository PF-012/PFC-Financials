const fs = require('fs');
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const tfootBlock = `
             <tfoot className="bg-gray-50 border-t-2 border-gray-200">
               <tr>
                 <td className="px-6 py-4 text-sm font-semibold text-blue-900">Total</td>
                 <td className="px-6 py-4 text-sm font-semibold text-blue-900 text-right">
                   {(reportData.totalPurchases + reportData.currentAssets + reportData.fixedAssets + reportData.directExpenses + reportData.indirectExpenses + Math.max(0, -reportData.prevNetProfit)).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                 </td>
                 <td className="px-6 py-4 text-sm font-semibold text-blue-900 text-right">
                   {(reportData.totalSales + reportData.directIncomes + reportData.currentLiabilities + reportData.capital + reportData.indirectIncomes + Math.max(0, reportData.prevNetProfit)).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                 </td>
               </tr>
             </tfoot>
`;

content = content.replace(
  /<tfoot className="bg-gray-50 border-t-2 border-gray-200">[\s\S]*?<\/tfoot>/,
  tfootBlock.trim()
);

fs.writeFileSync('src/pages/Reports.tsx', content);

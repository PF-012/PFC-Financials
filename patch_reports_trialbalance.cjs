const fs = require('fs');
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const trialBalanceBlock = `
               <tr className={\`cursor-pointer hover:bg-gray-100 transition-colors\`} onClick={() => handleBreakdown('Purchase Accounts', 'vouchers', v => v.type === 'Purchase')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium hover:underline">Purchase Accounts</td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.totalPurchases.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
               </tr>
               <tr className={\`cursor-pointer hover:bg-gray-100 transition-colors\`} onClick={() => handleBreakdown('Direct Expenses', 'ledgers', l => l.group === 'Direct Expenses')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium hover:underline">Direct Expenses</td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.directExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
               </tr>
               <tr className={\`cursor-pointer hover:bg-gray-100 transition-colors\`} onClick={() => handleBreakdown('Indirect Expenses', 'ledgers', l => l.group === 'Indirect Expenses')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium hover:underline">Indirect Expenses</td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.indirectExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
               </tr>
               <tr className={\`cursor-pointer hover:bg-gray-100 transition-colors\`} onClick={() => handleBreakdown('Indirect Incomes', 'ledgers', l => l.group === 'Indirect Incomes')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium hover:underline">Indirect Incomes</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.indirectIncomes.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
               </tr>
               <tr className={\`cursor-pointer hover:bg-gray-100 transition-colors\`} onClick={() => handleBreakdown('Direct Incomes', 'ledgers', l => l.group === 'Direct Incomes')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium hover:underline">Direct Incomes</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.directIncomes.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
               </tr>
`;

content = content.replace(
  /<tr className=\{\`cursor-pointer hover:bg-gray-100 transition-colors\`\} onClick=\{\(\) => handleBreakdown\('Purchase Accounts', 'vouchers', v => v\.type === 'Purchase'\)\}>[\s\S]*?<tr className=\{\`cursor-pointer hover:bg-gray-100 transition-colors\`\} onClick=\{\(\) => handleBreakdown\('Indirect Incomes', 'ledgers', l => l\.group === 'Indirect Incomes'\)\}>[\s\S]*?<\/tr>/,
  trialBalanceBlock.trim()
);

fs.writeFileSync('src/pages/Reports.tsx', content);

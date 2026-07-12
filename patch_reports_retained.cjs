const fs = require('fs');
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const trialBalanceRows = `
               <tr className={\`cursor-pointer hover:bg-gray-100 transition-colors\`} onClick={() => handleBreakdown('Capital Account', 'ledgers', l => l.group === 'Capital Account')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium hover:underline">Capital Account</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.capital.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
               </tr>
               {reportData.prevNetProfit !== 0 && (
                  <tr>
                     <td className="px-6 py-4 text-sm text-gray-700">Retained Earnings (Previous Years P&L)</td>
                     <td className="px-6 py-4 text-sm text-right font-medium">{reportData.prevNetProfit < 0 ? Math.abs(reportData.prevNetProfit).toLocaleString('en-IN', {minimumFractionDigits: 2}) : ''}</td>
                     <td className="px-6 py-4 text-sm text-right font-medium">{reportData.prevNetProfit > 0 ? reportData.prevNetProfit.toLocaleString('en-IN', {minimumFractionDigits: 2}) : ''}</td>
                  </tr>
               )}
`;

content = content.replace(
  /<tr className=\{\`cursor-pointer hover:bg-gray-100 transition-colors\`\} onClick=\{\(\) => handleBreakdown\('Capital Account', 'ledgers', l => l\.group === 'Capital Account'\)\}>\s*<td className="px-6 py-4 text-sm text-blue-600 font-medium hover:underline">Capital Account<\/td>\s*<td className="px-6 py-4 text-sm text-right"><\/td>\s*<td className="px-6 py-4 text-sm text-right font-medium">\{reportData\.capital\.toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}<\/td>\s*<\/tr>/,
  trialBalanceRows.trim()
);

fs.writeFileSync('src/pages/Reports.tsx', content);

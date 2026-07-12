const fs = require('fs');
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const salesBlock = `
                    <div className={\`flex justify-between text-sm cursor-pointer hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors\`} onClick={() => handleBreakdown('Sales Accounts', 'vouchers', v => v.type === 'Sales')}>
                       <span className="text-blue-600 font-medium hover:underline">Sales Accounts</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.totalSales.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className={\`flex justify-between text-sm cursor-pointer hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors\`} onClick={() => handleBreakdown('Direct Incomes', 'ledgers', l => l.group === 'Direct Incomes')}>
                       <span className="text-blue-600 font-medium hover:underline">Direct Incomes</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.directIncomes.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
`;

content = content.replace(
  /<div className=\{\`flex justify-between text-sm cursor-pointer hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors\`\} onClick=\{\(\) => handleBreakdown\('Sales Accounts', 'vouchers', v => v\.type === 'Sales'\)\}>\s*<span className="text-blue-600 font-medium hover:underline">Sales Accounts<\/span>\s*<span className="text-gray-900 font-medium">₹ \{reportData\.totalSales\.toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}<\/span>\s*<\/div>/,
  salesBlock.trim()
);

fs.writeFileSync('src/pages/Reports.tsx', content);

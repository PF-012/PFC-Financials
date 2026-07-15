const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// Replace Dr side Net Profit
code = code.replace(
  /<div className="flex justify-between text-sm font-semibold">\s*<span className=\{reportData.netProfit > 0 \? "text-blue-900" : "text-gray-400"\}>Net Profit<\/span>\s*<span className=\{reportData.netProfit > 0 \? "text-blue-900" : "text-gray-400"\}>\{reportData.netProfit > 0 \? \`₹ \$\{reportData.netProfit.toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}\` : '-'}<\/span>\s*<\/div>/g,
  `<div className="flex justify-between text-sm font-semibold">
                          <span className={reportData.netProfit >= 0 ? "text-blue-900" : "text-red-600"}>Net Profit</span>
                          <span className={reportData.netProfit >= 0 ? "text-blue-900" : "text-red-600"}>{reportData.netProfit !== 0 ? \`₹ \${reportData.netProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}\` : '-'}</span>
                       </div>`
);

// Replace Cr side Net Loss
code = code.replace(
  /<div className="flex justify-between text-sm font-semibold">\s*<span className=\{reportData.netProfit < 0 \? "text-red-600" : "text-gray-400"\}>Net Loss<\/span>\s*<span className=\{reportData.netProfit < 0 \? "text-red-600" : "text-gray-400"\}>\{reportData.netProfit < 0 \? \`₹ \$\{Math.abs\(reportData.netProfit\).toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}\` : '-'}<\/span>\s*<\/div>/g,
  `<div className="flex justify-between text-sm font-semibold">
                          
                       </div>`
);


fs.writeFileSync('src/pages/Reports.tsx', code);

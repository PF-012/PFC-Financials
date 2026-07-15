const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// For Gross Profit c/o
code = code.replace(
  /<span className=\{reportData\.grossProfit >= 0 \? "text-gray-900 font-medium" : "text-gray-400 font-medium"\}>\s*\{reportData\.grossProfit > 0 \? "₹ " \+ reportData\.grossProfit\.toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\) : "-"\}\s*<\/span>/,
  '<span className="text-gray-900 font-medium">{reportData.grossProfit < 0 ? "-₹ " + Math.abs(reportData.grossProfit).toLocaleString(\'en-IN\', {minimumFractionDigits: 2}) : "₹ " + reportData.grossProfit.toLocaleString(\'en-IN\', {minimumFractionDigits: 2})}</span>'
);

// For Net Profit
code = code.replace(
  /<span className=\{reportData\.netProfit >= 0 \? "text-blue-900" : "text-gray-400"\}>\s*\{reportData\.netProfit > 0 \? "₹ " \+ reportData\.netProfit\.toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\) : "-"\}\s*<\/span>/,
  '<span className="text-blue-900">{reportData.netProfit < 0 ? "-₹ " + Math.abs(reportData.netProfit).toLocaleString(\'en-IN\', {minimumFractionDigits: 2}) : "₹ " + reportData.netProfit.toLocaleString(\'en-IN\', {minimumFractionDigits: 2})}</span>'
);

// Remove Gross Loss c/o from Right Side
const grossLossCoRegex = /<div className="pt-4 flex justify-between text-sm font-semibold">\s*<span className="text-gray-400">Gross Loss c\/o<\/span>\s*<span className=\{reportData\.grossProfit < 0 \? "text-gray-900 font-medium" : "text-gray-400 font-medium"\}>\s*\{reportData\.grossProfit < 0 \? "₹ " \+ Math\.abs\(reportData\.grossProfit\)\.toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\) : "-"\}\s*<\/span>\s*<\/div>/;
code = code.replace(grossLossCoRegex, '');

// For Gross Profit b/f
code = code.replace(
  /<span>\{reportData\.grossProfit > 0 \? "₹ " \+ reportData\.grossProfit\.toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\) : "₹ 0\.00"\}<\/span>/,
  '<span>{reportData.grossProfit < 0 ? "-₹ " + Math.abs(reportData.grossProfit).toLocaleString(\'en-IN\', {minimumFractionDigits: 2}) : "₹ " + reportData.grossProfit.toLocaleString(\'en-IN\', {minimumFractionDigits: 2})}</span>'
);

// Remove Net Loss from Right Side
const netLossRegex = /<div className="pt-4 flex justify-between text-sm font-semibold">\s*<span className="text-gray-400">Net Loss<\/span>\s*<span className=\{reportData\.netProfit < 0 \? "text-gray-900" : "text-gray-400"\}>\s*\{reportData\.netProfit < 0 \? "₹ " \+ Math\.abs\(reportData\.netProfit\)\.toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\) : "-"\}\s*<\/span>\s*<\/div>/;
code = code.replace(netLossRegex, '');

fs.writeFileSync('src/pages/Reports.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(
  /\{reportData\.netProfit < 0 \? "₹ " \+ Math\.abs\(reportData\.netProfit\)/g,
  '{reportData.netProfit < 0 ? "-₹ " + Math.abs(reportData.netProfit)'
);

code = code.replace(
  /\{reportData\.prevNetProfit < 0 \? "₹ " \+ Math\.abs\(reportData\.prevNetProfit\)/g,
  '{reportData.prevNetProfit < 0 ? "-₹ " + Math.abs(reportData.prevNetProfit)'
);

fs.writeFileSync('src/pages/Reports.tsx', code);

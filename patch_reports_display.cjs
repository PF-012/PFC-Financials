const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(/minimumFractionDigits: 2/g, 'minimumFractionDigits: 2, maximumFractionDigits: 2');
fs.writeFileSync('src/pages/Reports.tsx', code);
console.log("Patched Reports.tsx display");

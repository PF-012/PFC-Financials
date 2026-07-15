const fs = require('fs');
let code = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

code = code.replace(/minimumFractionDigits: 2/g, 'minimumFractionDigits: 2, maximumFractionDigits: 2');
fs.writeFileSync('src/pages/Vouchers.tsx', code);
console.log("Patched Vouchers.tsx display");

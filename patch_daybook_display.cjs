const fs = require('fs');
let code = fs.readFileSync('src/pages/DayBook.tsx', 'utf8');

code = code.replace(/minimumFractionDigits: 2/g, 'minimumFractionDigits: 2, maximumFractionDigits: 2');
fs.writeFileSync('src/pages/DayBook.tsx', code);
console.log("Patched DayBook.tsx display");

const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const target = `        const totalGst = (v.cgstAmount || 0) + (v.sgstAmount || 0) + (v.igstAmount || 0) + (v.gstAmount || 0);
        const baseAmt = (v.totalAmount || 0) - totalGst + (v.tdsAmount || 0);`;

const replacement = `        const totalGst = Math.round(((v.cgstAmount || 0) + (v.sgstAmount || 0) + (v.igstAmount || 0) + (v.gstAmount || 0)) * 100) / 100;
        const baseAmt = Math.round(((v.totalAmount || 0) - totalGst + (v.tdsAmount || 0)) * 100) / 100;`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/Reports.tsx', code);
console.log("Patched Reports.tsx rounding 2");

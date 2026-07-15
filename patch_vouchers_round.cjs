const fs = require('fs');
let code = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

const target = `         const baseAmount = form.totalAmount / (1 + totalRate / 100);
         const newCgstAmt = Number((baseAmount * (form.cgstRate || 0) / 100).toFixed(2));
         const newSgstAmt = Number((baseAmount * (form.sgstRate || 0) / 100).toFixed(2));
         const newIgstAmt = Number((baseAmount * (form.igstRate || 0) / 100).toFixed(2));`;

const replacement = `         const baseAmount = Math.round(form.totalAmount / (1 + totalRate / 100) * 100) / 100;
         const newCgstAmt = Math.round(baseAmount * (form.cgstRate || 0)) / 100;
         const newSgstAmt = Math.round(baseAmount * (form.sgstRate || 0)) / 100;
         const newIgstAmt = Math.round(baseAmount * (form.igstRate || 0)) / 100;`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/Vouchers.tsx', code);
console.log("Patched Vouchers.tsx rounding");

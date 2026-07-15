const fs = require('fs');
let code = fs.readFileSync('src/pages/DayBook.tsx', 'utf8');

const target = `                        if (debit) totalDebit += debit;
                        if (credit) totalCredit += credit;`;

const replacement = `                        if (debit) totalDebit = Math.round((totalDebit + debit) * 100) / 100;
                        if (credit) totalCredit = Math.round((totalCredit + credit) * 100) / 100;`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/DayBook.tsx', code);
console.log("Patched DayBook.tsx");

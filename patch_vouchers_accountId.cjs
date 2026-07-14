const fs = require('fs');
let code = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

// 1. Restrict options in SearchableSelect for accountId
code = code.replace(
  "if (form.type === 'Contra') return ['Cash-in-Hand', 'Bank Accounts'].includes(l.group);\n                        return true;",
  "if (form.type === 'Contra') return ['Cash-in-Hand', 'Bank Accounts'].includes(l.group);\n                        if (form.type === 'Sales' || form.type === 'Credit Note') return ['Sales Accounts', 'Direct Incomes', 'Indirect Incomes'].includes(l.group);\n                        if (form.type === 'Purchase' || form.type === 'Debit Note') return ['Purchase Accounts', 'Direct Expenses', 'Indirect Expenses'].includes(l.group);\n                        if (form.type === 'Receipt' || form.type === 'Payment') return ['Cash-in-Hand', 'Bank Accounts'].includes(l.group);\n                        return true;"
);

// 2. Add native required validation to SearchableSelect by injecting a hidden input (we can just add it below the SearchableSelect)
code = code.replace(
  "<SearchableSelect\n                     required\n                     value={form.accountId || ''}",
  "<SearchableSelect\n                     required\n                     value={form.accountId || ''}"
);
// Actually, let's just make the handleSubmit reject empty accountId for certain types.
code = code.replace(
  "if (!forceSave) {",
  "if (!submitForm.accountId && submitForm.type !== 'Journal') { alert('Please select an Account (Sales/Purchase/Cash/Bank)'); return; }\n    if (!forceSave) {"
);

fs.writeFileSync('src/pages/Vouchers.tsx', code);
console.log("Patched Vouchers accountId dropdown");

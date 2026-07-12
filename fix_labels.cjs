const fs = require('fs');
let content = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

const partyReplacement = `
                     {(() => {
                        switch(form.type) {
                           case 'Sales': return 'Customer A/c (Dr.) *';
                           case 'Purchase': return 'Supplier A/c (Cr.) *';
                           case 'Payment': return 'Paid To / Expense A/c (Dr.) *';
                           case 'Receipt': return 'Received From / Income A/c (Cr.) *';
                           case 'Contra': return 'Deposit To (Dr.) *';
                           case 'Journal': return 'Debit A/c (Dr.) *';
                           case 'Debit Note': return 'Supplier A/c (Dr.) *';
                           case 'Credit Note': return 'Customer A/c (Cr.) *';
                           default: return 'Account (Dr.) *';
                        }
                     })()}
`;

content = content.replace(
  /\{\(\(\) => \{\s*switch\(form\.type\) \{\s*case 'Sales': return 'Customer A\/c \*';\s*case 'Purchase': return 'Supplier A\/c \*';\s*case 'Payment': return 'Paid To \(Party \/ Expense\) \*';\s*case 'Receipt': return 'Received From \(Party \/ Income\) \*';\s*case 'Contra': return 'Deposit To \(Destination A\/c\) \*';\s*case 'Journal': return 'Debit A\/c \(Dr\) \*';\s*case 'Debit Note': return 'Supplier A\/c \*';\s*case 'Credit Note': return 'Customer A\/c \*';\s*default: return 'Account \(Dr\) \*';\s*\}\s*\}\)\(\)\}/,
  partyReplacement.trim()
);

const accountReplacement = `
                     {(() => {
                        switch(form.type) {
                           case 'Sales': return 'Sales Account (Cr.) *';
                           case 'Purchase': return 'Purchase Account (Dr.) *';
                           case 'Payment': return 'Paid From / Bank / Cash (Cr.) *';
                           case 'Receipt': return 'Received In / Bank / Cash (Dr.) *';
                           case 'Contra': return 'Withdraw From (Cr.) *';
                           case 'Journal': return 'Credit A/c (Cr.) *';
                           case 'Debit Note': return 'Purchase Return A/c (Cr.) *';
                           case 'Credit Note': return 'Sales Return A/c (Dr.) *';
                           default: return 'Account (Cr.) *';
                        }
                     })()}
`;

content = content.replace(
  /\{\(\(\) => \{\s*switch\(form\.type\) \{\s*case 'Sales': return 'Sales Account \*';\s*case 'Purchase': return 'Purchase Account \*';\s*case 'Payment': return 'Paid From \(Cash \/ Bank\) \*';\s*case 'Receipt': return 'Received In \(Cash \/ Bank\) \*';\s*case 'Contra': return 'Withdraw From \(Source A\/c\) \*';\s*case 'Journal': return 'Credit A\/c \(Cr\) \*';\s*case 'Debit Note': return 'Purchase Return Account \*';\s*case 'Credit Note': return 'Sales Return Account \*';\s*default: return 'Account \(Cr\) \*';\s*\}\s*\}\)\(\)\}/,
  accountReplacement.trim()
);

fs.writeFileSync('src/pages/Vouchers.tsx', content);

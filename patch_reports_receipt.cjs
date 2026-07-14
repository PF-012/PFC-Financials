const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const replacement = `
        } else if (v.type === 'Receipt') {
            const isCashBank = v.accountId && ['Bank Accounts', 'Cash-in-Hand'].includes(getLedgerGroup(v.accountId) || '');
            if (isCashBank) {
                applyToLedger(v.accountId, baseAmt);
            } else {
                if (isCurrent) { totalReceipts += baseAmt; unassignedReceipts += baseAmt; }
            }
            if (v.partyId) applyToLedger(v.partyId, -baseAmt);
        } else if (v.type === 'Payment') {
            const isCashBank = v.accountId && ['Bank Accounts', 'Cash-in-Hand'].includes(getLedgerGroup(v.accountId) || '');
            if (isCashBank) {
                applyToLedger(v.accountId, -baseAmt);
            } else {
                if (isCurrent) { totalPayments += baseAmt; unassignedPayments += baseAmt; }
            }
            if (v.partyId) applyToLedger(v.partyId, baseAmt);
        } else if (v.type === 'Contra') {
`;

code = code.replace(
  /\} else if \(v\.type === 'Receipt'\) \{[\s\S]*?\} else if \(v\.type === 'Contra'\) \{/,
  replacement.trim() + ' {'
);

fs.writeFileSync('src/pages/Reports.tsx', code);

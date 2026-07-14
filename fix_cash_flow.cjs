const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const regexReceipt = /\} else if \(v\.type === 'Receipt'\) \{[\s\S]*?if \(v\.partyId\) applyToLedger\(v\.partyId, -baseAmt\);/g;

const replacementReceipt = `} else if (v.type === 'Receipt') {
            const isCashBank = v.accountId && ['Bank Accounts', 'Cash-in-Hand'].includes(getLedgerGroup(v.accountId) || '');
            if (isCurrent) totalReceipts += baseAmt;
            if (isCashBank) {
                applyToLedger(v.accountId, baseAmt);
            } else {
                if (isCurrent) unassignedReceipts += baseAmt;
            }
            if (v.partyId) applyToLedger(v.partyId, -baseAmt);`;

code = code.replace(regexReceipt, replacementReceipt);

const regexPayment = /\} else if \(v\.type === 'Payment'\) \{[\s\S]*?if \(v\.partyId\) applyToLedger\(v\.partyId, baseAmt\);/g;

const replacementPayment = `} else if (v.type === 'Payment') {
            const isCashBank = v.accountId && ['Bank Accounts', 'Cash-in-Hand'].includes(getLedgerGroup(v.accountId) || '');
            if (isCurrent) totalPayments += baseAmt;
            if (isCashBank) {
                applyToLedger(v.accountId, -baseAmt);
            } else {
                if (isCurrent) unassignedPayments += baseAmt;
            }
            if (v.partyId) applyToLedger(v.partyId, baseAmt);`;

code = code.replace(regexPayment, replacementPayment);

fs.writeFileSync('src/pages/Reports.tsx', code);

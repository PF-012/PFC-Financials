const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// We need to change the Reports logic to verify if the accountId is ACTUALLY a Sales Account.
// If it's not, we treat it as unassigned.
// To do this, we need a lookup of ledger groups.

const replacement = `
        const getLedgerGroup = (id: string) => ledgers.find(l => l.id === id)?.group;

        if (v.type === 'Sales') {
            const isSalesAccount = v.accountId && ['Sales Accounts', 'Direct Incomes', 'Indirect Incomes'].includes(getLedgerGroup(v.accountId) || '');
            if (isSalesAccount) {
                applyToLedger(v.accountId, -baseAmt);
            } else {
                if (isCurrent) { totalSales += baseAmt; unassignedSales += baseAmt; }
                else prevTotalSales += baseAmt;
            }

            unassignedDuties -= totalGst; // Cr Duties
            if (v.partyId) applyToLedger(v.partyId, ((v.totalAmount || 0) - (v.tdsAmount || 0)));
        } else if (v.type === 'Purchase') {
            const isPurchaseAccount = v.accountId && ['Purchase Accounts', 'Direct Expenses', 'Indirect Expenses'].includes(getLedgerGroup(v.accountId) || '');
            if (isPurchaseAccount) {
                applyToLedger(v.accountId, baseAmt);
            } else {
                if (isCurrent) { totalPurchases += baseAmt; unassignedPurchases += baseAmt; }
                else prevTotalPurchases += baseAmt;
            }

            unassignedDuties += totalGst; // Dr Duties
            if (v.partyId) applyToLedger(v.partyId, -((v.totalAmount || 0) - (v.tdsAmount || 0)));
        } else if (v.type === 'Credit Note') {
            const isSalesAccount = v.accountId && ['Sales Accounts', 'Direct Incomes', 'Indirect Incomes'].includes(getLedgerGroup(v.accountId) || '');
            if (isSalesAccount) {
                applyToLedger(v.accountId, baseAmt);
            } else {
                if (isCurrent) { totalSales -= baseAmt; unassignedSales -= baseAmt; }
                else prevTotalSales -= baseAmt;
            }

            unassignedDuties += totalGst; // Dr Duties
            if (v.partyId) applyToLedger(v.partyId, -((v.totalAmount || 0) - (v.tdsAmount || 0)));
        } else if (v.type === 'Debit Note') {
            const isPurchaseAccount = v.accountId && ['Purchase Accounts', 'Direct Expenses', 'Indirect Expenses'].includes(getLedgerGroup(v.accountId) || '');
            if (isPurchaseAccount) {
                applyToLedger(v.accountId, -baseAmt);
            } else {
                if (isCurrent) { totalPurchases -= baseAmt; unassignedPurchases -= baseAmt; }
                else prevTotalPurchases -= baseAmt;
            }

            unassignedDuties -= totalGst; // Cr Duties
            if (v.partyId) applyToLedger(v.partyId, ((v.totalAmount || 0) - (v.tdsAmount || 0)));
        }
`;

// Replace the old logic
code = code.replace(
  /if \(v\.type === 'Sales'\) \{[\s\S]*?\} else if \(v\.type === 'Debit Note'\) \{[\s\S]*?\}/,
  replacement.trim()
);

fs.writeFileSync('src/pages/Reports.tsx', code);

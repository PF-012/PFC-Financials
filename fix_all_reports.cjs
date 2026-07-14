const fs = require('fs');
let lines = fs.readFileSync('src/pages/Reports.tsx', 'utf8').split('\n');

const startIndex = lines.findIndex(l => l.includes("if (v.type === 'Sales') {"));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.trim() === "});" && lines[i-1].includes("v.partyId"));

console.log("Start:", startIndex, "End:", endIndex);

const block = `
        if (v.type === 'Sales') {
            const isSalesAccount = v.accountId && ['Sales Accounts', 'Direct Incomes', 'Indirect Incomes'].includes(getLedgerGroup(v.accountId) || '');
            if (isSalesAccount) {
                applyToLedger(v.accountId, -baseAmt);
            } else {
                if (isCurrent) { totalSales += baseAmt; unassignedSales += baseAmt; }
                else prevTotalSales += baseAmt;
            }
            unassignedDuties -= totalGst;
            if (v.partyId) applyToLedger(v.partyId, ((v.totalAmount || 0) - (v.tdsAmount || 0)));
        } else if (v.type === 'Purchase') {
            const isPurchaseAccount = v.accountId && ['Purchase Accounts', 'Direct Expenses', 'Indirect Expenses'].includes(getLedgerGroup(v.accountId) || '');
            if (isPurchaseAccount) {
                applyToLedger(v.accountId, baseAmt);
            } else {
                if (isCurrent) { totalPurchases += baseAmt; unassignedPurchases += baseAmt; }
                else prevTotalPurchases += baseAmt;
            }
            unassignedDuties += totalGst;
            if (v.partyId) applyToLedger(v.partyId, -((v.totalAmount || 0) - (v.tdsAmount || 0)));
        } else if (v.type === 'Credit Note') {
            const isSalesAccount = v.accountId && ['Sales Accounts', 'Direct Incomes', 'Indirect Incomes'].includes(getLedgerGroup(v.accountId) || '');
            if (isSalesAccount) {
                applyToLedger(v.accountId, baseAmt);
            } else {
                if (isCurrent) { totalSales -= baseAmt; unassignedSales -= baseAmt; }
                else prevTotalSales -= baseAmt;
            }
            unassignedDuties += totalGst;
            if (v.partyId) applyToLedger(v.partyId, -((v.totalAmount || 0) - (v.tdsAmount || 0)));
        } else if (v.type === 'Debit Note') {
            const isPurchaseAccount = v.accountId && ['Purchase Accounts', 'Direct Expenses', 'Indirect Expenses'].includes(getLedgerGroup(v.accountId) || '');
            if (isPurchaseAccount) {
                applyToLedger(v.accountId, -baseAmt);
            } else {
                if (isCurrent) { totalPurchases -= baseAmt; unassignedPurchases -= baseAmt; }
                else prevTotalPurchases -= baseAmt;
            }
            unassignedDuties -= totalGst;
            if (v.partyId) applyToLedger(v.partyId, ((v.totalAmount || 0) - (v.tdsAmount || 0)));
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
            if (v.accountId) applyToLedger(v.accountId, baseAmt);
            if (v.partyId) applyToLedger(v.partyId, -baseAmt);
        } else if (v.type === 'Journal') {
            if (v.accountId) applyToLedger(v.accountId, baseAmt);
            if (v.partyId) applyToLedger(v.partyId, -baseAmt);
        }
`;

lines.splice(startIndex, endIndex - startIndex, block);
fs.writeFileSync('src/pages/Reports.tsx', lines.join('\n'));

const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const target = `        if (v.type === 'Sales') {
            if (v.accountId) applyToLedger(v.accountId, -baseAmt);
            else { if (isCurrent) unassignedSales += baseAmt; else prevUnassignedSales += baseAmt; }
            if (v.partyId) applyToLedger(v.partyId, v.totalAmount || 0);
            if (v.cgstAmount || v.sgstAmount || v.igstAmount || v.gstAmount) {
                const dutiesLedger = ledgers.find(l => l.group === 'Duties & Taxes');
                if (dutiesLedger) applyToLedger(dutiesLedger.id, -totalGst);
                else if (isCurrent) unassignedDuties -= totalGst;
            }
        } else if (v.type === 'Purchase') {
            if (v.accountId) applyToLedger(v.accountId, baseAmt);
            else { if (isCurrent) unassignedPurchases += baseAmt; else prevUnassignedPurchases += baseAmt; }
            if (v.partyId) applyToLedger(v.partyId, -(v.totalAmount || 0));
            if (v.cgstAmount || v.sgstAmount || v.igstAmount || v.gstAmount) {
                const dutiesLedger = ledgers.find(l => l.group === 'Duties & Taxes');
                if (dutiesLedger) applyToLedger(dutiesLedger.id, totalGst);
                else if (isCurrent) unassignedDuties += totalGst;
            }
        } else if (v.type === 'Receipt') {
            const isCashBank = v.accountId && ['Bank Accounts', 'Cash-in-Hand'].includes(getLedgerGroup(v.accountId) || '');
            if (isCurrent) totalReceipts += baseAmt;
            if (isCashBank) {
                applyToLedger(v.accountId, baseAmt);
            } else {
                if (isCurrent) unassignedReceipts += baseAmt;
            }
            if (v.partyId) applyToLedger(v.partyId, -baseAmt);
        } else if (v.type === 'Payment') {
            const isCashBank = v.accountId && ['Bank Accounts', 'Cash-in-Hand'].includes(getLedgerGroup(v.accountId) || '');
            if (isCurrent) totalPayments += baseAmt;
            if (isCashBank) {
                applyToLedger(v.accountId, -baseAmt);
            } else {
                if (isCurrent) unassignedPayments += baseAmt;
            }
            if (v.partyId) applyToLedger(v.partyId, baseAmt);
        } else if (v.type === 'Contra') {
            if (v.accountId) applyToLedger(v.accountId, baseAmt);
            if (v.partyId) applyToLedger(v.partyId, -baseAmt);
        } else if (v.type === 'Journal') {
            if (v.accountId) applyToLedger(v.accountId, baseAmt);
            if (v.partyId) applyToLedger(v.partyId, -baseAmt);
        }`;

const replacement = `        if (v.type === 'Sales') {
            if (v.accountId) applyToLedger(v.accountId, -baseAmt);
            else { if (isCurrent) unassignedSales += baseAmt; else prevUnassignedSales += baseAmt; }
            if (v.partyId) applyToLedger(v.partyId, v.totalAmount || 0);
            if (totalGst > 0) {
                const dutiesLedger = ledgers.find(l => l.group === 'Duties & Taxes');
                if (dutiesLedger) applyToLedger(dutiesLedger.id, -totalGst);
                else if (isCurrent) unassignedDuties -= totalGst;
            }
        } else if (v.type === 'Purchase') {
            if (v.accountId) applyToLedger(v.accountId, baseAmt);
            else { if (isCurrent) unassignedPurchases += baseAmt; else prevUnassignedPurchases += baseAmt; }
            if (v.partyId) applyToLedger(v.partyId, -(v.totalAmount || 0));
            if (totalGst > 0) {
                const dutiesLedger = ledgers.find(l => l.group === 'Duties & Taxes');
                if (dutiesLedger) applyToLedger(dutiesLedger.id, totalGst);
                else if (isCurrent) unassignedDuties += totalGst;
            }
        } else if (v.type === 'Receipt') {
            const isCashBank = v.accountId && ['Bank Accounts', 'Cash-in-Hand'].includes(getLedgerGroup(v.accountId) || '');
            if (isCurrent) totalReceipts += baseAmt;
            if (isCashBank) {
                applyToLedger(v.accountId, baseAmt);
            } else {
                if (isCurrent) unassignedReceipts += baseAmt;
            }
            if (v.partyId) applyToLedger(v.partyId, -baseAmt);
        } else if (v.type === 'Payment') {
            const isCashBank = v.accountId && ['Bank Accounts', 'Cash-in-Hand'].includes(getLedgerGroup(v.accountId) || '');
            if (isCurrent) totalPayments += baseAmt;
            if (isCashBank) {
                applyToLedger(v.accountId, -baseAmt);
            } else {
                if (isCurrent) unassignedPayments += baseAmt;
            }
            if (v.partyId) applyToLedger(v.partyId, baseAmt);
        } else if (v.type === 'Contra') {
            if (v.partyId) applyToLedger(v.partyId, baseAmt); // Deposit To (Dr)
            if (v.accountId) applyToLedger(v.accountId, -baseAmt); // Withdraw From (Cr)
        } else if (v.type === 'Journal') {
            if (v.partyId) applyToLedger(v.partyId, v.totalAmount || 0); // Dr
            if (v.accountId) applyToLedger(v.accountId, -(v.totalAmount || 0)); // Cr
        } else if (v.type === 'Debit Note') {
            if (v.partyId) applyToLedger(v.partyId, v.totalAmount || 0); // Supplier (Dr)
            if (v.accountId) applyToLedger(v.accountId, -baseAmt); // Purchase Return (Cr)
            if (totalGst > 0) {
                const dutiesLedger = ledgers.find(l => l.group === 'Duties & Taxes');
                if (dutiesLedger) applyToLedger(dutiesLedger.id, -totalGst);
                else if (isCurrent) unassignedDuties -= totalGst;
            }
        } else if (v.type === 'Credit Note') {
            if (v.partyId) applyToLedger(v.partyId, -(v.totalAmount || 0)); // Customer (Cr)
            if (v.accountId) applyToLedger(v.accountId, baseAmt); // Sales Return (Dr)
            if (totalGst > 0) {
                const dutiesLedger = ledgers.find(l => l.group === 'Duties & Taxes');
                if (dutiesLedger) applyToLedger(dutiesLedger.id, totalGst);
                else if (isCurrent) unassignedDuties += totalGst;
            }
        }`;

if (code.includes("else if (v.type === 'Journal') {\n            if (v.accountId) applyToLedger(v.accountId, baseAmt);\n            if (v.partyId) applyToLedger(v.partyId, -baseAmt);\n        }")) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/Reports.tsx', code);
    console.log("Patched Reports.tsx voucher processing!");
} else {
    console.log("Target not found!");
}

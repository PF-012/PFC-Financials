const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// The file currently has duplicates for Credit Note and Debit Note.
// Let's remove the duplicated old blocks.
// The duplicated old blocks start exactly at `} else if (v.type === 'Credit Note') {` (line 167) 
// up to `} else if (v.type === 'Receipt') {`

const oldCreditNote = /\} else if \(v\.type === 'Credit Note'\) \{\s*if \(v\.accountId\) applyToLedger\(v\.accountId, baseAmt\);\s*else if \(isCurrent\) totalSales -= baseAmt;\s*else prevTotalSales -= baseAmt;\s*unassignedDuties \+= totalGst; \/\/ Dr Duties\s*if \(v\.partyId\) applyToLedger\(v\.partyId, -\(\(v\.totalAmount \|\| 0\) - \(v\.tdsAmount \|\| 0\)\)\);\s*\} else if \(v\.type === 'Debit Note'\) \{\s*if \(v\.accountId\) applyToLedger\(v\.accountId, -baseAmt\);\s*else if \(isCurrent\) totalPurchases -= baseAmt;\s*else prevTotalPurchases -= baseAmt;\s*unassignedDuties -= totalGst; \/\/ Cr Duties\s*if \(v\.partyId\) applyToLedger\(v\.partyId, \(\(v\.totalAmount \|\| 0\) - \(v\.tdsAmount \|\| 0\)\)\);\s*\}/;

code = code.replace(oldCreditNote, "");

fs.writeFileSync('src/pages/Reports.tsx', code);

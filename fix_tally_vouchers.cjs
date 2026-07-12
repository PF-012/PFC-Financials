const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const replacement = `
             let partyId = getStr(voucherNode.PARTYLEDGERNAME || voucherNode.partyName || voucherNode.partyId || voucherNode['Party Name'] || voucherNode.Party || voucherNode['Paid To'] || voucherNode['Received From'], 'Unknown');
             let accountId = getStr(voucherNode.accountId || voucherNode.Account || voucherNode['Account Name'] || voucherNode['Paid From'] || voucherNode['Received In'] || voucherNode['Deposit To']);
             
             // Advanced Tally XML parsing
             if (voucherNode['ALLLEDGERENTRIES.LIST']) {
                 const entries = Array.isArray(voucherNode['ALLLEDGERENTRIES.LIST']) ? voucherNode['ALLLEDGERENTRIES.LIST'] : [voucherNode['ALLLEDGERENTRIES.LIST']];
                 
                 // If partyId is Unknown, try to deduce from ISDEEMEDPOSITIVE (Yes = Dr, No = Cr)
                 if (partyId === 'Unknown') {
                     // For Payments/Purchases, Debit is usually the Party/Expense. Credit is Bank.
                     // For Receipts/Sales, Credit is usually the Party/Income. Debit is Bank.
                     const drEntries = entries.filter((e: any) => getStr(e.ISDEEMEDPOSITIVE) === 'Yes');
                     const crEntries = entries.filter((e: any) => getStr(e.ISDEEMEDPOSITIVE) === 'No');
                     
                     if (vType === 'Receipt' || vType === 'Sales') {
                        if (crEntries.length > 0) partyId = getStr(crEntries[0].LEDGERNAME || 'Unknown');
                        if (drEntries.length > 0 && !accountId) accountId = getStr(drEntries[0].LEDGERNAME || '');
                     } else if (vType === 'Payment' || vType === 'Purchase') {
                        if (drEntries.length > 0) partyId = getStr(drEntries[0].LEDGERNAME || 'Unknown');
                        if (crEntries.length > 0 && !accountId) accountId = getStr(crEntries[0].LEDGERNAME || '');
                     } else {
                        // Journal or Contra
                        if (drEntries.length > 0) partyId = getStr(drEntries[0].LEDGERNAME || 'Unknown');
                        if (crEntries.length > 0 && !accountId) accountId = getStr(crEntries[0].LEDGERNAME || '');
                     }
                 }

                 entries.forEach((entry: any) => {
                     const lName = getStr(entry.LEDGERNAME || '');
                     const lNameLower = String(lName || '').toLowerCase();
                     const amt = Math.abs(getNum(entry.AMOUNT));
                     
                     if (lName === partyId) {
                         if (!totalAmt) totalAmt = amt;
                     } else if (lNameLower.includes('cgst')) {
                         cgstAmt += amt;
                     } else if (lNameLower.includes('sgst')) {
                         sgstAmt += amt;
                     } else if (lNameLower.includes('igst')) {
                         igstAmt += amt;
                     } else if (lNameLower.includes('tds')) {
                         tdsAmt += amt;
                     } else if (lNameLower.includes('sale') || lNameLower.includes('purchase')) {
                         if (!accountId && lName !== partyId) accountId = lName;
                     }
                 });
             }
`;

content = content.replace(
  /const partyId = getStr\(voucherNode\.PARTYLEDGERNAME[\s\S]*?if \(!accountId\) accountId = lName;\s*\}\s*\}\);\s*\}/,
  replacement.trim()
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);

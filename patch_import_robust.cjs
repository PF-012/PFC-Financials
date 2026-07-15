const fs = require('fs');
let code = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const regex = /\} else if \(type === 'vouchers'\) \{[\s\S]*?delete item\.partyName; delete item\.accountName;/;

const replacement = `} else if (type === 'vouchers') {
         // Resolve partyId and accountId robustly to avoid UUID names
         const resolveLedger = (nameVal, idVal, defaultGroup) => {
             // If we have an explicit name, try to match it first
             if (nameVal && typeof nameVal === 'string') {
                 let ledger = existingLedgers.find(l => String(l.name || '').toLowerCase() === nameVal.toLowerCase());
                 if (ledger) return ledger.id;
             }
             // If we have an ID, check if a ledger with this ID exists
             if (idVal && typeof idVal === 'string') {
                 let ledger = existingLedgers.find(l => l.id === idVal);
                 if (ledger) return ledger.id;
             }
             // Fallback: search by name matching the ID string (legacy behavior, but dangerous if it's a UUID)
             if (idVal && typeof idVal === 'string') {
                 let ledger = existingLedgers.find(l => String(l.name || '').toLowerCase() === idVal.toLowerCase());
                 if (ledger) return ledger.id;
             }

             // Auto-create missing ledger if we have ANY string to use
             const strToUse = nameVal || idVal;
             if (strToUse && typeof strToUse === 'string') {
                 const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                 const finalName = (!uuidRegex.test(strToUse)) ? strToUse : (nameVal || 'Unknown Ledger');
                 
                 const newLedgerRef = doc(collection(db, 'ledgers'));
                 const newLedger = { name: finalName, group: defaultGroup, companyId: activeCompany.id, userId: user.id };
                 batch.set(newLedgerRef, newLedger);
                 const ledger = { id: newLedgerRef.id, ...newLedger };
                 existingLedgers.push(ledger);
                 return ledger.id;
             }
             return idVal;
         };

         item.partyId = resolveLedger(item.partyName, item.partyId, 'Sundry Debtors');
         item.accountId = resolveLedger(item.accountName, item.accountId, 'Sales Accounts');
      }
      
      delete item.partyName; delete item.accountName;`;

if (code.match(regex)) {
   code = code.replace(regex, replacement);
   fs.writeFileSync('src/pages/ImportExport.tsx', code);
   console.log("Patched successfully");
} else {
   console.log("Could not find regex match");
}

const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const importLogic = `
    const batch = writeBatch(db);
    
    // Fetch all existing ledgers for deduplication and voucher resolution
    const snap = await getDocs(query(collection(db, 'ledgers'), where('companyId', '==', activeCompany.id)));
    const existingLedgers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    let addedCount = 0;
    mappedData.forEach((item: any) => {
      if (type === 'ledgers') {
         const exists = existingLedgers.find(l => String(l.name || '').toLowerCase() === String(item.name || '').toLowerCase());
         if (exists) return; // Skip duplicate ledger
         
         const newId = doc(collection(db, 'ledgers')).id;
         item.id = newId;
         existingLedgers.push(item); // Add to local list to prevent duplicates within the file itself
         
         const docRef = doc(db, 'ledgers', newId);
         batch.set(docRef, {
           ...item,
           companyId: activeCompany.id,
           userId: user.uid,
           importedAt: new Date().toISOString()
         });
         addedCount++;
         return; // We handled it here
      } else if (type === 'vouchers') {
         // Resolve partyId and accountId from string names to ledger IDs
         if (item.partyId && typeof item.partyId === 'string') {
             let ledger = existingLedgers.find(l => String(l.name || '').toLowerCase() === item.partyId.toLowerCase());
             if (!ledger) {
                 // Auto-create missing ledger
                 const newLedgerRef = doc(collection(db, 'ledgers'));
                 const newLedger = { name: item.partyId, group: 'Sundry Debtors', companyId: activeCompany.id, userId: user.uid };
                 batch.set(newLedgerRef, newLedger);
                 ledger = { id: newLedgerRef.id, ...newLedger };
                 existingLedgers.push(ledger);
             }
             item.partyId = ledger.id;
         }
         if (item.accountId && typeof item.accountId === 'string') {
             let ledger = existingLedgers.find(l => String(l.name || '').toLowerCase() === item.accountId.toLowerCase());
             if (!ledger) {
                 // Auto-create missing ledger
                 const newLedgerRef = doc(collection(db, 'ledgers'));
                 const newLedger = { name: item.accountId, group: 'Sales Accounts', companyId: activeCompany.id, userId: user.uid };
                 batch.set(newLedgerRef, newLedger);
                 ledger = { id: newLedgerRef.id, ...newLedger };
                 existingLedgers.push(ledger);
             }
             item.accountId = ledger.id;
         }
      }
      
      const docRef = doc(collection(db, type));
      batch.set(docRef, {
        ...item,
        companyId: activeCompany.id,
        userId: user.uid,
        importedAt: new Date().toISOString()
      });
      addedCount++;
    });

    await batch.commit();
    return addedCount;
`;

content = content.replace(
  /const batch = writeBatch\(db\);\s*\/\/ Deduplication for ledgers[\s\S]*?return addedCount;\n/,
  importLogic.trim() + '\n'
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);

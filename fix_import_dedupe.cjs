const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const importLogic = `
    const batch = writeBatch(db);
    
    // Deduplication for ledgers
    let existingLedgers: any[] = [];
    if (type === 'ledgers') {
       const snap = await getDocs(query(collection(db, 'ledgers'), where('companyId', '==', activeCompany.id)));
       existingLedgers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    
    let addedCount = 0;
    mappedData.forEach((item: any) => {
      if (type === 'ledgers') {
         const exists = existingLedgers.find(l => l.name.toLowerCase() === item.name.toLowerCase());
         if (exists) return; // Skip duplicate ledger
         existingLedgers.push(item); // Add to local list to prevent duplicates within the file itself
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
  /const batch = writeBatch\(db\);\s*mappedData\.forEach\(\(item: any\) => \{\s*const docRef = doc\(collection\(db, type\)\);\s*batch\.set\(docRef, \{\s*\.\.\.item,\s*companyId: activeCompany\.id,\s*userId: user\.uid,\s*importedAt: new Date\(\)\.toISOString\(\)\s*\}\);\s*\}\);\s*await batch\.commit\(\);\s*return mappedData\.length;/,
  importLogic.trim()
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);

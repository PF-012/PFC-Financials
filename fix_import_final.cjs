const fs = require('fs');
let code = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

code = code.replace(
  /const uuidRegex = \/\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\$\/i;[\s\S]*?\/\/ Delete dummy ledgers \(ledgers whose name is a UUID\)\n      const dummyLedgers = ledgers\.filter\(l => uuidRegex\.test\(l\.name\)\);\n      for \(const dL of dummyLedgers\) \{\n          batch\.delete\(doc\(db, 'ledgers', dL\.id\)\);\n      \}/,
  `const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // We will just rename the ledgers that have a UUID as their name.
      const dummyLedgers = ledgers.filter(l => uuidRegex.test(l.name));
      let renamedCount = 0;
      for (const dL of dummyLedgers) {
          const correctName = recoveredMap[dL.name];
          if (correctName) {
              batch.update(doc(db, 'ledgers', dL.id), { name: correctName });
              renamedCount++;
          }
      }
      
      // For vouchers, if they happen to have stored the UUID in partyName or accountName, clean it up.
      // Actually, we just fixed the ledgers themselves, so DayBook which looks up ledger by ID will now get the correct name!`
);

code = code.replace(
  'setMessage(`Successfully fixed ${count} vouchers and cleaned up ${dummyLedgers.length} duplicate ledgers.`);',
  'setMessage(`Successfully restored ${renamedCount} ledger names.`);'
);

fs.writeFileSync('src/pages/ImportExport.tsx', code);

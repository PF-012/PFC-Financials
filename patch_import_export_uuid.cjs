const fs = require('fs');
let code = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

code = code.replace(
    /let ledger = existingLedgers\.find\(l => String\(l\.name \|\| ''\)\.toLowerCase\(\) === pName\.toLowerCase\(\)\);/g,
    "let ledger = existingLedgers.find(l => l.id === pName || String(l.name || '').toLowerCase() === pName.toLowerCase());"
);

code = code.replace(
    /let ledger = existingLedgers\.find\(l => String\(l\.name \|\| ''\)\.toLowerCase\(\) === aName\.toLowerCase\(\)\);/g,
    "let ledger = existingLedgers.find(l => l.id === aName || String(l.name || '').toLowerCase() === aName.toLowerCase());"
);

// We should also delete id from item so that it doesn't conflict during import
code = code.replace(
    /delete item\.partyName; delete item\.accountName; delete item\.createdAt; delete item\.updatedAt; delete item\.importedAt;/g,
    "delete item.partyName; delete item.accountName; delete item.createdAt; delete item.updatedAt; delete item.importedAt; delete item.id;"
);

fs.writeFileSync('src/pages/ImportExport.tsx', code);

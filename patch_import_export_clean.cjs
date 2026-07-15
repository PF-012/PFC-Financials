const fs = require('fs');
let code = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

code = code.replace(
    /delete item\.partyName; delete item\.accountName;/g,
    "delete item.partyName; delete item.accountName; delete item.createdAt; delete item.updatedAt; delete item.importedAt;"
);

fs.writeFileSync('src/pages/ImportExport.tsx', code);

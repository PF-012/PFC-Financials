const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const replacement = `
       if (type === 'ledgers') {
          const ledgerNode = item.LEDGER || item;
          const nameList = ledgerNode['NAME.LIST'] ? ledgerNode['NAME.LIST'].NAME : undefined;
          const name = getStr(ledgerNode.NAME || nameList || ledgerNode.name || ledgerNode.Name || ledgerNode['Ledger Name']);
          const group = getStr(ledgerNode.PARENT || ledgerNode.group || ledgerNode.Group || ledgerNode['Under Group']);
`;

content = content.replace(
  /if \(type === 'ledgers'\) \{\n\s*const ledgerNode = item\.LEDGER \|\| item;\n\s*const name = getStr\(ledgerNode\.NAME \|\| ledgerNode\.name \|\| ledgerNode\.Name \|\| ledgerNode\['Ledger Name'\]\);\n\s*const group = getStr\(ledgerNode\.PARENT \|\| ledgerNode\.group \|\| ledgerNode\.Group \|\| ledgerNode\['Under Group'\]\);/,
  replacement.trim()
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);

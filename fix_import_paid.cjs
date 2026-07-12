const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

content = content.replace(
  /const partyId = getStr\(voucherNode\.PARTYLEDGERNAME \|\| voucherNode\.partyName \|\| voucherNode\.partyId \|\| voucherNode\['Party Name'\] \|\| voucherNode\.Party, 'Unknown'\);/,
  `const partyId = getStr(voucherNode.PARTYLEDGERNAME || voucherNode.partyName || voucherNode.partyId || voucherNode['Party Name'] || voucherNode.Party || voucherNode['Paid To'] || voucherNode['Received From'], 'Unknown');`
);

content = content.replace(
  /let accountId = getStr\(voucherNode\.accountId \|\| voucherNode\.Account \|\| voucherNode\['Account Name'\]\);/,
  `let accountId = getStr(voucherNode.accountId || voucherNode.Account || voucherNode['Account Name'] || voucherNode['Paid From'] || voucherNode['Received In'] || voucherNode['Deposit To']);`
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const helper = `
const getField = (obj: any, keys: string[]) => {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  const lowerKeys = keys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
  for (const objKey of Object.keys(obj)) {
    const lowerObjKey = objKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (lowerKeys.includes(lowerObjKey) || lowerKeys.some(k => lowerObjKey.includes(k))) {
       if (obj[objKey] !== undefined && obj[objKey] !== null && obj[objKey] !== '') {
          return obj[objKey];
       }
    }
  }
  return undefined;
};
`;

content = content.replace(/const getStr = /, helper + '\nconst getStr = ');

content = content.replace(
  /const name = getStr\(ledgerNode\.NAME \|\| nameList \|\| ledgerNode\.name \|\| ledgerNode\.Name \|\| ledgerNode\['Ledger Name'\]\);/,
  "const name = getStr(getField(ledgerNode, ['NAME', 'name', 'Name', 'Ledger Name', 'Party Name']) || nameList);"
);

content = content.replace(
  /const group = getStr\(ledgerNode\.PARENT \|\| ledgerNode\.group \|\| ledgerNode\.Group \|\| ledgerNode\['Under Group'\]\);/,
  "const group = getStr(getField(ledgerNode, ['PARENT', 'group', 'Group', 'Under Group', 'Account Group']));"
);

content = content.replace(
  /const vType = getStr\(voucherNode\.VOUCHERTYPENAME \|\| voucherNode\.type \|\| voucherNode\['Voucher Type'\] \|\| voucherNode\.Type\);/,
  "const vType = getStr(getField(voucherNode, ['VOUCHERTYPENAME', 'type', 'Type', 'Voucher Type']));"
);

content = content.replace(
  /const vDate = getStr\(voucherNode\.DATE \|\| voucherNode\.date \|\| voucherNode\.Date \|\| voucherNode\['Voucher Date'\]\);/,
  "const vDate = getStr(getField(voucherNode, ['DATE', 'date', 'Date', 'Voucher Date']));"
);

content = content.replace(
  /let totalAmt = getNum\(voucherNode\.AMOUNT \|\| voucherNode\.totalAmount \|\| voucherNode\.amount \|\| voucherNode\.Amount \|\| voucherNode\['Total Amount'\]\);/,
  "let totalAmt = getNum(getField(voucherNode, ['AMOUNT', 'totalAmount', 'amount', 'Amount', 'Total Amount']));"
);

content = content.replace(
  /let cgstAmt = getNum\(voucherNode\.cgstAmount \|\| voucherNode\.CGST \|\| voucherNode\['CGST Amount'\]\);/,
  "let cgstAmt = getNum(getField(voucherNode, ['cgstAmount', 'CGST', 'CGST Amount']));"
);

content = content.replace(
  /let sgstAmt = getNum\(voucherNode\.sgstAmount \|\| voucherNode\.SGST \|\| voucherNode\['SGST Amount'\]\);/,
  "let sgstAmt = getNum(getField(voucherNode, ['sgstAmount', 'SGST', 'SGST Amount']));"
);

content = content.replace(
  /let igstAmt = getNum\(voucherNode\.igstAmount \|\| voucherNode\.IGST \|\| voucherNode\['IGST Amount'\]\);/,
  "let igstAmt = getNum(getField(voucherNode, ['igstAmount', 'IGST', 'IGST Amount']));"
);

content = content.replace(
  /let tdsAmt = getNum\(voucherNode\.tdsAmount \|\| voucherNode\.TDS \|\| voucherNode\['TDS Amount'\]\);/,
  "let tdsAmt = getNum(getField(voucherNode, ['tdsAmount', 'TDS', 'TDS Amount']));"
);

content = content.replace(
  /let partyId = getStr\(voucherNode\.PARTYLEDGERNAME \|\| voucherNode\.partyName \|\| voucherNode\.partyId \|\| voucherNode\['Party Name'\] \|\| voucherNode\.Party \|\| voucherNode\['Paid To'\] \|\| voucherNode\['Received From'\], 'Unknown'\);/,
  "let partyId = getStr(getField(voucherNode, ['PARTYLEDGERNAME', 'partyName', 'partyId', 'Party Name', 'Party', 'Paid To', 'Received From', 'Supplier Ac', 'Customer Ac']), 'Unknown');"
);

content = content.replace(
  /let accountId = getStr\(voucherNode\.accountId \|\| voucherNode\.Account \|\| voucherNode\['Account Name'\] \|\| voucherNode\['Paid From'\] \|\| voucherNode\['Received In'\] \|\| voucherNode\['Deposit To'\]\);/,
  "let accountId = getStr(getField(voucherNode, ['accountId', 'Account', 'Account Name', 'Paid From', 'Received In', 'Deposit To', 'Sales Account', 'Purchase Account', 'Debit Ac']));"
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const getStrDef = `
const getStr = (val: any, defaultVal = ''): string => {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (Object.keys(val).length === 0) return defaultVal;
    // If it's an array with one element
    if (Array.isArray(val) && val.length > 0) return getStr(val[0], defaultVal);
    // If it's a Tally XML array, join it
    if (Array.isArray(val)) return val.map(v => getStr(v)).join(', ');
    return defaultVal;
  }
  return defaultVal;
};

const getNum = (val: any): number => {
  const str = getStr(val, '0');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};
`;

if (!content.includes('const getStr =')) {
  content = content.replace(
    'const unwrapXml =',
    getStrDef + '\nconst unwrapXml ='
  );
}

// Replace mapping logic
const newMapping = `
    // Map fields (universal mapping for Tally XML, JSON, CSV, XLSX)
    const mappedData = data.map((item: any) => {
       if (type === 'ledgers') {
          const ledgerNode = item.LEDGER || item;
          const name = getStr(ledgerNode.NAME || ledgerNode.name || ledgerNode.Name || ledgerNode['Ledger Name']);
          const group = getStr(ledgerNode.PARENT || ledgerNode.group || ledgerNode.Group || ledgerNode['Under Group']);
          if (name || group) {
             return {
                name: name || 'Unknown Ledger',
                group: group || 'Capital Account',
                openingBalance: getNum(ledgerNode.OPENINGBALANCE || ledgerNode.openingBalance || ledgerNode.opening_balance || ledgerNode['Opening Balance']),
                address: getStr(ledgerNode.ADDRESS || ledgerNode.address || ledgerNode.Address),
                gstin: getStr(ledgerNode.PARTYGSTIN || ledgerNode.gstin || ledgerNode.GSTIN || ledgerNode['GSTIN/UIN']),
                contactNo: getStr(ledgerNode.LEDSTATENAME || ledgerNode.contactNo || ledgerNode['Contact No'] || ledgerNode.Contact)
             };
          }
       } else if (type === 'vouchers') {
          const voucherNode = item.VOUCHER || item;
          const vType = getStr(voucherNode.VOUCHERTYPENAME || voucherNode.type || voucherNode['Voucher Type'] || voucherNode.Type);
          const vDate = getStr(voucherNode.DATE || voucherNode.date || voucherNode.Date || voucherNode['Voucher Date']);
          if (vType || vDate) {
             let parsedDate = vDate;
             if (parsedDate && parsedDate.length === 8 && !parsedDate.includes('-')) {
                 parsedDate = \`\${parsedDate.substring(0,4)}-\${parsedDate.substring(4,6)}-\${parsedDate.substring(6,8)}\`;
             } else if (parsedDate) {
                 const d = new Date(parsedDate);
                 if (!isNaN(d.getTime())) {
                     parsedDate = d.toISOString().split('T')[0];
                 } else {
                     parsedDate = new Date().toISOString().split('T')[0];
                 }
             } else {
                 parsedDate = new Date().toISOString().split('T')[0];
             }
             
             return {
                type: vType || 'Journal',
                date: parsedDate,
                number: getStr(voucherNode.VOUCHERNUMBER || voucherNode.number || voucherNode['Voucher No.'] || voucherNode.Number || voucherNode.Ref),
                partyId: getStr(voucherNode.PARTYLEDGERNAME || voucherNode.partyName || voucherNode.partyId || voucherNode['Party Name'] || voucherNode.Party, 'Unknown'),
                accountId: getStr(voucherNode.accountId || voucherNode.Account || voucherNode['Account Name']),
                totalAmount: getNum(voucherNode.AMOUNT || voucherNode.totalAmount || voucherNode.amount || voucherNode.Amount || voucherNode['Total Amount']),
                cgstAmount: getNum(voucherNode.cgstAmount || voucherNode.CGST || voucherNode['CGST Amount']),
                sgstAmount: getNum(voucherNode.sgstAmount || voucherNode.SGST || voucherNode['SGST Amount']),
                igstAmount: getNum(voucherNode.igstAmount || voucherNode.IGST || voucherNode['IGST Amount']),
                tdsAmount: getNum(voucherNode.tdsAmount || voucherNode.TDS || voucherNode['TDS Amount']),
                itemName: getStr(voucherNode.itemName || voucherNode.Item || voucherNode['Item Name']),
                narration: getStr(voucherNode.NARRATION || voucherNode.narration || voucherNode.Narration)
             };
          }
       }
       return item;
    }).filter((item: any) => item && Object.keys(item).length > 0);
`;

const lines = content.split('\n');
let startIndex = lines.findIndex(l => l.includes('// Map fields (universal mapping for Tally XML, JSON, CSV, XLSX)'));
let endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('const batch = writeBatch(db);'));

if (startIndex !== -1 && endIndex !== -1) {
    lines.splice(startIndex, endIndex - startIndex, newMapping.trim() + '\n\n    ');
    fs.writeFileSync('src/pages/ImportExport.tsx', lines.join('\n'));
} else {
    console.error("Mapping section not found");
}

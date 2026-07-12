const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const replacement = `
        data = rawData.map(item => {
           if (type === 'ledgers') {
              const ledgerNode = item.LEDGER || item;
              if (ledgerNode.NAME || ledgerNode.PARENT || ledgerNode.name || ledgerNode.group) {
                 return {
                    name: ledgerNode.NAME || ledgerNode.name || 'Unknown Ledger',
                    group: ledgerNode.PARENT || ledgerNode.group || 'Capital Account',
                    openingBalance: parseFloat(ledgerNode.OPENINGBALANCE || ledgerNode.openingBalance || ledgerNode.opening_balance || 0) || 0,
                    address: ledgerNode.ADDRESS ? (Array.isArray(ledgerNode.ADDRESS) ? ledgerNode.ADDRESS.join(', ') : ledgerNode.ADDRESS) : (ledgerNode.address || ''),
                    gstin: ledgerNode.PARTYGSTIN || ledgerNode.gstin || '',
                    contactNo: ledgerNode.LEDSTATENAME || ledgerNode.contactNo || ''
                 };
              }
           } else if (type === 'vouchers') {
              const voucherNode = item.VOUCHER || item;
              if (voucherNode.VOUCHERTYPENAME || voucherNode.DATE || voucherNode.type || voucherNode.date) {
                 return {
                    type: voucherNode.VOUCHERTYPENAME || voucherNode.type || 'Journal',
                    date: (voucherNode.DATE && String(voucherNode.DATE).length === 8) 
                          ? \`\${String(voucherNode.DATE).substring(0,4)}-\${String(voucherNode.DATE).substring(4,6)}-\${String(voucherNode.DATE).substring(6,8)}\`
                          : (voucherNode.DATE || voucherNode.date || new Date().toISOString().split('T')[0]),
                    number: voucherNode.VOUCHERNUMBER || voucherNode.number || '',
                    partyId: voucherNode.PARTYLEDGERNAME || voucherNode.partyName || voucherNode.partyId || 'Unknown',
                    accountId: voucherNode.accountId || '',
                    totalAmount: parseFloat(voucherNode.AMOUNT || voucherNode.totalAmount || voucherNode.amount || 0) || 0,
                    cgstAmount: parseFloat(voucherNode.cgstAmount || 0) || 0,
                    sgstAmount: parseFloat(voucherNode.sgstAmount || 0) || 0,
                    igstAmount: parseFloat(voucherNode.igstAmount || 0) || 0,
                    tdsAmount: parseFloat(voucherNode.tdsAmount || 0) || 0,
                    itemName: voucherNode.itemName || '',
                    narration: voucherNode.NARRATION || voucherNode.narration || ''
                 };
              }
           }
           return item;
        }).filter(item => item && Object.keys(item).length > 0);
`;

const lines = content.split('\\n');
const startIndex = lines.findIndex(l => l.includes('data = rawData.map(item => {') && lines.indexOf(l) > 200);

if (startIndex !== -1) {
    let endIndex = startIndex;
    while (!lines[endIndex].includes('}).filter(item => item && Object.keys(item).length > 0);')) {
        endIndex++;
    }
    
    lines.splice(startIndex, endIndex - startIndex + 1, replacement.trim());
    fs.writeFileSync('src/pages/ImportExport.tsx', lines.join('\\n'));
} else {
    console.error("Could not find start index for JSON mapping");
}

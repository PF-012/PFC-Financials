const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const mappingBlock = `
    const mappedData = data.map((item: any) => {
       if (type === 'ledgers') {
          const ledgerNode = item.LEDGER || item;
          const name = getStr(ledgerNode.NAME || ledgerNode.name || ledgerNode.Name || ledgerNode['Ledger Name']);
          const group = getStr(ledgerNode.PARENT || ledgerNode.group || ledgerNode.Group || ledgerNode['Under Group']);
          if (name || group) {
             let refinedGroup = group || 'Capital Account';
             const lowerName = name.toLowerCase();
             const lowerGroup = refinedGroup.toLowerCase();

             // Auto-correction for mismatched ledgers like CGST going to Purchase
             const isTax = lowerName.includes('cgst') || lowerName.includes('sgst') || lowerName.includes('igst') || lowerName.includes('tax') || lowerName.includes('duty') || lowerName.includes('cess') || lowerName.includes('tds');
             if (isTax && !lowerGroup.includes('tax') && !lowerGroup.includes('dut')) {
                 refinedGroup = 'Duties & Taxes';
             } else if ((lowerName.includes('bank') || lowerName.includes('sbi') || lowerName.includes('hdfc') || lowerName.includes('icici')) && !lowerGroup.includes('bank')) {
                 refinedGroup = 'Bank Accounts';
             } else if (lowerName.includes('cash') && !lowerGroup.includes('cash')) {
                 refinedGroup = 'Cash-in-Hand';
             } else if (lowerName.includes('sale') && !lowerGroup.includes('sale') && !lowerGroup.includes('income')) {
                 refinedGroup = 'Sales Accounts';
             } else if (lowerName.includes('purchase') && !lowerGroup.includes('purchase') && !lowerGroup.includes('expense')) {
                 refinedGroup = 'Purchase Accounts';
             }

             return {
                name: name || 'Unknown Ledger',
                group: refinedGroup,
                openingBalance: getNum(ledgerNode.OPENINGBALANCE || ledgerNode.openingBalance || ledgerNode.opening_balance || ledgerNode['Opening Balance']),
                address: getStr(ledgerNode.ADDRESS || ledgerNode.address || ledgerNode.Address),
                gstin: getStr(ledgerNode.PARTYGSTIN || ledgerNode.gstin || ledgerNode.GSTIN || ledgerNode['GSTIN/UIN']),
                contactNo: getStr(ledgerNode.LEDSTATENAME || ledgerNode.contactNo || ledgerNode['Contact No'] || ledgerNode.Contact)
             };
          }
`;

const lines = content.split('\n');
let startIndex = lines.findIndex(l => l.includes("const mappedData = data.map((item: any) => {"));
let endIndex = lines.findIndex((l, i) => i > startIndex && l.includes("} else if (type === 'vouchers') {"));

if (startIndex !== -1 && endIndex !== -1) {
    lines.splice(startIndex, endIndex - startIndex, mappingBlock.trim() + '\n       ');
    fs.writeFileSync('src/pages/ImportExport.tsx', lines.join('\n'));
} else {
    console.error("Mapping block not found");
}

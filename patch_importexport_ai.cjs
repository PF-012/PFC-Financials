const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

// Update signature of processFileContent
content = content.replace(
  /const processFileContent = async \(file: File, type: 'ledgers' \| 'vouchers'\) => \{/,
  "const processFileContent = async (file: File, type: 'ledgers' | 'vouchers', useAI: boolean = false) => {"
);

// Add the useAIAssist state variable and checkbox in the UI
content = content.replace(
  /const \[bulkProgress, setBulkProgress\] = useState\(\{ total: 0, current: 0, success: 0, failed: 0 \}\);/,
  "const [bulkProgress, setBulkProgress] = useState({ total: 0, current: 0, success: 0, failed: 0 });\n  const [useAIAssist, setUseAIAssist] = useState(true);"
);

// Update calls to processFileContent to pass useAIAssist
content = content.replace(
  /const count = await processFileContent\(file, type\);/,
  "const count = await processFileContent(file, type, useAIAssist);"
);
content = content.replace(
  /const count = await processFileContent\(file, 'ledgers'\);/,
  "const count = await processFileContent(file, 'ledgers', false);"
);
content = content.replace(
  /const count = await processFileContent\(file, 'vouchers'\);/,
  "const count = await processFileContent(file, 'vouchers', useAIAssist);"
);

const mappingLogic = `
    let mappedData: any[] = [];
    
    if (type === 'vouchers' && useAI) {
      // Chunking array to avoid hitting payload/token limits
      const chunks = [];
      for(let i=0; i<data.length; i+=50) chunks.push(data.slice(i, i+50));
      
      for(const chunk of chunks) {
         const res = await fetch('/api/map-imported-vouchers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ rawData: chunk })
         });
         if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.error || 'AI Mapping failed');
         }
         const resData = await res.json();
         mappedData.push(...resData.mappedVouchers);
      }
    } else {
      mappedData = data.map((item: any) => {
       if (type === 'ledgers') {
          const ledgerNode = item.LEDGER || item;
          const nameList = ledgerNode['NAME.LIST'] ? ledgerNode['NAME.LIST'].NAME : undefined;
          const name = getStr(getField(ledgerNode, ['NAME', 'name', 'Name', 'Ledger Name', 'Party Name']) || nameList);
          const group = getStr(getField(ledgerNode, ['PARENT', 'group', 'Group', 'Under Group', 'Account Group']));
          if (name || group) {
             if (!name || name.trim() === '') return null;

             let refinedGroup = group || 'Capital Account';
             const lowerName = name.toLowerCase();
             const lowerGroup = refinedGroup.toLowerCase();
             let isTax = lowerName.includes('gst') || lowerName.includes('tax') || lowerName.includes('duty') || lowerName.includes('cess') || lowerName.includes('tds');
             if (lowerName.includes('purchase') || lowerName.includes('sale')) {
                 if (lowerName.includes('purchase')) refinedGroup = 'Purchase Accounts';
                 if (lowerName.includes('sale')) refinedGroup = 'Sales Accounts';
             } else if (isTax) {
                 refinedGroup = 'Duties & Taxes';
             }

             return {
                name: name,
                group: refinedGroup,
                openingBalance: getNum(ledgerNode.OPENINGBALANCE || ledgerNode.openingBalance || ledgerNode['Opening Balance']),
                address: getStr(ledgerNode.ADDRESS || ledgerNode.address || ledgerNode.Address),
                gstin: getStr(ledgerNode.PARTYGSTIN || ledgerNode.gstin || ledgerNode.GSTIN || ledgerNode['GSTIN/UIN']),
                contactNo: getStr(ledgerNode.LEDSTATENAME || ledgerNode.contactNo || ledgerNode['Contact No'] || ledgerNode.Contact)
             };
          }
       } else if (type === 'vouchers') {
          const voucherNode = item.VOUCHER || item;
          const vType = getStr(getField(voucherNode, ['VOUCHERTYPENAME', 'type', 'Type', 'Voucher Type']));
          const vDate = getStr(getField(voucherNode, ['DATE', 'date', 'Date', 'Voucher Date']));
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
             
             let totalAmt = getNum(getField(voucherNode, ['AMOUNT', 'totalAmount', 'amount', 'Amount', 'Total Amount']));
             let cgstAmt = getNum(getField(voucherNode, ['cgstAmount', 'CGST', 'CGST Amount']));
             let sgstAmt = getNum(getField(voucherNode, ['sgstAmount', 'SGST', 'SGST Amount']));
             let igstAmt = getNum(getField(voucherNode, ['igstAmount', 'IGST', 'IGST Amount']));
             let tdsAmt = getNum(getField(voucherNode, ['tdsAmount', 'TDS', 'TDS Amount']));
             
             let partyId = getStr(getField(voucherNode, ['PARTYLEDGERNAME', 'partyName', 'partyId', 'Party Name', 'Party', 'Paid To', 'Received From', 'Supplier Ac', 'Customer Ac']), 'Unknown');
             let accountId = getStr(getField(voucherNode, ['accountId', 'Account', 'Account Name', 'Paid From', 'Received In', 'Deposit To', 'Sales Account', 'Purchase Account', 'Debit Ac']));
             
             if (voucherNode['ALLLEDGERENTRIES.LIST']) {
                 const entries = Array.isArray(voucherNode['ALLLEDGERENTRIES.LIST']) ? voucherNode['ALLLEDGERENTRIES.LIST'] : [voucherNode['ALLLEDGERENTRIES.LIST']];
                 
                 if (partyId === 'Unknown') {
                     const drEntries = entries.filter((e: any) => getStr(e.ISDEEMEDPOSITIVE) === 'Yes');
                     const crEntries = entries.filter((e: any) => getStr(e.ISDEEMEDPOSITIVE) === 'No');
                     
                     if (vType === 'Receipt' || vType === 'Sales') {
                        if (crEntries.length > 0) partyId = getStr(crEntries[0].LEDGERNAME || 'Unknown');
                        if (drEntries.length > 0 && !accountId) accountId = getStr(drEntries[0].LEDGERNAME || '');
                     } else if (vType === 'Payment' || vType === 'Purchase') {
                        if (drEntries.length > 0) partyId = getStr(drEntries[0].LEDGERNAME || 'Unknown');
                        if (crEntries.length > 0 && !accountId) accountId = getStr(crEntries[0].LEDGERNAME || '');
                     } else {
                        if (drEntries.length > 0) partyId = getStr(drEntries[0].LEDGERNAME || 'Unknown');
                        if (crEntries.length > 0 && !accountId) accountId = getStr(crEntries[0].LEDGERNAME || '');
                     }
                 }

                 entries.forEach((entry: any) => {
                     const lName = getStr(entry.LEDGERNAME || '');
                     const lNameLower = String(lName || '').toLowerCase();
                     const amt = Math.abs(getNum(entry.AMOUNT));
                     
                     if (lName === partyId) {
                         if (!totalAmt) totalAmt = amt;
                     } else if (lNameLower.includes('cgst')) {
                         cgstAmt += amt;
                     } else if (lNameLower.includes('sgst')) {
                         sgstAmt += amt;
                     } else if (lNameLower.includes('igst')) {
                         igstAmt += amt;
                     } else if (lNameLower.includes('tds')) {
                         tdsAmt += amt;
                     } else if (lNameLower.includes('sale') || lNameLower.includes('purchase')) {
                         if (!accountId && lName !== partyId) accountId = lName;
                     }
                 });
             }
             
             return {
                type: vType || 'Journal',
                date: parsedDate,
                number: getStr(voucherNode.VOUCHERNUMBER || voucherNode.number || voucherNode['Voucher No.'] || voucherNode.Number || voucherNode.Ref),
                partyId: partyId,
                accountId: accountId,
                totalAmount: totalAmt,
                cgstAmount: cgstAmt,
                sgstAmount: sgstAmt,
                igstAmount: igstAmt,
                tdsAmount: tdsAmt,
                itemName: getStr(voucherNode.itemName || voucherNode.Item || voucherNode['Item Name']),
                narration: getStr(voucherNode.NARRATION || voucherNode.narration || voucherNode.Narration)
             };
          }
       }
       
       return item;
      }).filter((item: any) => item && Object.keys(item).length > 0);
    }
`;

content = content.replace(
  /\/\/ Map fields \(universal mapping for Tally XML, JSON, CSV, XLSX\)[\s\S]*?\}\)\.filter\(\(item: any\) => item && Object\.keys\(item\)\.length > 0\);/,
  mappingLogic.trim()
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);

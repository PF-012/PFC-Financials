const fs = require('fs');
let code = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

// Find the start and end of processFileContent
const startStr = "const processFileContent = async (file: File, type: 'ledgers' | 'vouchers', useAI: boolean = false) => {";
const endStr = "    return addedCount;\n  };";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex) + endStr.length;

if (startIndex === -1 || endIndex < endStr.length) {
    console.error("Could not find processFileContent bounds");
    process.exit(1);
}

const correctProcessFileContent = `const processFileContent = async (file: File, type: 'ledgers' | 'vouchers', useAI: boolean = false) => {
    let data: any[] = [];
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'csv') {
       const text = await file.text();
       const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
       data = parsed.data;
    } else if (ext === 'xlsx' || ext === 'xls') {
       const arrayBuffer = await file.arrayBuffer();
       const workbook = XLSX.read(arrayBuffer, { type: 'array' });
       const sheetName = workbook.SheetNames[0];
       const worksheet = workbook.Sheets[sheetName];
       data = XLSX.utils.sheet_to_json(worksheet);
    } else {
       const text = await file.text();
       if (ext === 'xml') {
        const parsed = xml2js(text, { compact: true, nativeType: true }) as any;
        const unwrapped = unwrapXml(parsed);
        
        let items = null;
        if (unwrapped[type] && unwrapped[type].item) {
          items = unwrapped[type].item;
        } else if (unwrapped[type] && unwrapped[type][type.slice(0, -1)]) {
          items = unwrapped[type][type.slice(0, -1)];
        } else if (unwrapped.ENVELOPE && unwrapped.ENVELOPE.BODY && unwrapped.ENVELOPE.BODY.DATA && unwrapped.ENVELOPE.BODY.DATA.TALLYMESSAGE) {
          items = unwrapped.ENVELOPE.BODY.DATA.TALLYMESSAGE;
        } else if (unwrapped.ENVELOPE && unwrapped.ENVELOPE.BODY && unwrapped.ENVELOPE.BODY.IMPORTDATA && unwrapped.ENVELOPE.BODY.IMPORTDATA.REQUESTDATA && unwrapped.ENVELOPE.BODY.IMPORTDATA.REQUESTDATA.TALLYMESSAGE) {
          items = unwrapped.ENVELOPE.BODY.IMPORTDATA.REQUESTDATA.TALLYMESSAGE;
        } else {
          // Find first array in the object
          const findArray = (obj: any): any => {
            if (Array.isArray(obj)) return obj;
            if (obj && typeof obj === 'object') {
              for (const key of Object.keys(obj)) {
                if (Array.isArray(obj[key])) return obj[key];
              }
              for (const key of Object.keys(obj)) {
                const res = findArray(obj[key]);
                if (res) return res;
              }
            }
            return null;
          };
          items = findArray(unwrapped);
          
          // if still no items, but unwrapped[type] exists as a single object
          if (!items && unwrapped[type]) {
            items = unwrapped[type];
            // remove namespaces if any
            Object.keys(items).forEach(k => {
              if (k.startsWith('_')) delete items[k];
            });
          }
        }
        if (!items) {
          throw new Error(\`Invalid XML format in \${file.name}. Could not find items to import.\`);
        }
        data = Array.isArray(items) ? items : [items];
      } else {
        const parsed = JSON.parse(text);
        let rawData = [];
        if (Array.isArray(parsed)) {
          rawData = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed[type])) {
            rawData = parsed[type];
          } else if (Array.isArray(parsed.data)) {
            rawData = parsed.data;
          } else if (Array.isArray(parsed.items)) {
            rawData = parsed.items;
          } else {
            const arr = Object.values(parsed).find((v: any) => Array.isArray(v));
            if (arr) {
              rawData = arr as any[];
            } else {
              rawData = [parsed];
            }
          }
        } else {
          throw new Error(\`Invalid JSON format in \${file.name}. Expected an array or object.\`);
        }
        data = rawData;
      }
    }

    let mappedData: any[] = [];
    
    if (useAI) {
      const chunks = [];
      const chunkSize = type === 'vouchers' ? 15 : 30;
      for(let i=0; i<data.length; i+=chunkSize) chunks.push(data.slice(i, i+chunkSize));
      
      const endpoint = type === 'vouchers' ? '/api/map-imported-vouchers' : '/api/map-imported-ledgers';
      
      for(const chunk of chunks) {
         const res = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ rawData: chunk })
         });
         if (!res.ok) {
           let errData;
           try { errData = await res.json(); } catch(e) { throw new Error('AI Mapping failed: Server returned an invalid response (status ' + res.status + ')'); }
           throw new Error(errData.error || 'AI Mapping failed');
         }
         const resData = await res.json();
         if (type === 'vouchers') {
             mappedData.push(...resData.mappedVouchers);
         } else {
             mappedData.push(...resData.mappedLedgers);
         }
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
          const vType = getStr(voucherNode.VOUCHERTYPENAME || voucherNode.type || voucherNode.Type);
          const date = getStr(voucherNode.DATE || voucherNode.date || voucherNode.Date);
          const number = getStr(voucherNode.VOUCHERNUMBER || voucherNode.number || voucherNode.Number);
          const partyName = getStr(voucherNode.PARTYLEDGERNAME || voucherNode.partyName || voucherNode.PartyLedgerName || voucherNode['Party Ledger Name']);
          const accountName = getStr(voucherNode.ledgerName || voucherNode.accountName);
          const amount = getNum(voucherNode.AMOUNT || voucherNode.amount || voucherNode.Amount);
          return {
             type: vType,
             date,
             number,
             partyName,
             accountName,
             amount,
             partyId: item.partyId || partyName,
             accountId: item.accountId || accountName
          };
       }
       return null;
      }).filter(Boolean);
    }

    const ledgersSnap = await getDocs(query(collection(db, 'ledgers'), where('companyId', '==', activeCompany.id)));
    const existingLedgers = ledgersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const batch = writeBatch(db);
    let addedCount = 0;

    mappedData.forEach(item => {
      if (type === 'ledgers') {
         // Prevent duplicates
         const isDuplicate = existingLedgers.find(l => String(l.name || '').toLowerCase() === String(item.name || '').toLowerCase());
         if (isDuplicate) return;

         const newId = item.id || doc(collection(db, 'ledgers')).id;
         item.id = newId;
         existingLedgers.push(item);
      } else if (type === 'vouchers') {
         // Resolve partyId and accountId robustly to avoid UUID names
         const resolveLedger = (nameVal: any, idVal: any, defaultGroup: string) => {
             if (nameVal && typeof nameVal === 'string') {
                 let ledger = existingLedgers.find(l => String(l.name || '').toLowerCase() === nameVal.toLowerCase());
                 if (ledger) return ledger.id;
             }
             if (idVal && typeof idVal === 'string') {
                 let ledger = existingLedgers.find(l => l.id === idVal);
                 if (ledger) return ledger.id;
             }
             if (idVal && typeof idVal === 'string') {
                 let ledger = existingLedgers.find(l => String(l.name || '').toLowerCase() === idVal.toLowerCase());
                 if (ledger) return ledger.id;
             }
             const strToUse = nameVal || idVal;
             if (strToUse && typeof strToUse === 'string') {
                 const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                 const finalName = (!uuidRegex.test(strToUse)) ? strToUse : (nameVal || 'Unknown Ledger');
                 
                 const newLedgerRef = doc(collection(db, 'ledgers'));
                 const newLedger = { name: finalName, group: defaultGroup, companyId: activeCompany.id, userId: user.id };
                 batch.set(newLedgerRef, newLedger);
                 const ledger = { id: newLedgerRef.id, ...newLedger };
                 existingLedgers.push(ledger);
                 return ledger.id;
             }
             return idVal;
         };

         item.partyId = resolveLedger(item.partyName, item.partyId, 'Sundry Debtors');
         item.accountId = resolveLedger(item.accountName, item.accountId, 'Sales Accounts');
      }
      
      delete item.partyName; delete item.accountName; delete item.createdAt; delete item.updatedAt; delete item.importedAt;
      const docRef = item.id ? doc(db, type, item.id) : doc(collection(db, type));
      batch.set(docRef, {
        ...item,
        companyId: activeCompany.id,
        userId: user.id,
      });
      addedCount++;
    });

    await batch.commit();
    return addedCount;
  };`;

code = code.substring(0, startIndex) + correctProcessFileContent + code.substring(endIndex);
fs.writeFileSync('src/pages/ImportExport.tsx', code);
console.log("Successfully rebuilt processFileContent!");

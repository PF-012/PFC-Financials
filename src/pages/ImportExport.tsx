import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Download, Upload, Loader2, FileJson, FileCode, Trash2, UploadCloud, FileScan } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ConfirmModal from '../components/ConfirmModal';
import { js2xml, xml2js } from 'xml-js';



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

const getStr = (val: any, defaultVal = ''): string => {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val._text !== undefined) return getStr(val._text, defaultVal);
    if (Array.isArray(val)) {
      if (val.length === 0) return defaultVal;
      if (val.length === 1) return getStr(val[0], defaultVal);
      return val.map(v => getStr(v, '')).filter(Boolean).join(', ');
    }
    return defaultVal;
  }
  return defaultVal;
};

const getNum = (val: any): number => {
  const str = getStr(val, '0');
  let cleaned = str.replace(/,/g, '');
  let isCr = cleaned.toUpperCase().includes('CR');
  cleaned = cleaned.replace(/[^\d.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return 0;
  let num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (isCr && num > 0) return -num;
  return num;
};

const unwrapXml = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(unwrapXml);
  if (obj !== null && typeof obj === 'object') {
    if (Object.keys(obj).length === 1 && obj._text !== undefined) {
      return obj._text;
    }
    const newObj: any = {};
    for (const key in obj) {
      if (key === '_attributes') {
        // Flatten attributes into the current object level
        const attrs = unwrapXml(obj[key]);
        for (const attrKey in attrs) {
          newObj[attrKey] = attrs[attrKey];
        }
      } else {
        newObj[key] = unwrapXml(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

export default function ImportExport() {
  const { activeCompany } = useAppContext();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<'ledgers' | 'vouchers' | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ total: 0, current: 0, success: 0, failed: 0 });
  const [useAIAssist, setUseAIAssist] = useState(true);


  if (!activeCompany || !user) return null;

  const handleDeleteAll = async (type: 'ledgers' | 'vouchers') => {
    if (!activeCompany || !user) return;
    if (activeCompany.isBanned && user.email !== 'mndl.yuvi@gmail.com') {
      alert("Your account has been banned. Please contact support.");
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const q = query(collection(db, type), where('companyId', '==', activeCompany.id), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
         batch.delete(d.ref);
      });
      await batch.commit();
      
      setMessage(`Successfully deleted all ${type}.`);
    } catch (error: any) {
      console.error(error);
      setMessage(`Error deleting ${type}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (type: 'ledgers' | 'vouchers', format: 'json' | 'xml') => {
    setLoading(true);
    setMessage('');
    try {
      const q = query(
        collection(db, type),
        where('companyId', '==', activeCompany.id),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => {
        const item = doc.data();
        const { companyId, userId, ...rest } = item;
        return rest;
      });

      let outputStr = '';
      let mimeType = '';
      let ext = '';
      
      if (format === 'json') {
        outputStr = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        ext = 'json';
      } else {
        const xmlObj = { [type]: { item: data } };
        outputStr = js2xml(xmlObj, { compact: true, spaces: 2 });
        mimeType = 'application/xml';
        ext = 'xml';
      }

      const blob = new Blob([outputStr], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeCompany.name}_${type}_${new Date().toISOString().split('T')[0]}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage(`Successfully exported ${data.length} ${type} as ${format.toUpperCase()}.`);
    } catch (error: any) {
      console.error(error);
      setMessage(`Error exporting ${type}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

const processFileContent = async (file: File, type: 'ledgers' | 'vouchers', useAI: boolean = false) => {
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
          throw new Error(`Invalid XML format in ${file.name}. Could not find items to import.`);
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
          throw new Error(`Invalid JSON format in ${file.name}. Expected an array or object.`);
        }
        data = rawData;
      }
    }
    
let mappedData: any[] = [];
    
    if (type === 'vouchers' && useAI) {
      // Chunking array to avoid hitting payload/token limits
      const chunks = [];
      for(let i=0; i<data.length; i+=15) chunks.push(data.slice(i, i+15));
      
      for(const chunk of chunks) {
         const res = await fetch('/api/map-imported-vouchers', {
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
                 parsedDate = `${parsedDate.substring(0,4)}-${parsedDate.substring(4,6)}-${parsedDate.substring(6,8)}`;
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

    
    const batch = writeBatch(db);
    
    // Fetch all existing ledgers for deduplication and voucher resolution
    const snap = await getDocs(query(collection(db, 'ledgers'), where('companyId', '==', activeCompany.id)));
    const existingLedgers = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    
    let addedCount = 0;
    mappedData.forEach((item: any) => {
      if (type === 'ledgers') {
         const exists = existingLedgers.find(l => String(l.name || '').toLowerCase() === String(item.name || '').toLowerCase());
         if (exists) return; // Skip duplicate ledger
         
         const newId = doc(collection(db, 'ledgers')).id;
         item.id = newId;
         existingLedgers.push(item); // Add to local list to prevent duplicates within the file itself
         
         const docRef = doc(db, 'ledgers', newId);
         batch.set(docRef, {
           ...item,
           companyId: activeCompany.id,
           userId: user.uid,
           importedAt: new Date().toISOString()
         });
         addedCount++;
         return; // We handled it here
      } else if (type === 'vouchers') {
         // Resolve partyId and accountId from string names to ledger IDs
         if (item.partyId && typeof item.partyId === 'string') {
             let ledger = existingLedgers.find(l => String(l.name || '').toLowerCase() === item.partyId.toLowerCase());
             if (!ledger) {
                 // Auto-create missing ledger
                 const newLedgerRef = doc(collection(db, 'ledgers'));
                 const newLedger = { name: item.partyId, group: 'Sundry Debtors', companyId: activeCompany.id, userId: user.uid };
                 batch.set(newLedgerRef, newLedger);
                 ledger = { id: newLedgerRef.id, ...newLedger };
                 existingLedgers.push(ledger);
             }
             item.partyId = ledger.id;
         }
         if (item.accountId && typeof item.accountId === 'string') {
             let ledger = existingLedgers.find(l => String(l.name || '').toLowerCase() === item.accountId.toLowerCase());
             if (!ledger) {
                 // Auto-create missing ledger
                 const newLedgerRef = doc(collection(db, 'ledgers'));
                 const newLedger = { name: item.accountId, group: 'Sales Accounts', companyId: activeCompany.id, userId: user.uid };
                 batch.set(newLedgerRef, newLedger);
                 ledger = { id: newLedgerRef.id, ...newLedger };
                 existingLedgers.push(ledger);
             }
             item.accountId = ledger.id;
         }
      }
      
      const docRef = doc(collection(db, type));
      batch.set(docRef, {
        ...item,
        companyId: activeCompany.id,
        userId: user.uid,
        importedAt: new Date().toISOString()
      });
      addedCount++;
    });

    await batch.commit();
    return addedCount;
  };

  
  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>, type: 'ledgers' | 'vouchers') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (activeCompany.isBanned && user.email !== 'mndl.yuvi@gmail.com') {
      alert("Your account has been banned. Please contact support.");
      if (e.target) e.target.value = '';
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const count = await processFileContent(file, type, useAIAssist);
      setMessage(`Successfully imported ${count} ${type}.`);
    } catch (error: any) {
      console.error(error);
      setMessage(`Error importing ${type}: ${error.message}`);
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  
  const handleBulkUploadBills = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user || !activeCompany) return;
    
    if (activeCompany.isBanned && user.email !== 'mndl.yuvi@gmail.com') {
      alert("Your account has been banned. Please contact support.");
      if (e.target) e.target.value = '';
      return;
    }
    
    setBulkUploading(true);
    setBulkProgress({ total: files.length, current: 0, success: 0, failed: 0 });
    
    try {
      // Pre-fetch ledgers to match or create
      const ledgersSnap = await getDocs(query(collection(db, 'ledgers'), where('companyId', '==', activeCompany.id)));
      const ledgers = ledgersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      
      let newLedgersCount = 0;
      let newVouchersCount = 0;
      let failedCount = 0;

      for (let i = 0; i < files.length; i++) {
         const file = files[i];
         try {
            const base64Data = await new Promise((resolve, reject) => {
               const reader = new FileReader();
               reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
               reader.onerror = reject;
               reader.readAsDataURL(file);
            });
            
            const res = await fetch('/api/parse-invoice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileBase64: base64Data, mimeType: file.type })
            });
            
            if (!res.ok) {
               let errMsg = 'Failed to parse bill ' + file.name;
               try { const errData = await res.json(); errMsg = errData.error || errMsg; } catch(e) {}
               throw new Error(errMsg);
            }
            let data;
            try { data = await res.json(); } catch(e) { throw new Error('Invalid JSON response from server'); }
            const parsed = data.invoice;
            
            let foundPartyId = '';
            if (parsed.partyName) {
               const existing = ledgers.find(l => String(l.name || '').toLowerCase() === String(parsed.partyName || '').toLowerCase());
               if (existing) {
                 foundPartyId = existing.id;
               } else {
                 const newLedgerRef = doc(collection(db, 'ledgers'));
                 const newLedger = {
                    name: parsed.partyName,
                    group: parsed.partyGroup || 'Sundry Creditors',
                    userId: user.uid,
                    companyId: activeCompany.id,
                    openingBalance: 0
                 };
                 await writeBatch(db).set(newLedgerRef, newLedger).commit();
                 ledgers.push({ id: newLedgerRef.id, ...newLedger });
                 foundPartyId = newLedgerRef.id;
                 newLedgersCount++;
               }
            }
            
            let foundAccountId = '';
            if (parsed.type === 'Purchase') {
               foundAccountId = ledgers.find(l => l.group === 'Purchase Accounts')?.id || '';
            } else if (parsed.type === 'Sales') {
               foundAccountId = ledgers.find(l => l.group === 'Sales Accounts')?.id || '';
            } else if (parsed.type === 'Payment' || parsed.type === 'Receipt') {
               const isBank = parsed.paymentMode && ['UPI', 'Card', 'Bank'].includes(parsed.paymentMode);
               if (isBank) {
                   foundAccountId = ledgers.find(l => l.group === 'Bank Accounts')?.id || '';
               }
               if (!foundAccountId) {
                   foundAccountId = ledgers.find(l => ['Bank Accounts', 'Cash-in-Hand'].includes(l.group))?.id || '';
               }
            }
            
            const newVoucherRef = doc(collection(db, 'vouchers'));
            await writeBatch(db).set(newVoucherRef, {
               type: parsed.type || 'Purchase',
               date: parsed.date || new Date().toISOString().split('T')[0],
               number: parsed.number || '',
               partyId: foundPartyId,
               accountId: foundAccountId,
               totalAmount: parsed.totalAmount || 0,
               cgstAmount: parsed.cgstAmount || 0,
               sgstAmount: parsed.sgstAmount || 0,
               igstAmount: parsed.igstAmount || 0,
               itemName: parsed.itemName || '',
               narration: 'Auto-imported from ' + file.name,
               companyId: activeCompany.id,
               userId: user.uid,
               createdAt: new Date().toISOString()
            }).commit();
            
            newVouchersCount++;
            setBulkProgress(p => ({ ...p, current: i + 1, success: p.success + 1 }));
         } catch (err: any) {
            console.error(err);
            failedCount++;
            setBulkProgress(p => ({ ...p, current: i + 1, failed: p.failed + 1 }));
         }
      }
      
      setMessage(`Successfully auto-created ${newVouchersCount} vouchers and ${newLedgersCount} new ledgers. ${failedCount > 0 ? failedCount + ' failed.' : ''}`);
    } catch (err: any) {
      console.error(err);
      setMessage('Error during bulk import: ' + err.message);
    } finally {
      setBulkUploading(false);
      e.target.value = '';
    }
  };

  const handleImportFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (activeCompany?.isBanned && user?.email !== 'mndl.yuvi@gmail.com') {
      alert("Your account has been banned. Please contact support.");
      if (e.target) e.target.value = '';
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      let totalLedgers = 0;
      let totalVouchers = 0;
      
      // Process files sequentially to avoid overriding state incorrectly
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.match(/\.(json|xml|csv|xlsx|xls)$/i)) {
           continue;
        }
        const name = file.name.toLowerCase();
        
        try {
           if (name.includes('ledger')) {
             const count = await processFileContent(file, 'ledgers', false);
             totalLedgers += count;
           } else if (name.includes('voucher') || name.includes('transaction')) {
             const count = await processFileContent(file, 'vouchers', useAIAssist);
             totalVouchers += count;
           }
        } catch (err: any) {
           console.error(`Failed to process file ${file.name}: `, err);
           // Continuing to next file
        }
      }
      
      setMessage(`Successfully imported ${totalLedgers} ledgers and ${totalVouchers} vouchers from folder.`);
    } catch (error: any) {
      console.error(error);
      setMessage(`Error importing folder: ${error.message}`);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex flex-col gap-1">
         <h1 className="text-2xl font-semibold text-gray-900">Data Management</h1>
         <p className="text-sm text-gray-500">Import and export your financial records in JSON or XML format.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'} border`}>
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
             <Upload className="w-5 h-5 text-gray-400" />
             <h2 className="text-lg font-medium text-gray-900">Import Data</h2>
          </div>
          <div className="space-y-4">
            
            
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50 md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                 <FileScan className="w-4 h-4 text-gray-700" />
                 <h3 className="text-sm font-medium text-gray-900">Bulk Upload Bills/Invoices (Auto Create)</h3>
              </div>
              <p className="text-xs text-gray-500 mb-2">Select multiple images or PDFs. The system will extract details and automatically create ledgers and vouchers.</p>
              
              {bulkUploading ? (
                 <div className="mt-2 space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-600">Processing {bulkProgress.current} of {bulkProgress.total} files... ({bulkProgress.success} succeeded, {bulkProgress.failed} failed)</p>
                 </div>
              ) : (
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleBulkUploadBills}
                  disabled={loading || bulkUploading}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 w-full disabled:opacity-50"
                 />
              )}
            </div>

            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Import Entire Folder</h3>
              <p className="text-xs text-gray-500 mb-2">Select a folder containing "ledgers" and "vouchers" files (.json, .xml, .csv, .xlsx). Files will be automatically detected by name.</p>
              <input 
                type="file" 
                // @ts-ignore
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleImportFolder}
                disabled={loading}
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 w-full disabled:opacity-50" 
              />
            </div>
            
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Chart of Accounts (Ledgers)</h3>
              <p className="text-xs text-gray-500 mb-2">Supports .json, .xml, .csv, and Excel files.</p>
              <input 
                type="file" 
                accept=".json,.xml,.csv,.xlsx,.xls"
                onChange={(e) => handleImportData(e, 'ledgers')}
                disabled={loading}
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 w-full disabled:opacity-50" 
              />
            </div>
            
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Transactions (Vouchers)</h3>
              <p className="text-xs text-gray-500 mb-2">Supports .json, .xml, .csv, and Excel files.</p>
              
              <div className="mb-4 flex items-center">
                <input 
                  type="checkbox" 
                  id="useAIAssist" 
                  checked={useAIAssist}
                  onChange={(e) => setUseAIAssist(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="useAIAssist" className="ml-2 block text-sm text-gray-700">
                  Use Smart AI Import (High Accuracy, slower)
                </label>
              </div>

              <input 
                type="file" 
                accept=".json,.xml,.csv,.xlsx,.xls"
                onChange={(e) => handleImportData(e, 'vouchers')}
                disabled={loading}
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 w-full disabled:opacity-50" 
              />
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
             <Download className="w-5 h-5 text-gray-400" />
             <h2 className="text-lg font-medium text-gray-900">Export Data</h2>
          </div>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50 flex flex-col justify-between">
              <div>
                 <h3 className="text-sm font-medium text-gray-900 mb-2">Chart of Accounts (Ledgers)</h3>
                 <p className="text-xs text-gray-500 mb-4">Export all ledgers for the active company.</p>
              </div>
              <div className="flex gap-2">
                  <button 
                    onClick={() => handleExportData('ledgers', 'json')}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4 text-blue-600" />}
                    JSON
                  </button>
                  <button 
                    onClick={() => handleExportData('ledgers', 'xml')}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4 text-purple-600" />}
                    XML
                  </button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50 flex flex-col justify-between">
              <div>
                 <h3 className="text-sm font-medium text-gray-900 mb-2">Transactions (Vouchers)</h3>
                 <p className="text-xs text-gray-500 mb-4">Export all vouchers for the active company.</p>
              </div>
              <div className="flex gap-2">
                  <button 
                    onClick={() => handleExportData('vouchers', 'json')}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4 text-blue-600" />}
                    JSON
                  </button>
                  <button 
                    onClick={() => handleExportData('vouchers', 'xml')}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4 text-purple-600" />}
                    XML
                  </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
             <Trash2 className="w-5 h-5 text-red-500" />
             <h2 className="text-lg font-medium text-red-600">Delete Data</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-red-100 rounded-md p-4 bg-red-50 flex items-center justify-between">
              <div>
                 <h3 className="text-sm font-medium text-red-900 mb-1">Delete All Ledgers</h3>
                 <p className="text-xs text-red-700">Permanently remove all ledgers for this company.</p>
              </div>
              <button 
                 onClick={() => setDeleteConfirm('ledgers')}
                 disabled={loading}
                 className="flex items-center justify-center gap-2 py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 whitespace-nowrap"
              >
                 <Trash2 className="w-4 h-4" />
                 Delete Ledgers
              </button>
            </div>
            
            <div className="border border-red-100 rounded-md p-4 bg-red-50 flex items-center justify-between">
              <div>
                 <h3 className="text-sm font-medium text-red-900 mb-1">Delete All Vouchers</h3>
                 <p className="text-xs text-red-700">Permanently remove all vouchers for this company.</p>
              </div>
              <button 
                 onClick={() => setDeleteConfirm('vouchers')}
                 disabled={loading}
                 className="flex items-center justify-center gap-2 py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 whitespace-nowrap"
              >
                 <Trash2 className="w-4 h-4" />
                 Delete Vouchers
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title={`Delete All ${deleteConfirm === 'ledgers' ? 'Ledgers' : 'Vouchers'}`}
        message={`Are you ABSOLUTELY sure you want to delete all ${deleteConfirm}? This action cannot be undone.`}
        onConfirm={() => { if (deleteConfirm) handleDeleteAll(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
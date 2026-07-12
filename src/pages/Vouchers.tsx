import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDocs, writeBatch } from '../lib/firebase';
import { db } from '../lib/firebase';
import { formatDate } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import DateInput from '../components/DateInput';
import { Voucher, Ledger } from '../types';
import LedgerFormModal from '../components/LedgerFormModal';
import SearchableSelect from '../components/SearchableSelect';
import VoucherPrintModal from '../components/VoucherPrintModal';
import { Printer, Trash2, Edit2, UploadCloud, Loader2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useLocation } from 'react-router-dom';

export default function Vouchers() {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [uploadingBill, setUploadingBill] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadBill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeCompany) return;

    if (user.email !== 'mndl.yuvi@gmail.com') {
      if (activeCompany.isBanned) {
        alert("Your account has been banned from using premium features. Please contact support.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (vouchers.length >= 1000) {
        if (!activeCompany.license || activeCompany.license.type === 'free') {
          alert("You have reached the free limit of 1000 transactions. Please upgrade to Premium from the top menu to continue.");
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        if (activeCompany.license.type === 'monthly' && activeCompany.license.validUntil && new Date(activeCompany.license.validUntil) < new Date()) {
          alert("Your Premium Monthly plan has expired. Please renew from the top menu to continue.");
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      }
    }

    setUploadingBill(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await fetch('/api/parse-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileBase64: base64Data, mimeType: file.type })
        });
        
        if (!res.ok) throw new Error('Failed to parse bill');
        const data = await res.json();
        const parsed = data.invoice;
        
        // Match or create party ledger
        let foundPartyId = '';
        if (parsed.partyName) {
           const existing = ledgers.find(l => String(l.name || '').toLowerCase() === String(parsed.partyName || '').toLowerCase());
           if (existing) {
             foundPartyId = existing.id;
           } else {
             const newLedgerRef = doc(collection(db, 'ledgers'));
             await setDoc(newLedgerRef, {
                name: parsed.partyName,
                group: parsed.partyGroup || 'Sundry Creditors',
                userId: user.id,
                companyId: activeCompany.id,
                openingBalance: 0
             });
             foundPartyId = newLedgerRef.id;
           }
        }

        // Match accountId based on type
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

        setIsCreating(true);
        setEditingId(null);
        setForm({
           ...initialForm,
           type: parsed.type || 'Purchase',
           date: parsed.date || initialForm.date,
           number: parsed.number || '',
           partyId: foundPartyId,
           accountId: foundAccountId,
           totalAmount: parsed.totalAmount || 0,
           cgstAmount: parsed.cgstAmount || 0,
           sgstAmount: parsed.sgstAmount || 0,
           igstAmount: parsed.igstAmount || 0,
           itemName: parsed.itemName || ''
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading bill', err);
      alert('Failed to parse bill. Please try again.');
    } finally {
      setUploadingBill(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'vouchers', id));
      });
      await batch.commit();
      setSelectedIds([]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAll = async () => {
    if (!activeCompany || !user) return;
    try {
      const q = query(collection(db, 'vouchers'), where('companyId', '==', activeCompany.id), where('userId', '==', user.id));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0) {
      document.getElementById('row-' + selectedIndex)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const { activeCompany, financialYear } = useAppContext();
  const { user } = useAuth();
  const location = useLocation();
  
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<Voucher | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [editLedgerId, setEditLedgerId] = useState<string | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteSelectedConfirm, setDeleteSelectedConfirm] = useState(false);
  const hasSynced = React.useRef(false);





  const [fromDate, setFromDate] = useState(financialYear.start);
  const [toDate, setToDate] = useState(financialYear.end);

      const filteredVouchers = vouchers.filter(v => {
    const party = String(ledgers.find(l => l.id === v.partyId)?.name || v.partyId || '');
    const type = String(v.type || '');
    const number = String(v.number || '');
    const matchesSearch = type.toLowerCase().includes((searchTerm || '').toLowerCase()) || 
           party.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
           number.toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesDate = v.date >= fromDate && v.date <= toDate;
    const matchesType = typeFilter ? v.type === typeFilter : true;
    return matchesSearch && matchesDate && matchesType;
  }).sort((a, b) => {
    const typeOrder = ["Purchase","Sales","Payment","Receipt","Journal","Contra","Credit Note","Debit Note","Sales Order","Purchase Order"];
    const getOrder = (t) => {
      const idx = typeOrder.indexOf(t);
      return idx === -1 ? 999 : idx;
    };
    const typeDiff = getOrder(a.type) - getOrder(b.type);
    if (typeDiff !== 0) return typeDiff;
    
    // Sort by Number numeric ascending
    const numSort = String(a.number || '').localeCompare(String(b.number || ''), undefined, { numeric: true });
    if (numSort !== 0) return numSort;
    
    // Finally sort by Date if numbers are same
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  useEffect(() => {
    setFromDate(financialYear.start);
    setToDate(financialYear.end);
  }, [financialYear]);

  const initialForm = {
    type: 'Sales' as const,
    date: new Date().toISOString().split('T')[0],
    number: '',
    partyId: '',
    accountId: '',
    totalAmount: 0,
    gstAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    tdsAmount: 0,
    narration: '',
    itemName: ''
  };
  const [form, setForm] = useState<any>(initialForm);
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [forceSave, setForceSave] = useState(false);

  useEffect(() => {
     setAiWarning(null);
     setForceSave(false);
  }, [form.type, form.partyId, form.accountId, form.totalAmount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key || '').toLowerCase() === 'n') {
        e.preventDefault();
        setIsCreating(true);
        setEditingId(null);
        setForm(initialForm);
        return;
      }
      if (e.altKey && (e.key || '').toLowerCase() === 's' && isCreating) {
        e.preventDefault();
        handleSubmit({ preventDefault: () => {} });
        return;
      }
      if (e.key === 'Escape' && isCreating) {
        e.preventDefault();
        setIsCreating(false);
        setEditingId(null);
        setForm(initialForm);
        return;
      }
      if (isCreating) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
         if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
             return;
         }
      }

      if (filteredVouchers.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredVouchers.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < filteredVouchers.length) {
          e.preventDefault();
          handleEdit(filteredVouchers[selectedIndex]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredVouchers, selectedIndex, isCreating]);

  useEffect(() => {
    if (isCreating) {
      const totalRate = (form.cgstRate || 0) + (form.sgstRate || 0) + (form.igstRate || 0);
      if (totalRate > 0 && form.totalAmount) {
         const baseAmount = form.totalAmount / (1 + totalRate / 100);
         const newCgstAmt = Number((baseAmount * (form.cgstRate || 0) / 100).toFixed(2));
         const newSgstAmt = Number((baseAmount * (form.sgstRate || 0) / 100).toFixed(2));
         const newIgstAmt = Number((baseAmount * (form.igstRate || 0) / 100).toFixed(2));
         
         if (form.cgstAmount !== newCgstAmt || form.sgstAmount !== newSgstAmt || form.igstAmount !== newIgstAmt) {
             setForm((prev: any) => ({
                 ...prev,
                 cgstAmount: newCgstAmt,
                 sgstAmount: newSgstAmt,
                 igstAmount: newIgstAmt
             }));
         }
      }
    }
  }, [form.totalAmount, form.cgstRate, form.sgstRate, form.igstRate, isCreating]);

  
  useEffect(() => {
    if (location.state?.editVoucher) {
      setForm(location.state.editVoucher);
      setEditingId(location.state.editVoucher.id);
      setIsCreating(true);
      // Clean up state so refresh doesn't trigger again
      window.history.replaceState({}, document.title)
    }
  }, [location]);
  
  useEffect(() => {
    if (!activeCompany || !user) return;
    const vq = query(collection(db, 'vouchers'), where('userId', '==', user.id));
    const unsubV = onSnapshot(vq, snap => setVouchers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voucher)).filter(v => v.companyId === activeCompany.id)));
    
    const lq = query(collection(db, 'ledgers'), where('userId', '==', user.id));
    const unsubL = onSnapshot(lq, snap => setLedgers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ledger)).filter(l => l.companyId === activeCompany.id && String(l.name || '').trim() && l.name !== 'Unknown')));

    return () => { unsubV(); unsubL(); };
  }, [activeCompany, user]);


  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vouchers', id));
      if (editingId === id) {
        setIsCreating(false);
        setEditingId(null);
        setForm(initialForm);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key || '').toLowerCase() === 'd') {
        if (isCreating && editingId) {
          e.preventDefault();
          setDeleteConfirm(editingId);
        } else if (!isCreating) {
          if (selectedIds.length > 0) {
            e.preventDefault();
            setDeleteSelectedConfirm(true);
          } else if (selectedIndex >= 0 && selectedIndex < filteredVouchers.length) {
            e.preventDefault();
            setDeleteConfirm(filteredVouchers[selectedIndex].id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreating, editingId, selectedIds, selectedIndex, filteredVouchers]);


  useEffect(() => {
    if (isCreating && !editingId && activeCompany?.settings?.voucherNumbering !== 'manual') {
      const sameTypeVouchers = vouchers.filter(v => v.type === form.type && v.date >= financialYear.start && v.date <= financialYear.end);
      let maxNum = 0;
      sameTypeVouchers.forEach(v => {
        const match = (v.number || '').match(/\d+$/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        } else {
           const parsed = parseInt(v.number, 10);
           if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed;
        }
      });
      const nextNum = (maxNum + 1).toString();
      if (form.number !== nextNum) {
        setForm(prev => ({ ...prev, number: nextNum }));
      }
    }
  }, [isCreating, editingId, form.type, vouchers]);

  async function handleSubmit(e: React.FormEvent | { preventDefault: () => void }) {
    e.preventDefault();
    if (!activeCompany || !user) return;

    // Premium Check
    if (user.email !== 'mndl.yuvi@gmail.com') {
      if (activeCompany.isBanned) {
        alert("Your account has been banned from using premium features. Please contact support.");
        return;
      }
      if (!editingId && vouchers.length >= 1000) {
        if (!activeCompany.license || activeCompany.license.type === 'free') {
          alert("You have reached the free limit of 1000 transactions. Please upgrade to Premium from the top menu to continue saving new vouchers.");
          return;
        }
        if (activeCompany.license.type === 'monthly' && activeCompany.license.validUntil && new Date(activeCompany.license.validUntil) < new Date()) {
          alert("Your Premium Monthly plan has expired. Please renew from the top menu to continue saving new vouchers.");
          return;
        }
      }
    }

    let submitForm = { ...form };

    if (!forceSave) {
        setIsVerifying(true);
        setAiWarning(null);
        try {
            const partyLedger = ledgers.find(l => l.id === submitForm.partyId);
            const accountLedger = ledgers.find(l => l.id === submitForm.accountId);
            
            const res = await fetch('/api/validate-voucher', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    type: submitForm.type,
                    partyName: partyLedger?.name || '',
                    partyGroup: partyLedger?.group || '',
                    accountName: accountLedger?.name || '',
                    accountGroup: accountLedger?.group || '',
                    amount: submitForm.totalAmount
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.isValid === false && data.reason) {
                    setAiWarning(data.reason);
                    setForceSave(true);
                    setIsVerifying(false);
                    return; // Stop saving, wait for user to click Save Anyway
                }
            }
        } catch (err) {
            console.error('Validation error', err);
        }
        setIsVerifying(false);
    }
    
    setForceSave(false);
    setAiWarning(null);

    try {
      if (!submitForm.number && !editingId && activeCompany?.settings?.voucherNumbering !== 'manual') {
        // Find highest numeric suffix for this type
        const sameTypeVouchers = vouchers.filter(v => v.type === submitForm.type && v.date >= financialYear.start && v.date <= financialYear.end);
        let maxNum = 0;
        sameTypeVouchers.forEach(v => {
          const match = (v.number || '').match(/\d+$/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (num > maxNum) maxNum = num;
          } else {
             // Try to parse the whole string
             const parsed = parseInt(v.number, 10);
             if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed;
          }
        });
        submitForm.number = (maxNum + 1).toString();
      }

      // Bug protection: Prevent duplicate entries with exact same details
      const isDuplicate = vouchers.some(v => 
         v.id !== editingId &&
         v.type === submitForm.type &&
         v.date === submitForm.date &&
         v.partyId === submitForm.partyId &&
         v.accountId === submitForm.accountId &&
         v.totalAmount === submitForm.totalAmount &&
         v.number === submitForm.number
      );
      
      if (isDuplicate) {
         alert("Duplicate Protection: An identical voucher already exists. Cannot save duplicate.");
         return;
      }

      const docRef = editingId ? doc(db, 'vouchers', editingId) : doc(collection(db, 'vouchers'));
      await setDoc(docRef, { ...submitForm, companyId: activeCompany.id, userId: user.id, createdAt: new Date().toISOString() }, { merge: true });
      
      if (!editingId && submitForm.type === 'Sales' && (submitForm.narration || '').includes('Tally')) {
         // Auto-create receipt voucher
         const receiptForm = { ...submitForm, type: 'Receipt' };
         // Generate receipt number
         const receiptVouchers = vouchers.filter(v => v.type === 'Receipt' && v.date >= financialYear.start && v.date <= financialYear.end);
         let maxReceiptNum = 0;
         receiptVouchers.forEach(v => {
            const match = (v.number || '').match(/\d+$/);
            if (match) {
               const num = parseInt(match[0], 10);
               if (num > maxReceiptNum) maxReceiptNum = num;
            } else {
               const parsed = parseInt(v.number, 10);
               if (!isNaN(parsed) && parsed > maxReceiptNum) maxReceiptNum = parsed;
            }
         });
         receiptForm.number = (maxReceiptNum + 1).toString();
         receiptForm.narration = `${submitForm.narration || ''} (Auto Receipt for Sales Voucher No: ${submitForm.number})`;
         const cashLedger = ledgers.find(l => l.group === 'Cash-in-Hand' && l.isSystem) || ledgers.find(l => l.group === 'Cash-in-Hand');
         if (cashLedger) receiptForm.accountId = cashLedger.id;
         else delete receiptForm.accountId;
         
         const receiptDocRef = doc(collection(db, 'vouchers'));
         await setDoc(receiptDocRef, { ...receiptForm, companyId: activeCompany.id, userId: user.id, createdAt: new Date().toISOString() }, { merge: true });
      }
      setIsCreating(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (error) {
      console.error(error);
    }
  };

  
  const handleEdit = (v: Voucher) => {
    setForm(v);
    setEditingId(v.id);
    setIsCreating(true);
  };


  if (isCreating) {
    return (
      <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">{editingId ? 'Edit Voucher' : 'New Voucher'}</h2>
          <button onClick={() => { setIsCreating(false); setEditingId(null); setForm(initialForm); }} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm">
                   <option>Purchase</option>
                   <option>Sales</option>
                   <option>Payment</option>
                   <option>Receipt</option>
                   <option>Journal</option>
                   <option>Contra</option>
                   {activeCompany?.settings?.enableDebitNote && <option>Debit Note</option>}
                   {activeCompany?.settings?.enableCreditNote && <option>Credit Note</option>}
                   {activeCompany?.settings?.enableSalesOrder && <option>Sales Order</option>}
                   {activeCompany?.settings?.enablePurchaseOrder && <option>Purchase Order</option>}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <DateInput required value={form.date} onChange={date => setForm({...form, date})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Ref No. {activeCompany?.settings?.voucherNumbering === 'manual' ? '*' : ''}</label>
                {activeCompany?.settings?.voucherNumbering === 'manual' ? (
                   <input required value={form.number || ''} onChange={e => setForm({...form, number: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="Enter Ref No." />
                ) : (
                   <input readOnly disabled value={form.number || ''} className="mt-1 block w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md shadow-sm text-gray-500 sm:text-sm cursor-not-allowed" placeholder="Auto-generated" />
                )}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-gray-700">
                   {(() => {
                        switch(form.type) {
                           case 'Sales': return 'Customer A/c (Dr.) *';
                           case 'Purchase': return 'Supplier A/c (Cr.) *';
                           case 'Payment': return 'Paid To / Expense A/c (Dr.) *';
                           case 'Receipt': return 'Received From / Income A/c (Cr.) *';
                           case 'Contra': return 'Deposit To (Dr.) *';
                           case 'Journal': return 'Debit A/c (Dr.) *';
                           case 'Debit Note': return 'Supplier A/c (Dr.) *';
                           case 'Credit Note': return 'Customer A/c (Cr.) *';
                           default: return 'Account (Dr.) *';
                        }
                     })()}
                </label>
                <SearchableSelect
                   required
                   value={form.partyId}
                   onChange={val => setForm({...form, partyId: val})}
                   options={ledgers.filter(l => {
                      if (form.type === 'Contra') return ['Cash-in-Hand', 'Bank Accounts'].includes(l.group);
                      return true;
                   })}
                   onEdit={(id) => {
                      const l = ledgers.find(ledger => ledger.id === id);
                      if (l && l.isSystem) return;
                      setEditLedgerId(id);
                      setIsLedgerModalOpen(true);
                   }}
                   placeholder="Select Account"
                />
             </div>
             {['Receipt', 'Payment', 'Contra', 'Journal', 'Purchase', 'Sales'].includes(form.type) && (
               <div>
                  <label className="block text-sm font-medium text-gray-700">
                     {(() => {
                        switch(form.type) {
                           case 'Sales': return 'Sales Account (Cr.) *';
                           case 'Purchase': return 'Purchase Account (Dr.) *';
                           case 'Payment': return 'Paid From / Bank / Cash (Cr.) *';
                           case 'Receipt': return 'Received In / Bank / Cash (Dr.) *';
                           case 'Contra': return 'Withdraw From (Cr.) *';
                           case 'Journal': return 'Credit A/c (Cr.) *';
                           case 'Debit Note': return 'Purchase Return A/c (Cr.) *';
                           case 'Credit Note': return 'Sales Return A/c (Dr.) *';
                           default: return 'Account (Cr.) *';
                        }
                     })()}
                  </label>
                  <SearchableSelect
                     required
                     value={form.accountId || ''}
                     onChange={val => setForm({...form, accountId: val})}
                     options={ledgers.filter(l => {
                        if (form.type === 'Contra') return ['Cash-in-Hand', 'Bank Accounts'].includes(l.group);
                        return true;
                     })}
                     onEdit={(id) => {
                        const l = ledgers.find(ledger => ledger.id === id);
                        if (l && l.isSystem) return;
                        setEditLedgerId(id);
                        setIsLedgerModalOpen(true);
                     }}
                     placeholder="Select Account"
                  />
               </div>
             )}
             <div>
                <label className="block text-sm font-medium text-gray-700">Total Amount *</label>
                <input type="number" step="0.01" required value={form.totalAmount || ''} onChange={e => setForm({...form, totalAmount: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="0.00" />
             </div>
          </div>
          
          {(activeCompany?.settings?.enableGst || activeCompany?.settings?.enableTds) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {activeCompany?.settings?.enableGst && (
              <>
               <div>
                  <label className="block text-sm font-medium text-gray-700">CGST Rate (%)</label>
                  <input type="number" step="0.01" value={form.cgstRate || ''} onChange={e => setForm({...form, cgstRate: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="0" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700">CGST Amount</label>
                  <input type="number" step="0.01" value={form.cgstAmount || ''} onChange={e => setForm({...form, cgstAmount: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="0.00" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700">SGST Rate (%)</label>
                  <input type="number" step="0.01" value={form.sgstRate || ''} onChange={e => setForm({...form, sgstRate: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="0" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700">SGST Amount</label>
                  <input type="number" step="0.01" value={form.sgstAmount || ''} onChange={e => setForm({...form, sgstAmount: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="0.00" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700">IGST Rate (%)</label>
                  <input type="number" step="0.01" value={form.igstRate || ''} onChange={e => setForm({...form, igstRate: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="0" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700">IGST Amount</label>
                  <input type="number" step="0.01" value={form.igstAmount || ''} onChange={e => setForm({...form, igstAmount: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="0.00" />
               </div>
              </>
             )}
             {activeCompany?.settings?.enableTds && (
               <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">TDS Amount</label>
                  <input type="number" step="0.01" value={form.tdsAmount || ''} onChange={e => setForm({...form, tdsAmount: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="0.00" />
               </div>
             )}
            </div>
          )}

          {['Receipt', 'Payment', 'Journal', 'Contra'].includes(form.type) && (
             <div>
                <label className="block text-sm font-medium text-gray-700">Against Ref. No. (Optional)</label>
                <input value={form.againstReference || ''} onChange={e => setForm({...form, againstReference: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="e.g. 1" />
             </div>
          )}
          <div>
             <label className="block text-sm font-medium text-gray-700">Item / Service Name</label>
             <input value={form.itemName || ''} onChange={e => setForm({...form, itemName: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="e.g. Consulting Services" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Narration</label>
             <textarea value={form.narration} onChange={e => setForm({...form, narration: e.target.value})} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"></textarea>
          </div>

                    {aiWarning && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>AI Accounting Warning:</strong> {aiWarning}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            {editingId && (
              <button type="button" onClick={() => setDeleteConfirm(editingId)} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                 Delete (Alt+D)
              </button>
            )}
            <button type="submit" disabled={isVerifying} className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50">
               {isVerifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
               {forceSave ? 'Save Anyway' : 'Save Voucher'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">Vouchers <span className="text-sm font-normal text-gray-500 ml-2">({filteredVouchers.length})</span></h1>
          <div className="flex items-center gap-2 border-l border-gray-300 pl-4 ml-2">
             <label className="text-sm text-gray-600">From:</label>
             <DateInput value={fromDate} onChange={setFromDate} className="w-[100px] px-2 py-1 text-xs border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900" />
             <label className="text-sm text-gray-600 ml-2">To:</label>
             <DateInput value={toDate} onChange={setToDate} className="w-[100px] px-2 py-1 text-xs border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900" />
          </div>
        </div>
        <div className="flex items-center gap-3">
           <input 
             type="file" 
             accept="application/pdf,image/*" 
             className="hidden" 
             ref={fileInputRef} 
             onChange={handleUploadBill} 
           />
           <button 
             onClick={() => fileInputRef.current?.click()} 
             disabled={uploadingBill}
             className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-blue-900 focus:border-blue-900 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
           >
             <UploadCloud className="w-4 h-4" />
             {uploadingBill ? 'Scanning...' : 'Upload Bill'}
           </button>
           <input 
             type="text"
             value={searchTerm} 
             onChange={e => setSearchTerm(e.target.value)} 
             className="block w-32 sm:w-48 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
             placeholder="Search vouchers..." 
           />
           {selectedIds.length > 0 && (
             <button onClick={() => setDeleteSelectedConfirm(true)} className="flex items-center justify-center gap-2 px-4 py-2 border border-red-500 rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none whitespace-nowrap">
               <Trash2 className="w-4 h-4" />
               Delete Selected ({selectedIds.length})
             </button>
           )}
           <button onClick={() => {
              if (filteredVouchers.length > 0 && selectedIds.length === filteredVouchers.length) {
                 setSelectedIds([]);
              } else {
                 setSelectedIds(filteredVouchers.map(v => v.id));
              }
           }} className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none whitespace-nowrap">
             {filteredVouchers.length > 0 && selectedIds.length === filteredVouchers.length ? 'Deselect All' : 'Select All'}
           </button>
           <button onClick={() => setDeleteAllConfirm(true)} className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 whitespace-nowrap">
             <Trash2 className="w-4 h-4" />
             Delete All
           </button>
           <button onClick={() => setIsCreating(true)} className="whitespace-nowrap px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none">
             Record Voucher
           </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                  <tr>
                     
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <select
                           value={typeFilter}
                           onChange={e => setTypeFilter(e.target.value)}
                           className="bg-transparent border-none outline-none focus:ring-0 text-xs font-medium text-gray-500 uppercase p-0 m-0 cursor-pointer w-full text-left"
                        >
                           <option value="">TYPE (ALL)</option>
                           <option value="Purchase">PURCHASE</option>
                           <option value="Sales">SALES</option>
                           <option value="Payment">PAYMENT</option>
                           <option value="Receipt">RECEIPT</option>
                           <option value="Journal">JOURNAL</option>
                           <option value="Contra">CONTRA</option>
                           {activeCompany?.settings?.enableDebitNote && <option value="Debit Note">DEBIT NOTE</option>}
                           {activeCompany?.settings?.enableCreditNote && <option value="Credit Note">CREDIT NOTE</option>}
                           {activeCompany?.settings?.enableSalesOrder && <option value="Sales Order">SALES ORDER</option>}
                           {activeCompany?.settings?.enablePurchaseOrder && <option value="Purchase Order">PURCHASE ORDER</option>}
                        </select>
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref No.</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVouchers.length === 0 ? (
                     <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                           No vouchers found in the selected date range.
                           {vouchers.length > 0 && <div className="mt-2 text-xs text-gray-400">({vouchers.length} total vouchers exist in the company)</div>}
                        </td>
                     </tr>
                  ) : (
                     filteredVouchers.map((v, index) => {
                        const party = String(ledgers.find(l => l.id === v.partyId)?.name || v.partyId || 'Unknown');
                        const prevType = index > 0 ? filteredVouchers[index - 1].type : null;
                        const typeChanged = prevType && prevType !== v.type;
                        return (
                           <tr 
   id={`row-${index}`} 
   key={v.id} 
   className={`cursor-pointer ${selectedIds.includes(v.id) ? 'bg-blue-50' : selectedIndex === index ? 'bg-blue-100' : 'hover:bg-gray-50'} ${typeChanged ? 'border-t-4 border-gray-300' : ''}`} 
   onClick={() => {
      setSelectedIndex(index);
      setSelectedIds(prev => prev.includes(v.id) ? prev.filter(id => id !== v.id) : [...prev, v.id]);
   }} 
   onDoubleClick={() => handleEdit(v)}
>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{formatDate(v.date)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{String(v.type || "")}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-semibold">
                                 {String(v.number || "-")}
                                 {v.againstReference && <span className="block text-gray-500 text-xs font-normal">Against: {String(v.againstReference || "")}</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{party}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                 ₹ {(v.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                 <div className="flex justify-end gap-3">
                                    <button onClick={() => setPrintingVoucher(v)} className="text-gray-500 hover:text-gray-700" title="Print/Download PDF">
                                       <Printer className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(v); }} className="text-blue-600 hover:text-blue-900" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(v.id); }} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                              </td>
                           </tr>
                        )
                     })
                  )}
               </tbody>
            </table>
         </div>
      </div>
      <VoucherPrintModal 
        isOpen={!!printingVoucher} 
        onClose={() => setPrintingVoucher(null)} 
        voucher={printingVoucher} 
        company={activeCompany} 
        party={printingVoucher ? ledgers.find(l => l.id === printingVoucher.partyId) || null : null} 
      />
          <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Voucher"
        message="Are you sure you want to delete this voucher?"
        onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
          <ConfirmModal
        isOpen={deleteAllConfirm}
        title="Delete All Vouchers"
        message="Are you ABSOLUTELY sure you want to delete all vouchers? This action cannot be undone."
        onConfirm={() => { handleDeleteAll(); setDeleteAllConfirm(false); }}
        onCancel={() => setDeleteAllConfirm(false)}
      />
          <ConfirmModal
        isOpen={deleteSelectedConfirm}
        title="Delete Selected Vouchers"
        message={`Are you sure you want to delete ${selectedIds.length} selected vouchers? This action cannot be undone.`}
        onConfirm={() => { handleDeleteSelected(); setDeleteSelectedConfirm(false); }}
        onCancel={() => setDeleteSelectedConfirm(false)}
      />
      <LedgerFormModal 
        isOpen={isLedgerModalOpen}
        onClose={() => { setIsLedgerModalOpen(false); setEditLedgerId(null); }}
        ledgerId={editLedgerId}
      />
    </div>
  );
}

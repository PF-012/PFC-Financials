import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDocs, writeBatch } from '../lib/firebase';
import { db } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Ledger } from '../types';
import { Edit2, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Ledgers() {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (activeCompany?.isBanned && user?.email !== 'mndl.yuvi@gmail.com') {
      alert("Your account has been banned. Please contact support.");
      return;
    }
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'ledgers', id));
      });
      await batch.commit();
      setSelectedIds([]);
    } catch (error: any) { console.error(error); alert(error.message || 'An error occurred while saving.'); }
  };

  const handleDeleteAll = async () => {
    if (!activeCompany || !user) return;
    if (activeCompany.isBanned && user.email !== 'mndl.yuvi@gmail.com') {
      alert("Your account has been banned. Please contact support.");
      return;
    }
    try {
      const q = query(collection(db, 'ledgers'), where('companyId', '==', activeCompany.id), where('userId', '==', user.id));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
         if (!d.data().isSystem) batch.delete(d.ref);
      });
      await batch.commit();
    } catch (error: any) { console.error(error); alert(error.message || 'An error occurred while saving.'); }
  };

  useEffect(() => {
    if (selectedIndex >= 0) {
      document.getElementById('row-' + selectedIndex)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const { activeCompany, ledgers: globalLedgers, vouchers: globalVouchers } = useAppContext();
  const ledgers = globalLedgers.filter(l => l.companyId === activeCompany?.id);
  const vouchers = globalVouchers.filter(v => v.companyId === activeCompany?.id);
  const { user } = useAuth();
  
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteSelectedConfirm, setDeleteSelectedConfirm] = useState(false);

  const initialForm = {
    name: '',
    group: 'Sundry Debtors',
    openingBalance: 0,
    address: '',
    email: '',
    hsnCode: '',
    gstin: '',
    contactNo: '',
    registrationType: 'Regular',
    gstType: 'CGST/SGST',
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0
  };
  const [form, setForm] = useState(initialForm);

  


  const handleDelete = async (id: string) => {
    if (activeCompany?.isBanned && user?.email !== 'mndl.yuvi@gmail.com') {
      alert("Your account has been banned. Please contact support.");
      return;
    }
    const l = ledgers.find(l => l.id === id);
    if (l && l.isSystem) return;
    try {
      await deleteDoc(doc(db, 'ledgers', id));
      if (editingId === id) {
        setIsCreating(false);
        setEditingId(null);
        setForm(initialForm);
      }
    } catch (error: any) { console.error(error); alert(error.message || 'An error occurred while saving.'); }
  };



  const filteredLedgers = React.useMemo(() => ledgers.filter(l => {
    const name = String(l.name || '').trim();
    if (!name || name === 'Unknown') return false;
    return name.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
           String(l.group || '').toLowerCase().includes((searchTerm || '').toLowerCase());
  }), [ledgers, searchTerm]);
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
      if (e.altKey && (e.key || '').toLowerCase() === 'd') {
        if (isCreating && editingId) {
          e.preventDefault();
          setDeleteConfirm(editingId);
        } else if (!isCreating) {
          if (selectedIds && selectedIds.length > 0) {
            e.preventDefault();
            setDeleteSelectedConfirm(true);
          } else if (selectedIndex >= 0 && selectedIndex < filteredLedgers.length) {
            e.preventDefault();
            setDeleteConfirm(filteredLedgers[selectedIndex].id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreating, editingId, selectedIds, selectedIndex, filteredLedgers]);

  async function handleSubmit(e: React.FormEvent | { preventDefault: () => void }) {
    e.preventDefault();
    if (!activeCompany || !user) return;
    try {
      const docRef = editingId ? doc(db, 'ledgers', editingId) : doc(collection(db, 'ledgers'));
      await setDoc(docRef, { ...form, companyId: activeCompany.id, userId: user.id, createdAt: new Date().toISOString() }, { merge: true });
      setIsCreating(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (error: any) { console.error(error); alert(error.message || 'An error occurred while saving.'); }
  };

  const handleEdit = (l: Ledger) => {
    if (l.isSystem) return;
    setForm(l);
    setEditingId(l.id);
    setIsCreating(true);
  };

      const groups = ['Capital Account', 'Current Assets', 'Cash-in-Hand', 'Bank Accounts', 'Direct Expenses', 'Direct Incomes', 'Current Liabilities', 'Fixed Assets', 'Indirect Expenses', 'Indirect Incomes', 'Purchase Accounts', 'Sales Accounts', 'Sundry Creditors', 'Sundry Debtors', 'Duties & Taxes'];



  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCreating) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
         if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
             return;
         }
      }

      if (filteredLedgers.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredLedgers.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < filteredLedgers.length) {
          e.preventDefault();
          handleEdit(filteredLedgers[selectedIndex]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredLedgers, selectedIndex, isCreating]);

  if (isCreating) {
    return (
      <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">{editingId ? 'Edit Ledger' : 'New Ledger'}</h2>
          <button onClick={() => { setIsCreating(false); setEditingId(null); setForm(initialForm); }} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          <div>
             <h3 className="text-base font-medium text-gray-900 mb-4">Basic Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-gray-700">Ledger Name *</label>
                   <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Under Group *</label>
                   <select required value={form.group} onChange={e => setForm({...form, group: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm">
                      {groups.map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Opening Balance</label>
                   <input type="number" step="0.01" value={form.openingBalance || ''} onChange={e => setForm({...form, openingBalance: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="0.00" />
                </div>
             </div>
          </div>

          
          <div className="pt-6 border-t border-gray-200">
             <h3 className="text-base font-medium text-gray-900 mb-4">Mailing Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700">Address</label>
                   <textarea value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Email ID (Gmail)</label>
                   <input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Contact No.</label>
                   <input type="tel" value={form.contactNo || ''} onChange={e => setForm({...form, contactNo: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
                </div>
             </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
             <h3 className="text-base font-medium text-gray-900 mb-4">Statutory Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                   <label className="block text-sm font-medium text-gray-700">HSN/SAC Code</label>
                   <input value={form.hsnCode || ''} onChange={e => setForm({...form, hsnCode: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Registration Type</label>
                   <select value={form.registrationType} onChange={e => setForm({...form, registrationType: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm">
                      <option>Regular</option>
                      <option>Composition</option>
                      <option>Consumer</option>
                      <option>Unregistered</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">GSTIN/UIN</label>
                   <input value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm uppercase" />
                </div>
             </div>
             
             {activeCompany?.settings?.enableGst && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                   <label className="block text-sm font-medium text-gray-700">GST Type</label>
                   <select value={form.gstType} onChange={e => setForm({...form, gstType: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm">
                      <option>CGST/SGST</option>
                      <option>IGST</option>
                      <option>None</option>
                   </select>
                </div>
                {form.gstType === 'CGST/SGST' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">CGST Rate (%)</label>
                      <input type="number" step="0.01" value={form.cgstRate || ''} onChange={e => setForm({...form, cgstRate: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SGST Rate (%)</label>
                      <input type="number" step="0.01" value={form.sgstRate || ''} onChange={e => setForm({...form, sgstRate: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
                    </div>
                  </div>
                ) : form.gstType === 'IGST' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IGST Rate (%)</label>
                    <input type="number" step="0.01" value={form.igstRate || ''} onChange={e => setForm({...form, igstRate: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
                  </div>
                ) : <div />}
              </div>
             )}
          </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            {editingId && (
              <button type="button" onClick={() => setDeleteConfirm(editingId)} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                 Delete
              </button>
            )}
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900">
               Save Ledger
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Ledgers <span className="text-sm font-normal text-gray-500 ml-2">({filteredLedgers.length})</span></h1>
        <div className="flex items-center gap-3">
           <input 
             type="text"
             value={searchTerm} 
             onChange={e => setSearchTerm(e.target.value)} 
             className="block w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
             placeholder="Search ledgers..." 
           />
           {selectedIds.length > 0 && (
             <button onClick={() => setDeleteSelectedConfirm(true)} className="flex items-center justify-center gap-2 px-4 py-2 border border-red-500 rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none whitespace-nowrap">
               <Trash2 className="w-4 h-4" />
               Delete Selected ({selectedIds.length})
             </button>
           )}
           <button onClick={() => {
              const selectable = filteredLedgers.filter(l => !l.isSystem);
              if (selectable.length > 0 && selectedIds.length === selectable.length) {
                 setSelectedIds([]);
              } else {
                 setSelectedIds(selectable.map(l => l.id));
              }
           }} className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none whitespace-nowrap">
             {filteredLedgers.filter(l => !l.isSystem).length > 0 && selectedIds.length === filteredLedgers.filter(l => !l.isSystem).length ? 'Deselect All' : 'Select All'}
           </button>
           <button onClick={() => setDeleteAllConfirm(true)} className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 whitespace-nowrap">
             <Trash2 className="w-4 h-4" />
             Delete All
           </button>
           <button onClick={() => setIsCreating(true)} className="whitespace-nowrap px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none">
             Add Ledger
           </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                  <tr>
                     
                     <th className="px-6 py-3 text-left w-12"><input type="checkbox" className="rounded border-gray-300 text-blue-900 focus:ring-blue-900" checked={filteredLedgers.filter(l => !l.isSystem).length > 0 && selectedIds.length === filteredLedgers.filter(l => !l.isSystem).length} onChange={(e) => {
                           if (e.target.checked) {
                              setSelectedIds(filteredLedgers.filter(l => !l.isSystem).map(l => l.id));
                           } else {
                              setSelectedIds([]);
                           }
                        }} /></th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GSTIN</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLedgers.length === 0 ? (
                     <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                           No ledgers found matching your search.
                           {ledgers.length > 0 && <div className="mt-2 text-xs text-gray-400">({ledgers.length} total ledgers exist in the company)</div>}
                        </td>
                     </tr>
                  ) : (
                     filteredLedgers.map((l, index) => (
                        <tr 
                        key={l.id} 
                        className={`cursor-pointer ${selectedIds.includes(l.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        onClick={() => { if(!l.isSystem) { handleEdit(l); } }}
                     >
                           <td className="px-6 py-4 whitespace-nowrap w-12" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(l.id)} onChange={() => { if(!l.isSystem) setSelectedIds(prev => prev.includes(l.id) ? prev.filter(id => id !== l.id) : [...prev, l.id]) }} className="rounded border-gray-300 text-blue-900 focus:ring-blue-900" disabled={l.isSystem} /></td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {String(l.name || "")}
                              {l.isSystem && <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Default</span>}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(l.gstin || "-")}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(l.group || "")}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              ₹ {Math.abs(Number(l.openingBalance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              <span className="text-gray-500 ml-1 text-xs">{(Number(l.openingBalance) || 0) > 0 ? 'Dr' : (Number(l.openingBalance) || 0) < 0 ? 'Cr' : ''}</span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {!l.isSystem && <div className="flex justify-end gap-3"><button onClick={(e) => { e.stopPropagation(); handleEdit(l); }} className="text-blue-600 hover:text-blue-900" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(l.id); }} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="w-4 h-4" /></button></div>}
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Ledger"
        message="Are you sure you want to delete this ledger?"
        onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
          <ConfirmModal
        isOpen={deleteAllConfirm}
        title="Delete All Ledgers"
        message="Are you ABSOLUTELY sure you want to delete all ledgers? This action cannot be undone."
        onConfirm={() => { handleDeleteAll(); setDeleteAllConfirm(false); }}
        onCancel={() => setDeleteAllConfirm(false)}
      />
          <ConfirmModal
        isOpen={deleteSelectedConfirm}
        title="Delete Selected Ledgers"
        message={`Are you sure you want to delete ${selectedIds.length} selected ledgers? This action cannot be undone.`}
        onConfirm={() => { handleDeleteSelected(); setDeleteSelectedConfirm(false); }}
        onCancel={() => setDeleteSelectedConfirm(false)}
      />
    </div>
  );
}

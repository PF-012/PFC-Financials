import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, collection } from '../lib/firebase';
import { db } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Ledger } from '../types';

interface LedgerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerId?: string | null;
  onSave?: (ledger: Ledger) => void;
}

export default function LedgerFormModal({ isOpen, onClose, ledgerId, onSave }: LedgerFormModalProps) {
  const { activeCompany } = useAppContext();
  const { user } = useAuth();
  
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

  const [form, setForm] = useState<any>(initialForm);
  const [loading, setLoading] = useState(false);

  const groups = ['Capital Account', 'Current Assets', 'Cash-in-Hand', 'Bank Accounts', 'Direct Expenses', 'Direct Incomes', 'Current Liabilities', 'Fixed Assets', 'Indirect Expenses', 'Indirect Incomes', 'Purchase Accounts', 'Sales Accounts', 'Sundry Creditors', 'Sundry Debtors', 'Duties & Taxes'];

  useEffect(() => {
    if (isOpen) {
      if (ledgerId) {
        setLoading(true);
        getDoc(doc(db, 'ledgers', ledgerId)).then(docSnap => {
          if (docSnap.exists()) {
            setForm({ id: docSnap.id, ...docSnap.data() });
          }
          setLoading(false);
        });
      } else {
        setForm(initialForm);
      }
    }
  }, [isOpen, ledgerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !user) return;
    
    if (activeCompany.isBanned && user.email !== 'mndl.yuvi@gmail.com') {
      alert("Your account has been banned. Please contact support.");
      return;
    }
    
    try {
      const docRef = ledgerId ? doc(db, 'ledgers', ledgerId) : doc(collection(db, 'ledgers'));
      const newLedger = { ...form, companyId: activeCompany.id, userId: user.uid, updatedAt: new Date().toISOString() };
      if (!ledgerId) newLedger.createdAt = new Date().toISOString();
      
      await setDoc(docRef, newLedger, { merge: true });
      if (onSave) onSave({ ...newLedger, id: docRef.id } as Ledger);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-lg font-medium text-gray-900">{ledgerId ? 'Edit Ledger' : 'New Ledger'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-medium">&times;</button>
        </div>
        {loading ? (
           <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
        <div className="overflow-y-auto flex-1">
        <form id="ledger-form" onSubmit={handleSubmit} className="p-6 space-y-8">
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
                   <label className="block text-sm font-medium text-gray-700">Email ID</label>
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
                   <input value={form.gstin || ''} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm uppercase" />
                </div>
             </div>
          </div>
        </form>
        </div>
        )}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
           <button onClick={onClose} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900">
              Cancel
           </button>
           <button form="ledger-form" type="submit" className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900">
              Save Ledger
           </button>
        </div>
      </div>
    </div>
  );
}

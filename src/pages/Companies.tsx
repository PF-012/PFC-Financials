import ConfirmModal from '../components/ConfirmModal';
import React, { useState } from 'react';
import { collection, addDoc, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Company } from '../types';

export default function Companies() {
  const { companies, activeCompany, setActiveCompany } = useAppContext();
  const { user } = useAuth();
  
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = {
    name: '',
    address: '',
    gstin: '',
    pan: '',
    email: '',
    phone: '',
    financialYearStart: '2025-04-01',
    booksBeginFrom: '2025-04-01'
  };
  const [form, setForm] = useState(initialForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingId) {
        const docRef = doc(db, 'companies', editingId);
        await setDoc(docRef, { ...form, userId: user.uid, updatedAt: new Date().toISOString() }, { merge: true });
      } else {
        const newCompany = { ...form, userId: user.uid, createdAt: new Date().toISOString() };
        const docRef = await addDoc(collection(db, 'companies'), newCompany);
        setActiveCompany({ id: docRef.id, ...newCompany } as Company);

        const defaultLedgers = [
          { name: 'Cash A/C', group: 'Cash-in-Hand', openingBalance: 0, isSystem: true, companyId: docRef.id, userId: user.uid, createdAt: new Date().toISOString() },
          { name: 'Bank A/C', group: 'Bank Accounts', openingBalance: 0, isSystem: true, companyId: docRef.id, userId: user.uid, createdAt: new Date().toISOString() },
          { name: 'Sales A/C', group: 'Sales Accounts', openingBalance: 0, isSystem: true, companyId: docRef.id, userId: user.uid, createdAt: new Date().toISOString() }
        ];
        const batch = writeBatch(db);
        defaultLedgers.forEach(l => {
          const lRef = doc(collection(db, 'ledgers'));
          batch.set(lRef, l);
        });
        await batch.commit();
      }
      setIsCreating(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (c: Company) => {
    setForm(c);
    setEditingId(c.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'companies', id));
      if (activeCompany?.id === id) {
        setActiveCompany(companies.find(c => c.id !== id) || null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isCreating) {
    return (
      <div className="max-w-3xl mx-auto bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">{editingId ? 'Edit Company' : 'New Company'}</h2>
          <button onClick={() => { setIsCreating(false); setEditingId(null); setForm(initialForm); }} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">GSTIN</label>
                <input value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm uppercase" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">PAN</label>
                <input value={form.pan} onChange={e => setForm({...form, pan: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm uppercase" />
             </div>
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"></textarea>
             </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900">
               Save Company
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Companies</h1>
        <button onClick={() => setIsCreating(true)} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none">
          Add Company
        </button>
      </div>

      {companies.length === 0 ? (
         <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No companies found</h3>
            <p className="mt-2 text-sm text-gray-500">Create a company to get started.</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(c => {
               const isActive = activeCompany?.id === c.id;
               return (
                  <div key={c.id} className={`bg-white rounded-lg border overflow-hidden flex flex-col ${isActive ? 'border-blue-900 shadow-sm ring-1 ring-blue-900' : 'border-gray-200 shadow-sm'}`}>
                     <div className="p-6 flex-1">
                        <div className="mb-4"><h3 className="text-lg font-medium text-gray-900 truncate" title={c.name}>{c.name}</h3></div>
                        <div className="space-y-2 text-sm text-gray-600">
                           {c.gstin && <p>GSTIN: {c.gstin}</p>}
                           {c.email && <p>Email: {c.email}</p>}
                           {c.phone && <p>Phone: {c.phone}</p>}
                        </div>
                     </div>
                     <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        {isActive ? (
                           <span className="text-sm font-medium text-blue-900">Currently Active</span>
                        ) : (
                           <button onClick={() => setActiveCompany(c)} className="text-sm font-medium text-gray-600 hover:text-gray-900 w-full text-left">
                              Select Company
                           </button>
                        )}
                        <div className="flex gap-3">
                           <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="text-gray-500 hover:text-blue-600 text-sm font-medium">Edit</button>
                           <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(c.id); }} className="text-gray-500 hover:text-red-600 text-sm font-medium">Delete</button>
                        </div>
                     </div>
                  </div>
               )
            })}
         </div>
      )}
    
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Company"
        message="Are you sure you want to delete this company? All data associated with it will be lost."
        onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

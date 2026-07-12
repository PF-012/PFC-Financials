import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import DateInput from '../components/DateInput';
import { formatDate } from '../lib/utils';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from '../lib/firebase';
import { BankTransaction, Voucher } from '../types';
import { format } from 'date-fns';
import { Check, X, FileCheck2, Plus } from 'lucide-react';

export default function BankReconciliation() {
  const { activeCompany } = useAppContext();
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [activeTab, setActiveTab] = useState<'Unreconciled' | 'Reconciled'>('Unreconciled');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), desc: '', amt: 0, type: 'Dr' });

  useEffect(() => {
    if (!activeCompany || !user) return;
    const q = query(collection(db, 'bank_transactions'), where('companyId', '==', activeCompany.id), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankTransaction)));
    });
    
    const vq = query(collection(db, 'vouchers'), where('companyId', '==', activeCompany.id), where('userId', '==', user.uid));
    const unsubV = onSnapshot(vq, snap => {
      setVouchers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voucher)));
    });
    return () => { unsub(); unsubV(); };
  }, [activeCompany, user]);

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !user) return;
    
    await addDoc(collection(db, 'bank_transactions'), {
      userId: user.uid,
      companyId: activeCompany.id,
      date: form.date,
      description: form.desc,
      amount: Number(form.amt),
      type: form.type,
      isReconciled: false,
      createdAt: serverTimestamp()
    });
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), desc: '', amt: 0, type: 'Dr' });
    setIsAddingMode(false);
  };

  const toggleReconcile = async (tx: BankTransaction) => {
    await updateDoc(doc(db, 'bank_transactions', tx.id), {
      isReconciled: !tx.isReconciled
    });
  };

  if (!activeCompany) return null;

  const filtered = transactions.filter(t => activeTab === 'Unreconciled' ? !t.isReconciled : t.isReconciled);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Bank Reconciliation</h1>
        <button
          onClick={() => setIsAddingMode(!isAddingMode)}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Statement Row
        </button>
      </div>

      {isAddingMode && (
        <form onSubmit={handleAddTx} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-1 w-full md:w-auto">
            <label className="text-sm font-medium text-gray-700">Date</label>
            <DateInput required value={form.date} onChange={val => setForm({...form, date: val})} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
          </div>
          <div className="space-y-1 flex-1 w-full">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <input required value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" placeholder="NEFT / Cheque No..." />
          </div>
          <div className="space-y-1 w-full md:w-32">
            <label className="text-sm font-medium text-gray-700">Amount</label>
            <input required type="number" step="0.01" value={form.amt} onChange={e=>setForm({...form, amt: Number(e.target.value)})} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm" />
          </div>
          <div className="space-y-1 w-full md:w-24">
            <label className="text-sm font-medium text-gray-700">Dr/Cr</label>
            <select value={form.type} onChange={e=>setForm({...form, type: e.target.value})} className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm">
              <option value="Dr">Dr (Out)</option>
              <option value="Cr">Cr (In)</option>
            </select>
          </div>
          <button type="submit" className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-md font-medium text-sm border border-transparent">
            Add
          </button>
        </form>
      )}

      <div className="flex gap-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('Unreconciled')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Unreconciled' ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Unreconciled ({transactions.filter(t => !t.isReconciled).length})
        </button>
        <button 
          onClick={() => setActiveTab('Reconciled')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Reconciled' ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Reconciled ({transactions.filter(t => t.isReconciled).length})
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
           <table className="min-w-full text-left border-collapse">
             <thead>
               <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                 <th className="px-6 py-3">Date</th>
                 <th className="px-6 py-3">Description</th>
                 <th className="px-6 py-3 text-right">Amount</th>
                 <th className="px-6 py-3 text-center">Type</th>
                 <th className="px-6 py-3 text-center">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-200 bg-white">
               {filtered.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                     <div className="flex flex-col items-center justify-center">
                        <FileCheck2 className="w-8 h-8 text-gray-300 mb-2" />
                        <p>All caught up!</p>
                     </div>
                   </td>
                 </tr>
               ) : (
                 filtered.map(t => (
                   <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{formatDate(t.date)}</td>
                     <td className="px-6 py-4 font-medium text-sm text-gray-900">{String(t.description || "")}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-sm text-gray-900">
                        {t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-center">
                       <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'Dr' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                         {t.type}
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                       {t.isReconciled ? (
                         <button onClick={() => toggleReconcile(t)} className="text-gray-400 hover:text-red-600 flex items-center justify-center gap-1 mx-auto text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-red-50">
                           <X className="w-3 h-3" /> Un-reconcile
                         </button>
                       ) : (
                         <button onClick={() => toggleReconcile(t)} className="text-blue-900 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto text-xs px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100">
                           <Check className="w-3 h-3" /> Reconcile
                         </button>
                       )}
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

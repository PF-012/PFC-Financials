import React, { useState, useEffect } from 'react';
import { doc, deleteDoc, collection, query, where, onSnapshot, getDocs, writeBatch } from '../lib/firebase';
import { db } from '../lib/firebase';
import { formatDate } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import DateInput from '../components/DateInput';
import { Voucher, Ledger } from '../types';
import { Printer, Edit2, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

export default function DayBook() {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteSelectedConfirm, setDeleteSelectedConfirm] = useState(false);

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (activeCompany?.isBanned && user?.email !== 'mndl.yuvi@gmail.com') {
      alert("Your account has been banned. Please contact support.");
      return;
    }
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
    if (activeCompany.isBanned && user.email !== 'mndl.yuvi@gmail.com') {
      alert("Your account has been banned. Please contact support.");
      return;
    }
    try {
      const q = query(collection(db, 'vouchers'), where('companyId', '==', activeCompany.id), where('userId', '==', user.uid));
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
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [fromDate, setFromDate] = useState(getTodayDate());
  const [toDate, setToDate] = useState(getTodayDate());
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    setFromDate(financialYear.start);
    setToDate(financialYear.end);
  }, [financialYear]);

  useEffect(() => {
    if (!activeCompany || !user) return;

    const ledgersQuery = query(
      collection(db, 'ledgers'),
      where('userId', '==', user.uid)
    );
    const unsubscribeLedgers = onSnapshot(ledgersQuery, (snapshot) => {
      setLedgers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ledger)).filter(l => l.companyId === activeCompany.id));
    });

    return () => unsubscribeLedgers();
  }, [activeCompany, user]);

  useEffect(() => {
    if (!activeCompany || !user) return;

    const q = query(
      collection(db, 'vouchers'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let v = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voucher));
      v = v.filter(voucher => voucher.companyId === activeCompany.id && voucher.date >= fromDate && voucher.date <= toDate && (typeFilter ? voucher.type === typeFilter : true));
      v.sort((a, b) => {
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
      setVouchers(v);
    });

    return () => unsubscribe();
  }, [activeCompany, user, fromDate, toDate, typeFilter]);

  const handleEdit = (v: Voucher) => {
    navigate('/vouchers', { state: { editVoucher: v } });
  };

  const handleDelete = async (id: string) => {
    if (activeCompany?.isBanned && user?.email !== 'mndl.yuvi@gmail.com') {
      alert("Your account has been banned. Please contact support.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'vouchers', id));
    } catch (error) {
      console.error("Error deleting voucher:", error);
    }
  };

  const getDebitCreditAmount = (v: Voucher) => {
    const type = v.type;
    const amount = v.totalAmount || 0;
    
    let isDebit = false;
    let isCredit = false;

    switch(type) {
      case 'Sales':
      case 'Payment':
      // @ts-ignore
      case 'Debit Note':
        isDebit = true;
        break;
      case 'Purchase':
      case 'Receipt':
      // @ts-ignore
      case 'Credit Note':
        isCredit = true;
        break;
      default:
        isDebit = true;
    }

    return {
      debit: isDebit ? amount : null,
      credit: isCredit ? amount : null,
    };
  };





  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
         if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
             return;
         }
      }

      if (vouchers.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < vouchers.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < vouchers.length) {
          e.preventDefault();
          handleEdit(vouchers[selectedIndex]);
        }
      } else if (e.altKey && (e.key || '').toLowerCase() === 'd') {
        if (selectedIds && selectedIds.length > 0) {
          e.preventDefault();
          setDeleteSelectedConfirm(true);
        } else if (selectedIndex >= 0 && selectedIndex < vouchers.length) {
          e.preventDefault();
          setDeleteConfirm(vouchers[selectedIndex].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [vouchers, selectedIndex, selectedIds]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(vouchers.map(v => v.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  let totalDebit = 0;
  let totalCredit = 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-[#1a237e]">Day Book</h1>
          <div className="flex items-center gap-2 sm:border-l sm:border-gray-300 sm:pl-4 sm:ml-2">
             <label className="text-sm text-gray-600 font-medium">From:</label>
             <DateInput value={fromDate} onChange={setFromDate} className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900" />
             <label className="text-sm text-gray-600 font-medium ml-2">To:</label>
             <DateInput value={toDate} onChange={setToDate} className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900" />
          </div>
        </div>
        <div className="flex items-center gap-3">
           {selectedIds.length > 0 && (
             <button onClick={() => setDeleteSelectedConfirm(true)} className="flex items-center justify-center gap-2 px-4 py-2 border border-red-500 rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none whitespace-nowrap">
               <Trash2 className="w-4 h-4" />
               Delete Selected ({selectedIds.length})
             </button>
           )}
           <button onClick={() => setDeleteAllConfirm(true)} className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 whitespace-nowrap">
             <Trash2 className="w-4 h-4" />
             Delete All
           </button>
        </div>
      </div>
      
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
         <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center text-sm font-semibold text-gray-700">
             <span>Daily Transactions</span>
             <span>{activeCompany?.name}</span>
         </div>
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-100/50">
                  <tr>
                     <th className="px-6 py-3 border-r border-gray-200 text-left w-12">
                        <input 
                           type="checkbox" 
                           className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                           checked={vouchers.length > 0 && selectedIds.length === vouchers.length}
                           onChange={handleSelectAll}
                        />
                     </th>
                     <th className="px-6 py-3 border-r border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                     <th className="px-6 py-3 border-r border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Particulars</th>
                     <th className="px-6 py-3 border-r border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <select
                           value={typeFilter}
                           onChange={e => setTypeFilter(e.target.value)}
                           className="bg-transparent border-none outline-none focus:ring-0 text-xs font-semibold text-gray-600 uppercase p-0 m-0 cursor-pointer w-full text-left"
                        >
                           <option value="">VOUCHER TYPE (ALL)</option>
                           <option value="Purchase">PURCHASE</option>
                           <option value="Sales">SALES</option>
                           <option value="Payment">PAYMENT</option>
                           <option value="Receipt">RECEIPT</option>
                           <option value="Journal">JOURNAL</option>
                           <option value="Contra">CONTRA</option>
                        </select>
                     </th>
                     <th className="px-6 py-3 border-r border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Voucher No.</th>
                     <th className="px-6 py-3 border-r border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                       Dr. (₹)
                     </th>
                     <th className="px-6 py-3 border-r border-gray-200 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                       Cr. (₹)
                     </th>
                     <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                       Actions
                     </th>
                  </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                  {vouchers.length === 0 ? (
                     <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                           No transactions found for the selected period.
                        </td>
                     </tr>
                  ) : (
                     vouchers.map((v, index) => {
                        const party = ledgers.find(l => l.id === v.partyId)?.name || 'Unknown';
                        const { debit, credit } = getDebitCreditAmount(v);
                        if (debit) totalDebit += debit;
                        if (credit) totalCredit += credit;
                        
                        return (
                           <tr id={`row-${index}`} key={v.id} className={`active:bg-blue-100 md:hover:bg-blue-50/50 transition-colors duration-150 group cursor-pointer ${selectedIndex === index ? 'bg-blue-100' : ''}`} onClick={() => setSelectedIndex(index)} onDoubleClick={() => handleEdit(v)}>
                              <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap w-12" onClick={e => e.stopPropagation()}>
                                 <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    checked={selectedIds.includes(v.id)}
                                    onChange={(e) => handleSelectOne(e, v.id)}
                                 />
                              </td>
                              <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap text-sm text-gray-800 font-medium">{formatDate(v.date)}</td>
                              <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap text-sm font-medium text-gray-900">{String(party || "")}</td>
                              <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap text-sm text-gray-800 font-medium">{String(v.type || "")}</td>
                              <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap text-sm text-blue-900 font-semibold">{String(v.number || "-")}</td>
                              <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap text-sm text-gray-900 text-right">
                                 {debit ? debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}
                              </td>
                              <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap text-sm text-gray-900 text-right">
                                 {credit ? credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                 <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(v); }} className="text-gray-400 hover:text-blue-600" title="Edit Voucher">
                                       <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(v.id); }} className="text-gray-400 hover:text-red-500" title="Delete Voucher">
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        )
                     })
                  )}
               </tbody>
               <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                 <tr>
                    <td colSpan={5} className="px-6 py-4 border-r border-gray-200 text-right text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Grand Total
                    </td>
                    <td className="px-6 py-4 border-r border-gray-200 text-right text-sm font-bold text-gray-900">
                       {totalDebit > 0 ? totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}
                    </td>
                    <td className="px-6 py-4 border-r border-gray-200 text-right text-sm font-bold text-gray-900">
                       {totalCredit > 0 ? totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}
                    </td>
                    <td className="px-6 py-4"></td>
                 </tr>
               </tfoot>
            </table>
         </div>
      </div>
    
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
    </div>
  );
}

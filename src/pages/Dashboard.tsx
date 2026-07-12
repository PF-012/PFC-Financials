import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Voucher } from '../types';

export default function Dashboard() {
  const { activeCompany, financialYear } = useAppContext();
  const { user } = useAuth();
  
  const [stats, setStats] = React.useState({ sales: 0, purchases: 0, totalVouchers: 0 });

  React.useEffect(() => {
    if (!activeCompany || !user || !financialYear) return;
    const q = query(collection(db, 'vouchers'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      let sales = 0;
      let purchases = 0;
      const compVouchers = snap.docs.filter(doc => {
        const v = doc.data() as Voucher;
        return v.companyId === activeCompany.id && v.date >= financialYear.start && v.date <= financialYear.end;
      });
      compVouchers.forEach(doc => {
        const v = doc.data() as Voucher;
        if (v.type === 'Sales') sales += v.totalAmount;
        if (v.type === 'Purchase') purchases += v.totalAmount;
      });
      setStats({ sales, purchases, totalVouchers: compVouchers.length });
    });
    return () => unsub();
  }, [activeCompany, user, financialYear]);

  if (!activeCompany) {
    return <Navigate to="/companies" />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-semibold text-gray-900">Dashboard <span className="text-gray-500 text-lg ml-2 font-normal">({financialYear?.label})</span></h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">₹ {stats.sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
         </div>
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Purchases</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">₹ {stats.purchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
         </div>
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Vouchers</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalVouchers}</p>
         </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
         <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Links</h3>
         </div>
         <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/ledgers" className="flex items-center justify-center p-4 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
               Manage Ledgers
            </Link>
            <Link to="/vouchers" className="flex items-center justify-center p-4 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
               Record Voucher
            </Link>
            <Link to="/reports" className="flex items-center justify-center p-4 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
               View Reports
            </Link>
            <Link to="/data" className="flex items-center justify-center p-4 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
               Import/Export Data
            </Link>
         </div>
      </div>
    </div>
  );
}

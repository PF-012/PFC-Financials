import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from '../lib/firebase';
import { db } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import DateInput from '../components/DateInput';
import { Voucher, Ledger } from '../types';
import { X, ArrowLeft } from 'lucide-react';

export default function Reports() {
  const { activeCompany, financialYear } = useAppContext();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [activeReport, setActiveReport] = useState<'pnl' | 'balanceSheet' | 'trialBalance' | 'cashFlow'>('pnl');
  const [breakdownStack, setBreakdownStack] = useState<{title: string, type: 'vouchers' | 'ledgers', data: any[]}[]>([]);
  const breakdown = breakdownStack[breakdownStack.length - 1] || null;

  const handleBreakdown = (title: string, type: 'vouchers' | 'ledgers', filterFn: (v: any) => boolean) => {
    if (!reportData) return;
    let data: any[] = [];
    
    if (type === 'vouchers') {
        data = reportData.allVouchers.filter(filterFn);
    } else if (type === 'ledgers') {
        // Find normal ledgers
        data = reportData.allLedgers.filter(filterFn).map((l: any) => {
           let bal = reportData.ledgerBalances[l.id] || 0;
           if (['Indirect Expenses', 'Indirect Incomes', 'Direct Expenses', 'Direct Incomes', 'Sales Accounts', 'Purchase Accounts'].includes(l.group)) {
              bal = reportData.currentChanges[l.id] || 0;
           }
           return { ...l, balance: bal };
        }).filter((l: any) => l.balance !== 0);
        
        // Add pseudo-items based on title to explain the rest of the balance
        if (title.includes('Current Assets') || title === 'Sundry Debtors / Current Assets') {
            if (reportData.unassignedCash !== 0) data.push({ id: 'pseudo-cash', name: 'Uncategorized Cash/Bank (Receipts - Payments)', group: 'Current Assets', balance: reportData.unassignedCash });
            if (reportData.unassignedDuties > 0) data.push({ id: 'pseudo-duties', name: 'Uncategorized Duties & Taxes (GST Receivable)', group: 'Current Assets', balance: reportData.unassignedDuties });
        }
        if (title.includes('Current Liabilities') || title === 'Sundry Creditors / Current Liabilities') {
            if (reportData.unassignedDuties < 0) data.push({ id: 'pseudo-duties', name: 'Uncategorized Duties & Taxes (GST Payable)', group: 'Current Liabilities', balance: reportData.unassignedDuties });
        }
        if (title.includes('Sales')) {
            if (reportData.unassignedSales !== 0) data.push({ id: 'pseudo-sales', name: 'Uncategorized Sales', group: 'Sales Accounts', balance: reportData.unassignedSales });
        }
        if (title.includes('Purchase')) {
            if (reportData.unassignedPurchases !== 0) data.push({ id: 'pseudo-purchases', name: 'Uncategorized Purchases', group: 'Purchase Accounts', balance: reportData.unassignedPurchases });
        }
    }
    setBreakdownStack([{ title, type, data }]);
  };
  
  const pushBreakdown = (title: string, type: 'vouchers' | 'ledgers', data: any[]) => {
    setBreakdownStack(prev => [...prev, { title, type, data }]);
  };
  
  const popBreakdown = () => {
    setBreakdownStack(prev => prev.slice(0, -1));
  };
  
  const closeBreakdown = () => {
    setBreakdownStack([]);
  };

  
  const [fromDate, setFromDate] = useState(financialYear.start);
  const [toDate, setToDate] = useState(financialYear.end);

  useEffect(() => {
    setFromDate(financialYear.start);
    setToDate(financialYear.end);
  }, [financialYear]);

  useEffect(() => {
    if (activeCompany && user) {
      loadData();
    }
  }, [activeCompany, user, fromDate, toDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const vq = query(collection(db, 'vouchers'), where('userId', '==', user?.uid));
      const vSnap = await getDocs(vq);
      const allVouchers = vSnap.docs.filter(doc => doc.data().companyId === activeCompany?.id).map(doc => ({ id: doc.id, ...doc.data() } as Voucher));

      const lq = query(collection(db, 'ledgers'), where('userId', '==', user?.uid));
      const lSnap = await getDocs(lq);
      const ledgers = lSnap.docs.filter(doc => doc.data().companyId === activeCompany?.id).map(doc => ({ id: doc.id, ...doc.data() } as Ledger)).filter(l => {
    const name = String(l.name || '').trim();
    return name && name !== 'Unknown';
  });

      const ledgerBalances: Record<string, number> = {};
      ledgers.forEach(l => {
         ledgerBalances[l.id] = l.openingBalance || 0; // + is Dr, - is Cr
      });

      let totalSales = 0, totalPurchases = 0, totalReceipts = 0, totalPayments = 0;
      let prevTotalSales = 0, prevTotalPurchases = 0;
      let unassignedReceipts = 0, unassignedPayments = 0, unassignedDuties = 0, unassignedSales = 0, unassignedPurchases = 0;

      const currentChanges: Record<string, number> = {};
      const prevChanges: Record<string, number> = {};

      const relevantVouchers = allVouchers.filter(v => v.date <= toDate);
      const currentVouchers = relevantVouchers.filter(v => v.date >= fromDate);

      relevantVouchers.forEach(v => {
        const isCurrent = v.date >= fromDate;
        const totalGst = (v.cgstAmount || 0) + (v.sgstAmount || 0) + (v.igstAmount || 0) + (v.gstAmount || 0);
        const baseAmt = (v.totalAmount || 0) - totalGst + (v.tdsAmount || 0);

        const applyToLedger = (id: string, amt: number) => {
           ledgerBalances[id] = (ledgerBalances[id] || 0) + amt;
           if (isCurrent) currentChanges[id] = (currentChanges[id] || 0) + amt;
           else prevChanges[id] = (prevChanges[id] || 0) + amt;
        };

        if (v.type === 'Sales') {
            if (v.accountId) applyToLedger(v.accountId, -baseAmt);
            else if (isCurrent) { totalSales += baseAmt; unassignedSales += baseAmt; }
            else prevTotalSales += baseAmt;

            unassignedDuties -= totalGst; // Cr Duties
            if (v.partyId) applyToLedger(v.partyId, ((v.totalAmount || 0) - (v.tdsAmount || 0)));
        } else if (v.type === 'Purchase') {
            if (v.accountId) applyToLedger(v.accountId, baseAmt);
            else if (isCurrent) { totalPurchases += baseAmt; unassignedPurchases += baseAmt; }
            else prevTotalPurchases += baseAmt;

            unassignedDuties += totalGst; // Dr Duties
            if (v.partyId) applyToLedger(v.partyId, -((v.totalAmount || 0) - (v.tdsAmount || 0)));
        } else if (v.type === 'Receipt') {
            if (v.accountId) applyToLedger(v.accountId, (v.totalAmount || 0));
            else unassignedReceipts += v.totalAmount || 0;
            if (isCurrent) totalReceipts += v.totalAmount || 0;
            if (v.partyId) applyToLedger(v.partyId, -(v.totalAmount || 0));
        } else if (v.type === 'Payment') {
            if (v.accountId) applyToLedger(v.accountId, -(v.totalAmount || 0));
            else unassignedPayments += v.totalAmount || 0;
            if (isCurrent) totalPayments += v.totalAmount || 0;
            if (v.partyId) applyToLedger(v.partyId, (v.totalAmount || 0));
        } else if (v.type === 'Journal' || v.type === 'Contra') {
            if (v.accountId) applyToLedger(v.accountId, -(v.totalAmount || 0)); // Credit
            if (v.partyId) applyToLedger(v.partyId, (v.totalAmount || 0)); // Debit
        } else if (v.type === 'Debit Note') {
            if (v.accountId) applyToLedger(v.accountId, -baseAmt);
            else if (isCurrent) totalPurchases -= baseAmt;
            else prevTotalPurchases -= baseAmt;

            unassignedDuties -= totalGst; // Cr Duties
            if (v.partyId) applyToLedger(v.partyId, ((v.totalAmount || 0) - (v.tdsAmount || 0)));
        } else if (v.type === 'Credit Note') {
            if (v.accountId) applyToLedger(v.accountId, baseAmt);
            else if (isCurrent) totalSales -= baseAmt;
            else prevTotalSales -= baseAmt;

            unassignedDuties += totalGst; // Dr Duties
            if (v.partyId) applyToLedger(v.partyId, -((v.totalAmount || 0) - (v.tdsAmount || 0)));
        }
      });

      let capital = 0;
      let currentAssets = (unassignedReceipts - unassignedPayments);
      let currentLiabilities = 0;
      let fixedAssets = 0;
      
      let indirectExpenses = 0, indirectIncomes = 0, directExpenses = 0, directIncomes = 0;
      let prevIndirectExpenses = 0, prevIndirectIncomes = 0, prevDirectExpenses = 0, prevDirectIncomes = 0;
      
      ledgers.forEach(l => {
         const bal = ledgerBalances[l.id] || 0;
         const curChange = currentChanges[l.id] || 0;
         const prevChange = (prevChanges[l.id] || 0) + (l.openingBalance || 0);

         if (l.group === 'Capital Account') capital -= bal; 
         else if (['Current Assets', 'Sundry Debtors', 'Cash-in-Hand', 'Bank Accounts'].includes(l.group)) currentAssets += bal;
         else if (['Current Liabilities', 'Sundry Creditors'].includes(l.group)) currentLiabilities -= bal;
         else if (l.group === 'Fixed Assets') fixedAssets += bal;
         else if (l.group === 'Duties & Taxes') currentLiabilities -= bal;
         
         // Current Year P&L
         if (l.group === 'Indirect Expenses') indirectExpenses += curChange;
         else if (l.group === 'Indirect Incomes') indirectIncomes -= curChange;
         else if (l.group === 'Direct Expenses') directExpenses += curChange;
         else if (l.group === 'Direct Incomes') directIncomes -= curChange;
         else if (l.group === 'Purchase Accounts') totalPurchases += curChange;
         else if (l.group === 'Sales Accounts') totalSales -= curChange;

         // Previous Years P&L
         if (l.group === 'Indirect Expenses') prevIndirectExpenses += prevChange;
         else if (l.group === 'Indirect Incomes') prevIndirectIncomes -= prevChange;
         else if (l.group === 'Direct Expenses') prevDirectExpenses += prevChange;
         else if (l.group === 'Direct Incomes') prevDirectIncomes -= prevChange;
         else if (l.group === 'Purchase Accounts') prevTotalPurchases += prevChange;
         else if (l.group === 'Sales Accounts') prevTotalSales -= prevChange;
      });

      if (unassignedDuties < 0) {
         currentLiabilities -= unassignedDuties;
      } else {
         currentAssets += unassignedDuties;
      }
      
      const openingStock = 0;
      const closingStock = 0;
      
      const grossProfit = (totalSales + directIncomes) - (totalPurchases + directExpenses);
      const netProfit = (grossProfit + indirectIncomes) - indirectExpenses;

      const prevGrossProfit = (prevTotalSales + prevDirectIncomes) - (prevTotalPurchases + prevDirectExpenses);
      const prevNetProfit = (prevGrossProfit + prevIndirectIncomes) - prevIndirectExpenses;
      
      // Update reportData state interface to include prevNetProfit
      setReportData({
        totalSales,
        totalPurchases,
        totalReceipts,
        totalPayments,
        openingStock,
        closingStock,
        directExpenses,
        directIncomes,
        indirectExpenses,
        indirectIncomes,
        grossProfit,
        netProfit,
        prevNetProfit,
        capital,
        currentLiabilities,
        fixedAssets,
        currentAssets,
        unassignedCash: unassignedReceipts - unassignedPayments,
        unassignedDuties,
        unassignedSales,
        unassignedPurchases,
        allVouchers: currentVouchers, // Only show current vouchers in breakdown
        allLedgers: ledgers,
        ledgerBalances,
        currentChanges
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!activeCompany) return null;

  if (loading || !reportData) {
    return (
       <div className="flex justify-center p-12">
          <div className="text-gray-500">Loading reports...</div>
       </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
           <h1 className="text-2xl font-semibold text-blue-900">Reports</h1>
           <p className="text-sm text-gray-500">Financial Performance</p>
        </div>
        <div className="flex items-center gap-2">
           <label className="text-sm text-gray-600">From:</label>
           <DateInput value={fromDate} onChange={setFromDate} className="w-[100px] px-2 py-1 text-xs border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900" />
           <label className="text-sm text-gray-600 ml-2">To:</label>
           <DateInput value={toDate} onChange={setToDate} className="w-[100px] px-2 py-1 text-xs border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900" />
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 no-print">
        <button 
          onClick={() => setActiveReport('pnl')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeReport === 'pnl' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Profit & Loss
        </button>
        <button 
          onClick={() => setActiveReport('balanceSheet')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeReport === 'balanceSheet' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Balance Sheet
        </button>
        <button 
          onClick={() => setActiveReport('trialBalance')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeReport === 'trialBalance' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Trial Balance
        </button>
        <button 
          onClick={() => setActiveReport('cashFlow')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeReport === 'cashFlow' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Cash Flow
        </button>
      </div>

      {activeReport === 'pnl' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
           <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Left Side: Expenses / Direct */}
              <div className="p-0 md:border-r border-gray-200 flex flex-col">
                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-900">Particulars (Dr)</div>
                 <div className="flex-1 p-6 space-y-4">
                    <div className="flex justify-between text-sm">
                       <span className="text-gray-700">Opening Stock</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.openingStock.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className={`flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick={() => handleBreakdown('Purchase Accounts', 'ledgers', l => l.group === 'Purchase Accounts')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Purchase Accounts</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.totalPurchases.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className={`flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick={() => handleBreakdown('Direct Expenses', 'ledgers', l => l.group === 'Direct Expenses')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Direct Expenses</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.directExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex justify-between text-sm font-semibold">
                       <span className="text-gray-900">Gross Profit c/o</span>
                       <span className="text-gray-900">₹ {Math.max(0, reportData.grossProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t-2 border-gray-200">
                       <div className={`flex justify-between text-sm mb-4 cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick={() => handleBreakdown('Indirect Expenses', 'ledgers', l => l.group === 'Indirect Expenses')}>
                          <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Indirect Expenses</span>
                          <span className="text-gray-900 font-medium">₹ {reportData.indirectExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                       </div>
                       <div className="flex justify-between text-sm font-semibold">
                          <span className="text-blue-900">Net Profit</span>
                          <span className="text-blue-900">₹ {Math.max(0, reportData.netProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Right Side: Incomes / Indirect */}
              <div className="p-0 flex flex-col">
                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 border-t md:border-t-0 font-medium text-gray-900">Particulars (Cr)</div>
                 <div className="flex-1 p-6 space-y-4">
                    <div className={`flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick={() => handleBreakdown('Sales Accounts', 'ledgers', l => l.group === 'Sales Accounts')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Sales Accounts</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.totalSales.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className={`flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick={() => handleBreakdown('Direct Incomes', 'ledgers', l => l.group === 'Direct Incomes')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Direct Incomes</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.directIncomes.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-gray-700">Closing Stock</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.closingStock.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex justify-between text-sm font-semibold text-gray-400">
                       <span>Gross Loss c/o</span>
                       <span>{reportData.grossProfit < 0 ? `₹ ${Math.abs(reportData.grossProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</span>
                    </div>

                    <div className="mt-8 pt-6 border-t-2 border-gray-200">
                       <div className="flex justify-between text-sm mb-4">
                          <span className="text-gray-900 font-semibold">Gross Profit b/f</span>
                          <span className="text-gray-900 font-medium">₹ {Math.max(0, reportData.grossProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                       </div>
                       <div className={`flex justify-between text-sm mb-4 cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick={() => handleBreakdown('Indirect Incomes', 'ledgers', l => l.group === 'Indirect Incomes')}>
                          <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Indirect Incomes</span>
                          <span className="text-gray-900 font-medium">₹ {reportData.indirectIncomes.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                       </div>
                       <div className="flex justify-between text-sm font-semibold text-gray-400">
                          <span>Net Loss</span>
                          <span>{reportData.netProfit < 0 ? `₹ ${Math.abs(reportData.netProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</span>
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </div>
      )}

      {activeReport === 'balanceSheet' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
           <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-0 md:border-r border-gray-200 flex flex-col">
                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-900">Liabilities</div>
                 <div className="flex-1 p-6 space-y-4">
                    <div className={`flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick={() => handleBreakdown('Capital Account', 'ledgers', l => l.group === 'Capital Account')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Capital Account</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.capital.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className={`flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick={() => handleBreakdown('Current Liabilities', 'ledgers', l => ['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes'].includes(l.group))}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Current Liabilities</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.currentLiabilities.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-gray-700">Profit & Loss A/c (Current Year)</span>
                       <span className="text-gray-900 font-medium">₹ {Math.max(0, reportData.netProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    {reportData.prevNetProfit !== 0 && (
                      <div className="flex justify-between text-sm">
                         <span className="text-gray-700">Profit & Loss A/c (Previous Years)</span>
                         <span className="text-gray-900 font-medium">₹ {Math.max(0, reportData.prevNetProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                    )}
                 </div>
                 <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between font-semibold text-blue-900">
                   <span>Total</span>
                   <span>₹ {(reportData.capital + reportData.currentLiabilities + Math.max(0, reportData.netProfit) + Math.max(0, reportData.prevNetProfit)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                 </div>
              </div>
              <div className="p-0 flex flex-col">
                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 border-t md:border-t-0 font-medium text-gray-900">Assets</div>
                 <div className="flex-1 p-6 space-y-4">
                    <div className={`flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick={() => handleBreakdown('Fixed Assets', 'ledgers', l => l.group === 'Fixed Assets')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Fixed Assets</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.fixedAssets.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className={`flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick={() => handleBreakdown('Current Assets', 'ledgers', l => ['Current Assets', 'Sundry Debtors', 'Cash-in-Hand', 'Bank Accounts'].includes(l.group))}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Current Assets</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.currentAssets.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    {reportData.netProfit < 0 && (
                      <div className="flex justify-between text-sm">
                         <span className="text-gray-700">Profit & Loss A/c (Current Loss)</span>
                         <span className="text-gray-900 font-medium">₹ {Math.abs(reportData.netProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                    )}
                    {reportData.prevNetProfit < 0 && (
                      <div className="flex justify-between text-sm">
                         <span className="text-gray-700">Profit & Loss A/c (Previous Loss)</span>
                         <span className="text-gray-900 font-medium">₹ {Math.abs(reportData.prevNetProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                    )}
                 </div>
                 <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between font-semibold text-blue-900">
                   <span>Total</span>
                   <span>₹ {(reportData.fixedAssets + reportData.currentAssets + (reportData.netProfit < 0 ? Math.abs(reportData.netProfit) : 0) + (reportData.prevNetProfit < 0 ? Math.abs(reportData.prevNetProfit) : 0)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeReport === 'trialBalance' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
           <table className="min-w-full text-left border-collapse">
             <thead>
               <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                 <th className="px-6 py-3">Particulars</th>
                 <th className="px-6 py-3 text-right">Debit (₹)</th>
                 <th className="px-6 py-3 text-right">Credit (₹)</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-200 bg-white">
               <tr className={`cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 transition-colors`} onClick={() => handleBreakdown('Sales Accounts', 'ledgers', l => l.group === 'Sales Accounts')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Sales Accounts</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.totalSales.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
               </tr>
               <tr className={`cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 transition-colors`} onClick={() => handleBreakdown('Purchase Accounts', 'ledgers', l => l.group === 'Purchase Accounts')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Purchase Accounts</td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.totalPurchases.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
               </tr>
               <tr className={`cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 transition-colors`} onClick={() => handleBreakdown('Direct Expenses', 'ledgers', l => l.group === 'Direct Expenses')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Direct Expenses</td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.directExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
               </tr>
               <tr className={`cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 transition-colors`} onClick={() => handleBreakdown('Indirect Expenses', 'ledgers', l => l.group === 'Indirect Expenses')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Indirect Expenses</td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.indirectExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
               </tr>
               <tr className={`cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 transition-colors`} onClick={() => handleBreakdown('Indirect Incomes', 'ledgers', l => l.group === 'Indirect Incomes')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Indirect Incomes</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.indirectIncomes.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
               </tr>
               <tr className={`cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 transition-colors`} onClick={() => handleBreakdown('Direct Incomes', 'ledgers', l => l.group === 'Direct Incomes')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Direct Incomes</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.directIncomes.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
               </tr>
               <tr className={`cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 transition-colors`} onClick={() => handleBreakdown('Sundry Debtors / Current Assets', 'ledgers', l => ['Current Assets', 'Sundry Debtors', 'Cash-in-Hand', 'Bank Accounts'].includes(l.group))}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Current Assets</td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.currentAssets.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
               </tr>
               <tr className={`cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 transition-colors`} onClick={() => handleBreakdown('Fixed Assets', 'ledgers', l => l.group === 'Fixed Assets')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Fixed Assets</td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.fixedAssets.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
               </tr>
               <tr className={`cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 transition-colors`} onClick={() => handleBreakdown('Sundry Creditors / Current Liabilities', 'ledgers', l => ['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes'].includes(l.group))}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Current Liabilities</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.currentLiabilities.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
               </tr>
               <tr className={`cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 transition-colors`} onClick={() => handleBreakdown('Capital Account', 'ledgers', l => l.group === 'Capital Account')}>
                 <td className="px-6 py-4 text-sm text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Capital Account</td>
                 <td className="px-6 py-4 text-sm text-right"></td>
                 <td className="px-6 py-4 text-sm text-right font-medium">{reportData.capital.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
               </tr>
               {reportData.prevNetProfit !== 0 && (
                  <tr>
                     <td className="px-6 py-4 text-sm text-gray-700">Retained Earnings (Previous Years P&L)</td>
                     <td className="px-6 py-4 text-sm text-right font-medium">{reportData.prevNetProfit < 0 ? Math.abs(reportData.prevNetProfit).toLocaleString('en-IN', {minimumFractionDigits: 2}) : ''}</td>
                     <td className="px-6 py-4 text-sm text-right font-medium">{reportData.prevNetProfit > 0 ? reportData.prevNetProfit.toLocaleString('en-IN', {minimumFractionDigits: 2}) : ''}</td>
                  </tr>
               )}
             </tbody>
             <tfoot className="bg-gray-50 border-t-2 border-gray-200">
               <tr>
                 <td className="px-6 py-4 text-sm font-semibold text-blue-900">Total</td>
                 <td className="px-6 py-4 text-sm font-semibold text-blue-900 text-right">
                   {(reportData.totalPurchases + reportData.currentAssets + reportData.fixedAssets + reportData.directExpenses + reportData.indirectExpenses + Math.max(0, -reportData.prevNetProfit)).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                 </td>
                 <td className="px-6 py-4 text-sm font-semibold text-blue-900 text-right">
                   {(reportData.totalSales + reportData.directIncomes + reportData.currentLiabilities + reportData.capital + reportData.indirectIncomes + Math.max(0, reportData.prevNetProfit)).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                 </td>
               </tr>
             </tfoot>
           </table>
        </div>
      )}

      {activeReport === 'cashFlow' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
           <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
             <h3 className="font-medium text-gray-900">Cash Flow Statement</h3>
           </div>
           <div className="p-6 space-y-6">
             <div>
               <h4 className="text-sm font-semibold text-gray-900 mb-3">Cash Inflows</h4>
               <div className={`flex justify-between text-sm py-2 border-b border-gray-100 cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick={() => handleBreakdown('Receipts from Customers', 'vouchers', v => v.type === 'Receipt')}>
                 <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Receipts from Customers</span>
                 <span className="text-gray-900 font-medium">₹ {reportData.totalReceipts.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
               </div>
             </div>
             <div>
               <h4 className="text-sm font-semibold text-gray-900 mb-3">Cash Outflows</h4>
               <div className={`flex justify-between text-sm py-2 border-b border-gray-100 cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick={() => handleBreakdown('Payments to Suppliers', 'vouchers', v => v.type === 'Payment')}>
                 <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Payments to Suppliers</span>
                 <span className="text-gray-900 font-medium">₹ {reportData.totalPayments.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
               </div>
             </div>
             <div className="flex justify-between text-sm font-semibold pt-4 border-t-2 border-gray-200">
               <span className="text-blue-900">Net Cash Flow</span>
               <span className="text-blue-900">₹ {(reportData.totalReceipts - reportData.totalPayments).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
             </div>
           </div>
        </div>
      )}


      {breakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
             <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                   {breakdownStack.length > 1 && (
                      <button onClick={popBreakdown} className="text-gray-400 hover:text-gray-600 transition-colors">
                         <ArrowLeft className="w-5 h-5" />
                      </button>
                   )}
                   <h3 className="text-lg font-medium text-gray-900">{breakdown.title}</h3>
                </div>
                <button onClick={closeBreakdown} className="text-gray-400 hover:text-gray-500">
                   <X className="w-5 h-5" />
                </button>
             </div>
             <div className="overflow-y-auto p-0 flex-1">
                <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50 sticky top-0">
                      <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {breakdown.type === 'vouchers' ? 'Date / Ref' : 'Ledger Name'}
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {breakdown.type === 'vouchers' ? 'Party / Details' : 'Group'}
                         </th>
                         <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                         </th>
                      </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                      {breakdown.data.length === 0 ? (
                         <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No records found.</td>
                         </tr>
                      ) : (
                         breakdown.data.map((item, i) => (
                            <tr 
                                  key={item.id || i} 
                                  className={`hover:bg-gray-50 ${breakdown.type === 'ledgers' ? 'cursor-pointer' : ''}`}
                                  onClick={() => {
                                     if (breakdown.type === 'ledgers') {
                                        let ledgerVouchers: any[] = [];
                                        if (item.id === 'pseudo-cash') ledgerVouchers = reportData.allVouchers.filter((v: any) => (v.type === 'Receipt' || v.type === 'Payment') && !v.accountId);
                                        else if (item.id === 'pseudo-duties') ledgerVouchers = reportData.allVouchers.filter((v: any) => v.cgstAmount || v.sgstAmount || v.igstAmount || v.gstAmount);
                                        else if (item.id === 'pseudo-sales') ledgerVouchers = reportData.allVouchers.filter((v: any) => v.type === 'Sales' && !v.accountId);
                                        else if (item.id === 'pseudo-purchases') ledgerVouchers = reportData.allVouchers.filter((v: any) => v.type === 'Purchase' && !v.accountId);
                                        else ledgerVouchers = reportData.allVouchers.filter((v: any) => v.partyId === item.id || v.accountId === item.id);
                                        
                                        pushBreakdown(item.name + ' Vouchers', 'vouchers', ledgerVouchers);
                                     }
                                  }}
                               >
                               <td className={`px-6 py-4 whitespace-nowrap text-sm ${breakdown.type === 'ledgers' ? 'text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600' : 'text-gray-900'}`}>
                                  {breakdown.type === 'vouchers' ? `${String(item.date || "")} ${String(item.number || "") ? '(#'+String(item.number || "")+')' : ''}` : String(item.name || "")}
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {breakdown.type === 'vouchers' ? (reportData.allLedgers.find((l: any) => l.id === item.partyId)?.name || '-') : String(item.group || "")}
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                  ₹ {Math.abs(breakdown.type === 'vouchers' ? item.totalAmount : item.balance).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                  {breakdown.type === 'ledgers' && <span className="text-xs text-gray-500 ml-1">{item.balance > 0 ? 'Dr' : 'Cr'}</span>}
                               </td>
                            </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

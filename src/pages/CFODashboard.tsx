import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { collection, onSnapshot, query, where } from '../lib/firebase';
import { db } from '../lib/firebase';
import { Voucher, Ledger } from '../types';
import { TrendingUp, DollarSign, Building2, Activity, Bot, Loader2, Target } from 'lucide-react';
import Markdown from 'react-markdown';
import FRFSAModal from '../components/FRFSAModal';
import { FileSpreadsheet } from 'lucide-react';

export default function CFODashboard() {
  const { activeCompany, financialYear } = useAppContext();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  
  const [metrics, setMetrics] = useState<any>(null);
  const [aiCommentary, setAiCommentary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFRFSAOpen, setIsFRFSAOpen] = useState(false);

  useEffect(() => {
    if (!activeCompany) return;
    
    const unsubs: any[] = [];
    const qVouchers = query(collection(db, 'vouchers'), where('companyId', '==', activeCompany.id));
    const qLedgers = query(collection(db, 'ledgers'), where('companyId', '==', activeCompany.id));
    
    unsubs.push(onSnapshot(qVouchers, (snap) => setVouchers(snap.docs.map(d => d.data()))));
    unsubs.push(onSnapshot(qLedgers, (snap) => setLedgers(snap.docs.map(d => d.data()))));
    
    return () => unsubs.forEach(u => u());
  }, [activeCompany]);

  useEffect(() => {
    if (ledgers.length === 0) return;
    
    // Calculate native investor metrics
    // Simplified models for demonstration
    let cashReserves = 0;
    let fixedAssets = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    ledgers.forEach(l => {
      if (l.group.toLowerCase().includes('bank') || l.group.toLowerCase().includes('cash')) {
        cashReserves += l.openingBalance || 0;
      }
      if (l.group.toLowerCase().includes('fixed asset')) {
        fixedAssets += l.openingBalance || 0;
      }
    });

    vouchers.forEach(v => {
      if (v.type === 'Sales' || v.type === 'Receipt') {
        totalRevenue += v.totalAmount || 0;
      } else if (v.type === 'Purchase' || v.type === 'Payment') {
        totalExpenses += v.totalAmount || 0;
      }
    });
    
    
    let minDate = new Date();
    let maxDate = new Date('1970-01-01');
    
    if (vouchers.length > 0) {
      vouchers.forEach(v => {
        const d = new Date(v.date);
        if (d < minDate) minDate = d;
        if (d > maxDate) maxDate = d;
      });
    } else {
      minDate = new Date();
      maxDate = new Date();
    }

    let monthsDiff = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth());
    if (monthsDiff <= 0) monthsDiff = 1;

    const monthlyBurn = totalExpenses / monthsDiff;
    const runwayMonths = monthlyBurn > 0 ? cashReserves / monthlyBurn : 0;
    
    const netIncome = totalRevenue - totalExpenses;
    const netProfitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
    
    const fixedAssetTurnover = fixedAssets > 0 ? totalRevenue / fixedAssets : 0;

    setMetrics({
      financialYear: financialYear.label,

      cashReserves: Number(cashReserves.toFixed(2)),
      monthlyBurn: Number(monthlyBurn.toFixed(2)),
      runwayMonths: isFinite(runwayMonths) ? Number(runwayMonths.toFixed(2)) : 0,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netProfitMargin: Number(netProfitMargin.toFixed(2)),
      fixedAssetTurnover: Number(fixedAssetTurnover.toFixed(2))
    });
    
  }, [vouchers, ledgers, financialYear]);

  const generateCommentary = async () => {
    if (!metrics) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/cfo-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, sector: activeCompany?.settings?.sector || 'General' })
      });
      const data = await res.json();
      if (data.commentary) {
        setAiCommentary(data.commentary);
      } else if (data.error) {
        if (data.error.includes("401") || data.error.toLowerCase().includes("authentication") || data.error.toLowerCase().includes("api key")) {
           setAiCommentary("⚠️ **Authentication Error:** Your Gemini API Key is invalid or missing.\n\nPlease click the **Settings** menu in the top right corner of AI Studio and enter a valid Gemini API Key.");
        } else {
           setAiCommentary(`⚠️ **Error:** ${data.error}`);
        }
      } else {
         setAiCommentary("Failed to generate commentary.");
      }
    } catch (e) {
      console.error(e);
      setAiCommentary("Error connecting to AI Analyst.");
    }
    setIsGenerating(false);
  };

  if (!activeCompany || !metrics) return null;

  return (
    <>
    <FRFSAModal isOpen={isFRFSAOpen} onClose={() => setIsFRFSAOpen(false)} activeCompany={activeCompany} metrics={metrics} />
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-blue-900" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Metrics & Models ({financialYear?.label})</h1>
            <p className="text-sm text-gray-500">Investor-ready financial models and specialized industry metrics.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 font-medium text-sm">Cash Reserves</h3>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><DollarSign className="w-5 h-5" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{metrics.cashReserves.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 font-medium text-sm">Est. Runway</h3>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.runwayMonths.toFixed(1)} Months</p>
          <p className="text-xs text-gray-500 mt-2">Based on ₹{metrics.monthlyBurn.toLocaleString(undefined, {maximumFractionDigits:0})}/mo burn</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 font-medium text-sm">Net Profit Margin</h3>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg"><Building2 className="w-5 h-5" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.netProfitMargin ? metrics.netProfitMargin.toFixed(1) : 0}%</p>
          <p className="text-xs text-gray-500 mt-2">Net Income / Total Revenue</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 font-medium text-sm">Fixed Asset Turnover</h3>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg"><Activity className="w-5 h-5" /></div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.fixedAssetTurnover.toFixed(2)}x</p>
          <p className="text-xs text-gray-500 mt-2">Revenue / Fixed Assets</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <Bot className="w-6 h-6 text-blue-900" />
             <h2 className="text-lg font-semibold text-gray-900">AI Analyst: CFO Commentary</h2>
          </div>
          <button 
             onClick={generateCommentary}
             disabled={isGenerating}
             className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800 disabled:opacity-70 flex items-center gap-2 transition-colors"
          >
             {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
             {isGenerating ? 'Analyzing...' : 'Generate Variance Report'}
          </button>
          <button 
             onClick={() => setIsFRFSAOpen(true)}
             className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 flex items-center gap-2 transition-colors ml-3"
          >
             <FileSpreadsheet className="w-4 h-4" />
             View FRFSA Model
          </button>
        </div>
        <div className="p-6">
          {!aiCommentary && !isGenerating ? (
            <div className="text-center py-12 text-gray-500">
               <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
               <p>Click "Generate Variance Report" to analyze fluctuations and draft CFO-ready commentary.</p>
            </div>
          ) : (
            <div className="prose prose-blue max-w-none text-gray-800 markdown-body">
              <Markdown>{aiCommentary}</Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

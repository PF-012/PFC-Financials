import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { collection, onSnapshot, query, where } from '../lib/firebase';
import { db } from '../lib/firebase';
import { Voucher, Ledger } from '../types';
import { calculateCashFlow } from '../lib/cashFlow';
import { TrendingUp, DollarSign, Building2, Activity, Bot, Loader2, Target, FileSpreadsheet, ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import Markdown from 'react-markdown';
import FRFSAModal from '../components/FRFSAModal';

const money = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const round2 = (value: number) => Number((Number(value) || 0).toFixed(2));

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
    const qVouchers = query(collection(db, 'vouchers'), where('companyId', '==', activeCompany.id));
    const qLedgers = query(collection(db, 'ledgers'), where('companyId', '==', activeCompany.id));
    const unsubVouchers = onSnapshot(qVouchers, snap => setVouchers(snap.docs.map((d: any) => ({ ...d.data(), id: d.id }))));
    const unsubLedgers = onSnapshot(qLedgers, snap => setLedgers(snap.docs.map((d: any) => ({ ...d.data(), id: d.id }))));
    return () => { unsubVouchers(); unsubLedgers(); };
  }, [activeCompany]);

  useEffect(() => {
    if (!activeCompany) { setMetrics(null); return; }

    const fyVouchers = vouchers.filter(v => {
      if (!financialYear?.start || !financialYear?.end) return true;
      return v.date >= financialYear.start && v.date <= financialYear.end;
    });

    let fixedAssets = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    ledgers.forEach(l => {
      const group = String(l.group || '').toLowerCase();
      if (group.includes('fixed asset')) fixedAssets += Number(l.openingBalance) || 0;
    });
    fyVouchers.forEach(v => {
      const amount = Math.abs(Number(v.totalAmount) || 0);
      if (v.type === 'Sales') totalRevenue += amount;
      else if (v.type === 'Purchase' || v.type === 'Payment') totalExpenses += amount;
    });

    const cashFlow = calculateCashFlow(fyVouchers, ledgers);
    const dates = fyVouchers.map(v => new Date(v.date)).filter(d => !Number.isNaN(d.getTime()));
    const minDate = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    const maxDate = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
    const monthSpan = dates.length ? ((maxDate.getFullYear() - minDate.getFullYear()) * 12 + maxDate.getMonth() - minDate.getMonth() + 1) : 1;
    const activeMonths = Math.max(1, monthSpan);
    const monthlyOperatingBurn = cashFlow.operatingOutflows / activeMonths;
    const runwayMonths = monthlyOperatingBurn > 0 ? cashFlow.closingCashBank / monthlyOperatingBurn : 0;
    const netIncome = totalRevenue - totalExpenses;
    const netProfitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
    const fixedAssetTurnover = fixedAssets > 0 ? totalRevenue / fixedAssets : 0;

    setMetrics({
      financialYear: financialYear?.label || '',
      cashReserves: round2(cashFlow.closingCashBank),
      openingCashBank: round2(cashFlow.openingCashBank),
      monthlyBurn: round2(monthlyOperatingBurn),
      runwayMonths: Number.isFinite(runwayMonths) ? round2(runwayMonths) : 0,
      totalRevenue: round2(totalRevenue),
      totalExpenses: round2(totalExpenses),
      netIncome: round2(netIncome),
      netProfitMargin: round2(netProfitMargin),
      fixedAssetTurnover: round2(fixedAssetTurnover),
      cashFlow
    });
  }, [activeCompany, vouchers, ledgers, financialYear]);

  const generateCommentary = async () => {
    if (!metrics) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/cfo-insights', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, sector: activeCompany?.settings?.sector || 'General' })
      });
      const data = await res.json();
      if (data.commentary) setAiCommentary(data.commentary);
      else if (data.error) setAiCommentary(`⚠️ **Error:** ${data.error}`);
      else setAiCommentary('Failed to generate commentary.');
    } catch (e) {
      console.error(e); setAiCommentary('Error connecting to AI Analyst.');
    } finally { setIsGenerating(false); }
  };

  if (!activeCompany || !metrics) return null;
  const cf = metrics.cashFlow;

  const rows = [
    ['Operating Inflows', cf.operatingInflows, 'in'],
    ['Other Inflows', cf.otherInflows, 'in'],
    ['Investing Inflows', cf.investingInflows, 'in'],
    ['Financing Inflows', cf.financingInflows, 'in'],
    ['Operating Outflows', cf.operatingOutflows, 'out'],
    ['Other Outflows', cf.otherOutflows, 'out'],
    ['Investing Outflows', cf.investingOutflows, 'out'],
    ['Financing Outflows', cf.financingOutflows, 'out']
  ];

  return (
    <>
      <FRFSAModal isOpen={isFRFSAOpen} onClose={() => setIsFRFSAOpen(false)} activeCompany={activeCompany} metrics={metrics} />
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-900" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Metrics & Models ({financialYear?.label || 'Current FY'})</h1>
              <p className="text-sm text-gray-500">CFO cash-flow analytics, investor metrics and strategic financial models.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4"><h3 className="text-gray-500 font-medium text-sm">Closing Cash & Bank</h3><div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><Wallet className="w-5 h-5" /></div></div>
            <p className="text-3xl font-bold text-gray-900">{money(metrics.cashReserves)}</p>
            <p className="text-xs text-gray-500 mt-2">Opening {money(metrics.openingCashBank)} + net cash flow</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4"><h3 className="text-gray-500 font-medium text-sm">Est. Runway</h3><div className="p-2 bg-purple-50 text-purple-700 rounded-lg"><TrendingUp className="w-5 h-5" /></div></div>
            <p className="text-3xl font-bold text-gray-900">{metrics.runwayMonths.toFixed(1)} Months</p>
            <p className="text-xs text-gray-500 mt-2">Based on {money(metrics.monthlyBurn)}/mo operating burn</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4"><h3 className="text-gray-500 font-medium text-sm">Operating Cash Flow</h3><div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg"><Activity className="w-5 h-5" /></div></div>
            <p className={`text-3xl font-bold ${cf.operatingCashFlow >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{money(cf.operatingCashFlow)}</p>
            <p className="text-xs text-gray-500 mt-2">Operating inflows − operating outflows</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4"><h3 className="text-gray-500 font-medium text-sm">Net Profit Margin</h3><div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg"><Building2 className="w-5 h-5" /></div></div>
            <p className="text-3xl font-bold text-gray-900">{metrics.netProfitMargin.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-2">Accounting revenue / expense indicator</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div><h2 className="text-lg font-semibold text-gray-900">CFO Cash Flow Statement</h2><p className="text-xs text-gray-500 mt-1">Direct cash/bank movements for the selected financial year.</p></div>
            <div className="text-right"><p className="text-xs text-gray-500">Net Cash Flow</p><p className={`font-bold ${cf.netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{money(cf.netCashFlow)}</p></div>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Cash Inflows</h3>
              <div className="space-y-2">
                {rows.slice(0, 4).map(([label, value]) => <div key={label as string} className="flex justify-between border-b border-gray-100 py-2"><span className="flex items-center gap-2 text-gray-700"><ArrowDownRight className="w-4 h-4 text-emerald-600" />{label}</span><span className="font-mono text-emerald-700">{money(value as number)}</span></div>)}
              </div>
              <div className="flex justify-between mt-4 pt-3 border-t-2 border-gray-200 font-bold"><span>Total Inflows</span><span>{money(cf.totalInflows)}</span></div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Cash Outflows</h3>
              <div className="space-y-2">
                {rows.slice(4).map(([label, value]) => <div key={label as string} className="flex justify-between border-b border-gray-100 py-2"><span className="flex items-center gap-2 text-gray-700"><ArrowUpRight className="w-4 h-4 text-red-600" />{label}</span><span className="font-mono text-red-700">{money(value as number)}</span></div>)}
              </div>
              <div className="flex justify-between mt-4 pt-3 border-t-2 border-gray-200 font-bold"><span>Total Outflows</span><span>{money(cf.totalOutflows)}</span></div>
            </div>
          </div>
          <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              ['Operating Cash Flow', cf.operatingCashFlow],
              ['Investing Cash Flow', cf.investingCashFlow],
              ['Financing Cash Flow', cf.financingCashFlow],
              ['Other Cash Flow', cf.otherCashFlow]
            ].map(([label, value]) => <div key={label as string} className="border border-gray-200 rounded-lg p-4 bg-gray-50"><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold mt-1">{money(value as number)}</p></div>)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">How PFC Classified Cash Movements</h2><p className="text-xs text-gray-500 mt-1">Receipt/Payment vouchers are classified from the source ledger's CFO category, group and name. Sales/Purchase/Journal vouchers remain non-cash unless an actual Receipt/Payment is recorded.</p></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-100"><tr><th className="text-left px-6 py-3">Category</th><th className="text-right px-6 py-3">Amount</th><th className="text-left px-6 py-3">Treatment</th></tr></thead><tbody>
            {rows.map(([label, value, direction]) => <tr key={label as string} className="border-t border-gray-100"><td className="px-6 py-3 font-medium">{label}</td><td className="px-6 py-3 text-right font-mono">{money(value as number)}</td><td className="px-6 py-3 text-gray-500">{direction === 'in' ? 'Cash / bank inflow' : 'Cash / bank outflow'}</td></tr>)}
          </tbody></table></div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-8">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2"><Bot className="w-6 h-6 text-blue-900" /><h2 className="text-lg font-semibold text-gray-900">AI Analyst: CFO Commentary</h2></div>
            <div className="flex items-center gap-3">
              <button onClick={generateCommentary} disabled={isGenerating} className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800 disabled:opacity-70 flex items-center gap-2 transition-colors">{isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}{isGenerating ? 'Analyzing...' : 'Generate Variance Report'}</button>
              <button onClick={() => setIsFRFSAOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 flex items-center gap-2 transition-colors"><FileSpreadsheet className="w-4 h-4" /> View FRFSA Model</button>
            </div>
          </div>
          <div className="p-6">{!aiCommentary && !isGenerating ? <div className="text-center py-12 text-gray-500"><TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p>Click "Generate Variance Report" to analyze the accounting and cash-flow metrics.</p></div> : <div className="prose prose-blue max-w-none text-gray-800 markdown-body"><Markdown>{aiCommentary}</Markdown></div>}</div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-4"><strong>Additional metric:</strong> Fixed Asset Turnover = Revenue / Fixed Assets = {metrics.fixedAssetTurnover.toFixed(2)}x. The accounting net-income and margin indicators remain separate from the cash-flow statement.</div>
      </div>
    </>
  );
}

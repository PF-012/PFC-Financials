import { Ledger, Voucher } from '../types';
import { calculateCashFlow, CashFlowBreakdown } from './cashFlow';

export interface StatementRow { label: string; value: number; indent?: number; bold?: boolean; note?: string; }
export interface ThreeStatementModel {
  period: { start: string; end: string; label: string };
  pnl: { revenue: number; cogs: number; grossProfit: number; operatingExpenses: number; otherIncome: number; ebitda: number; depreciation: number; ebit: number; financeCost: number; profitBeforeTax: number; tax: number; netIncome: number; rows: StatementRow[] };
  balanceSheet: { assets: StatementRow[]; liabilities: StatementRow[]; equity: StatementRow[]; totalAssets: number; totalLiabilitiesEquity: number; balanceCheck: number; };
  cashFlow: CashFlowBreakdown;
  workingCapital: { receivables: number; inventory: number; payables: number; otherCurrentAssets: number; otherCurrentLiabilities: number; netWorkingCapital: number; changeInNwc: number; };
  checks: { balanceSheetBalances: boolean; cashReconciles: boolean; warnings: string[] };
}

const n = (x: unknown) => Number(x) || 0;
const t = (x: unknown) => String(x || '').trim().toLowerCase();
const round = (x: number) => Math.round(x * 100) / 100;
const isCash = (l?: Ledger) => ['cash-in-hand', 'bank accounts'].includes(t(l?.group));
const signForBalance = (group: string) => ['capital account','current liabilities','sundry creditors','duties & taxes','sales accounts','direct incomes','indirect incomes'].includes(t(group)) ? -1 : 1;

function applyVoucher(bal: Record<string, number>, v: Voucher, ledgers: Ledger[]) {
  const add = (id: string | undefined, amount: number) => { if (id) bal[id] = (bal[id] || 0) + amount; };
  const gst = n(v.cgstAmount) + n(v.sgstAmount) + n(v.igstAmount) + n(v.gstAmount);
  const base = n(v.totalAmount) - gst + n(v.tdsAmount);
  if (v.type === 'Sales') { add(v.accountId, -base); add(v.partyId, n(v.totalAmount)); }
  else if (v.type === 'Purchase') { add(v.accountId, base); add(v.partyId, -n(v.totalAmount)); }
  else if (v.type === 'Receipt') { add(v.accountId, base); add(v.partyId, -base); }
  else if (v.type === 'Payment') { add(v.accountId, -base); add(v.partyId, base); }
  else if (v.type === 'Contra') { add(v.partyId, base); add(v.accountId, -base); }
  else if (v.type === 'Journal') { add(v.partyId, n(v.totalAmount)); add(v.accountId, -n(v.totalAmount)); }
  else if (v.type === 'Debit Note') { add(v.partyId, n(v.totalAmount)); add(v.accountId, -base); }
  else if (v.type === 'Credit Note') { add(v.partyId, -n(v.totalAmount)); add(v.accountId, base); }
  // GST is represented in the same Duties & Taxes ledger used by the reports engine.
  if (gst) {
    const duties = ledgers.find(l => t(l.group) === 'duties & taxes');
    if (duties) {
      if (v.type === 'Sales' || v.type === 'Credit Note') add(duties.id, -gst);
      if (v.type === 'Purchase' || v.type === 'Debit Note') add(duties.id, gst);
    }
  }
}

function balancesAt(date: string, vouchers: Voucher[], ledgers: Ledger[]) {
  const balances: Record<string, number> = {};
  ledgers.forEach(l => balances[l.id] = n(l.openingBalance));
  vouchers.filter(v => String(v.date || '').slice(0,10) <= date).forEach(v => applyVoucher(balances, v, ledgers));
  return balances;
}

function statementComponents(bal: Record<string, number>, ledgers: Ledger[]) {
  const sum = (groups: string[]) => ledgers.filter(l => groups.includes(t(l.group))).reduce((s,l) => s + n(bal[l.id]) * signForBalance(l.group), 0);
  return {
    revenue: sum(['sales accounts']),
    cogs: sum(['purchase accounts','direct expenses']),
    otherIncome: sum(['direct incomes','indirect incomes']),
    operatingExpenses: sum(['indirect expenses']),
    cash: sum(['cash-in-hand','bank accounts']),
    fixedAssets: sum(['fixed assets']),
    receivables: sum(['sundry debtors']),
    inventory: sum(['stock-in-hand','current assets - inventory','inventory']),
    payables: sum(['sundry creditors']),
    currentLiabilities: sum(['current liabilities','duties & taxes']),
    capital: sum(['capital account']),
    currentAssetsOther: sum(['current assets'])
  };
}

export function buildThreeStatementModel(vouchers: Voucher[], ledgers: Ledger[], period: { start: string; end: string; label?: string }): ThreeStatementModel {
  const all = vouchers.filter(v => String(v.date || '').slice(0,10) <= period.end);
  const current = all.filter(v => String(v.date || '').slice(0,10) >= period.start && String(v.date || '').slice(0,10) <= period.end);
  const openingBal = balancesAt(new Date(new Date(period.start).getTime() - 86400000).toISOString().slice(0,10), vouchers, ledgers);
  const closingBal = balancesAt(period.end, vouchers, ledgers);
  const op = statementComponents(openingBal, ledgers);
  const cl = statementComponents(closingBal, ledgers);
  const revenue = round(cl.revenue - op.revenue);
  const cogs = round(cl.cogs - op.cogs);
  const otherIncome = round(cl.otherIncome - op.otherIncome);
  const operatingExpenses = round(cl.operatingExpenses - op.operatingExpenses);
  const grossProfit = round(revenue - cogs);
  const ebitda = round(grossProfit + otherIncome - operatingExpenses);
  const depreciation = 0; // No dedicated depreciation field exists in the current voucher/ledger schema; depreciation ledger is treated as operating expense.
  const ebit = ebitda - depreciation;
  const financeCost = 0; // Derived only when a finance-cost ledger is available; current schema does not encode a dedicated finance-cost flag.
  const pbt = round(ebit - financeCost);
  const tax = 0; // Tax liability is reported in the balance sheet; tax expense cannot be safely inferred without a dedicated tax-expense ledger.
  const netIncome = round(pbt - tax);

  const cashFlow = calculateCashFlow(current, ledgers);
  const cashClosingFromLedger = cl.cash;
  const cashReconciliation = round(cashClosingFromLedger - cashFlow.closingCashBank);

  const currentAssetsOther = Math.max(0, round(cl.currentAssetsOther - cl.cash - cl.receivables - cl.inventory));
  const currentLiabilitiesOther = Math.max(0, round(cl.currentLiabilities - cl.payables));
  const totalAssets = round(cl.cash + cl.receivables + cl.inventory + currentAssetsOther + cl.fixedAssets);
  const totalLiabilitiesEquity = round(cl.payables + currentLiabilitiesOther + cl.capital + netIncome);
  const balanceCheck = round(totalAssets - totalLiabilitiesEquity);

  const openingNwc = round(op.receivables + op.inventory + Math.max(0, op.currentAssetsOther - op.cash - op.receivables - op.inventory) - op.payables - Math.max(0, op.currentLiabilities - op.payables));
  const closingNwc = round(cl.receivables + cl.inventory + currentAssetsOther - cl.payables - currentLiabilitiesOther);

  const warnings: string[] = [];
  if (Math.abs(cashReconciliation) > 1) warnings.push(`Cash flow does not fully reconcile to the ledger closing cash/bank balance. Difference: ₹${cashReconciliation.toLocaleString('en-IN')}. Review non-cash/uncategorized movements.`);
  if (Math.abs(balanceCheck) > 1) warnings.push(`Balance sheet does not fully balance. Difference: ₹${balanceCheck.toLocaleString('en-IN')}. This can occur where the current voucher schema does not contain full multi-line journal detail.`);
  if (!ledgers.some(l => t(l.group) === 'stock-in-hand')) warnings.push('Closing inventory is not available from a dedicated Stock-in-Hand ledger, so inventory is shown as zero unless such a ledger exists.');
  warnings.push('This model is generated from PFC ledger/voucher data. Where the current data schema lacks a dedicated depreciation, tax-expense or finance-cost account, those lines are not estimated by AI and remain zero until supported by accounting data.');

  return {
    period: { start: period.start, end: period.end, label: period.label || '' },
    pnl: {
      revenue, cogs, grossProfit, operatingExpenses, otherIncome, ebitda, depreciation, ebit, financeCost, profitBeforeTax: pbt, tax, netIncome,
      rows: [
        { label: 'Revenue / Sales', value: revenue, bold: true },
        { label: 'Cost of Goods Sold / Direct Costs', value: -cogs, indent: 1 },
        { label: 'Gross Profit', value: grossProfit, bold: true },
        { label: 'Other Operating / Non-Sales Income', value: otherIncome, indent: 1 },
        { label: 'Operating Expenses', value: -operatingExpenses, indent: 1 },
        { label: 'EBITDA', value: ebitda, bold: true },
        { label: 'Depreciation & Amortisation', value: -depreciation, indent: 1, note: depreciation ? undefined : 'Not separately identifiable from current data schema' },
        { label: 'EBIT', value: ebit, bold: true },
        { label: 'Finance Cost', value: -financeCost, indent: 1 },
        { label: 'Profit Before Tax', value: pbt, bold: true },
        { label: 'Tax Expense', value: -tax, indent: 1, note: tax ? undefined : 'Not separately identifiable from current data schema' },
        { label: 'Profit After Tax / Net Income', value: netIncome, bold: true }
      ]
    },
    balanceSheet: {
      assets: [
        { label: 'Cash & Bank', value: cl.cash },
        { label: 'Trade Receivables', value: cl.receivables },
        { label: 'Inventory', value: cl.inventory },
        { label: 'Other Current Assets', value: currentAssetsOther },
        { label: 'Property, Plant & Equipment / Fixed Assets', value: cl.fixedAssets },
        { label: 'Total Assets', value: totalAssets, bold: true }
      ],
      liabilities: [
        { label: 'Trade Payables', value: cl.payables },
        { label: 'Other Current Liabilities & Taxes', value: currentLiabilitiesOther },
        { label: 'Total Liabilities', value: round(cl.payables + currentLiabilitiesOther), bold: true }
      ],
      equity: [
        { label: 'Capital / Equity', value: cl.capital },
        { label: 'Current Period Profit / (Loss)', value: netIncome },
        { label: 'Total Equity', value: round(cl.capital + netIncome), bold: true },
        { label: 'Total Liabilities + Equity', value: totalLiabilitiesEquity, bold: true }
      ],
      totalAssets, totalLiabilitiesEquity, balanceCheck
    },
    cashFlow,
    workingCapital: {
      receivables: cl.receivables,
      inventory: cl.inventory,
      payables: cl.payables,
      otherCurrentAssets: currentAssetsOther,
      otherCurrentLiabilities: currentLiabilitiesOther,
      netWorkingCapital: closingNwc,
      changeInNwc: round(closingNwc - openingNwc)
    },
    checks: { balanceSheetBalances: Math.abs(balanceCheck) <= 1, cashReconciles: Math.abs(cashReconciliation) <= 1, warnings }
  };
}

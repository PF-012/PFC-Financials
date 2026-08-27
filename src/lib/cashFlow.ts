import { Ledger, Voucher } from '../types';

export type CashFlowBucket =
  | 'Operating Inflow'
  | 'Other Inflow'
  | 'Investing Inflow'
  | 'Financing Inflow'
  | 'Operating Outflow'
  | 'Investing Outflow'
  | 'Financing Outflow'
  | 'Other Outflow'
  | 'Non-Cash';

export interface CashFlowBreakdown {
  operatingInflows: number;
  otherInflows: number;
  investingInflows: number;
  financingInflows: number;
  operatingOutflows: number;
  investingOutflows: number;
  financingOutflows: number;
  otherOutflows: number;
  totalInflows: number;
  totalOutflows: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  otherCashFlow: number;
  netCashFlow: number;
  openingCashBank: number;
  closingCashBank: number;
  classifications: Array<{
    voucherId: string;
    voucherType: string;
    date: string;
    amount: number;
    bucket: CashFlowBucket;
    sourceLedger: string;
    sourceGroup: string;
    reason: string;
  }>;
}

const text = (value: unknown) => String(value || '').trim().toLowerCase();

const containsAny = (value: string, terms: string[]) => terms.some(term => value.includes(term));

const explicitCategory = (ledger?: Ledger): CashFlowBucket | null => {
  const category = text(ledger?.cashFlowCategory);
  if (category === 'operating') return 'Operating Inflow';
  if (category === 'other') return 'Other Inflow';
  if (category === 'investing') return 'Investing Inflow';
  if (category === 'financing') return 'Financing Inflow';
  return null;
};

const classifyReceipt = (ledger?: Ledger): { bucket: CashFlowBucket; reason: string } => {
  const name = text(ledger?.name);
  const group = text(ledger?.group);
  const combined = `${name} ${group}`;
  const explicit = explicitCategory(ledger);
  if (explicit) return { bucket: explicit, reason: 'Ledger has an explicit cash-flow classification.' };

  if (containsAny(combined, ['grant', 'subsidy', 'government scheme', 'government assistance', 'incentive', 'fund received', 'donation'])) {
    return { bucket: 'Other Inflow', reason: 'Grant, subsidy, assistance or other fund receipt detected.' };
  }
  if (containsAny(combined, ['loan', 'borrowing', 'borrowings', 'term loan', 'working capital loan', 'overdraft', 'debenture', 'finance'])) {
    return { bucket: 'Financing Inflow', reason: 'Borrowing/loan funding detected.' };
  }
  if (containsAny(combined, ['capital account', 'share capital', 'partner capital', 'owner capital', 'proprietor capital'])) {
    return { bucket: 'Financing Inflow', reason: 'Capital contribution detected.' };
  }
  if (containsAny(combined, ['fixed asset', 'property plant', 'plant & machinery', 'machinery', 'vehicle', 'equipment', 'land', 'building'])) {
    return { bucket: 'Investing Inflow', reason: 'Receipt appears related to disposal of a fixed asset.' };
  }
  if (containsAny(group, ['sundry debtors', 'sales accounts', 'direct incomes']) || containsAny(combined, ['customer', 'sales receipt', 'service income'])) {
    return { bucket: 'Operating Inflow', reason: 'Customer/sales/service-related receipt detected.' };
  }
  if (containsAny(group, ['indirect incomes']) || containsAny(combined, ['interest received', 'commission received', 'rent received', 'refund'])) {
    return { bucket: 'Other Inflow', reason: 'Non-sales income or miscellaneous receipt detected.' };
  }
  return { bucket: 'Other Inflow', reason: 'Receipt could not be confidently classified as operating, investing or financing.' };
};

const classifyPayment = (ledger?: Ledger): { bucket: CashFlowBucket; reason: string } => {
  const name = text(ledger?.name);
  const group = text(ledger?.group);
  const combined = `${name} ${group}`;
  const explicit = explicitCategory(ledger);
  if (explicit) {
    return {
      bucket: explicit === 'Operating Inflow' ? 'Operating Outflow' :
        explicit === 'Other Inflow' ? 'Other Outflow' :
        explicit === 'Investing Inflow' ? 'Investing Outflow' : 'Financing Outflow',
      reason: 'Ledger has an explicit cash-flow classification.'
    };
  }

  if (containsAny(combined, ['loan repayment', 'loan installment', 'loan emi', 'principal repayment', 'borrowing repayment', 'term loan', 'overdraft'])) {
    return { bucket: 'Financing Outflow', reason: 'Loan/borrowing repayment detected.' };
  }
  if (containsAny(combined, ['capital account', 'drawings', 'dividend', 'share buyback', 'partner withdrawal', 'owner withdrawal'])) {
    return { bucket: 'Financing Outflow', reason: 'Capital distribution/withdrawal detected.' };
  }
  if (containsAny(group, ['fixed assets']) || containsAny(combined, ['purchase of machinery', 'purchase of vehicle', 'purchase of equipment', 'property purchase', 'land purchase', 'building purchase'])) {
    return { bucket: 'Investing Outflow', reason: 'Fixed-asset acquisition detected.' };
  }
  if (containsAny(group, ['purchase accounts', 'direct expenses', 'indirect expenses', 'sundry creditors', 'duties & taxes']) || containsAny(combined, ['supplier', 'vendor', 'expense', 'salary', 'rent', 'tax'])) {
    return { bucket: 'Operating Outflow', reason: 'Supplier, expense, payroll, tax or operating payment detected.' };
  }
  return { bucket: 'Other Outflow', reason: 'Payment could not be confidently classified as operating, investing or financing.' };
};

export function classifyCashFlowVoucher(voucher: Voucher, ledgers: Ledger[]) {
  if (voucher.type !== 'Receipt' && voucher.type !== 'Payment') {
    return { bucket: 'Non-Cash' as CashFlowBucket, reason: 'Voucher type does not represent a direct cash/bank movement.' };
  }

  const sourceLedger = ledgers.find(l => l.id === voucher.partyId);
  return voucher.type === 'Receipt' ? classifyReceipt(sourceLedger) : classifyPayment(sourceLedger);
}

export function calculateCashFlow(vouchers: Voucher[], ledgers: Ledger[]): CashFlowBreakdown {
  const openingCashBank = ledgers
    .filter(l => ['cash-in-hand', 'bank accounts'].includes(text(l.group)))
    .reduce((sum, l) => sum + (Number(l.openingBalance) || 0), 0);

  const result: CashFlowBreakdown = {
    operatingInflows: 0,
    otherInflows: 0,
    investingInflows: 0,
    financingInflows: 0,
    operatingOutflows: 0,
    investingOutflows: 0,
    financingOutflows: 0,
    otherOutflows: 0,
    totalInflows: 0,
    totalOutflows: 0,
    operatingCashFlow: 0,
    investingCashFlow: 0,
    financingCashFlow: 0,
    otherCashFlow: 0,
    netCashFlow: 0,
    openingCashBank,
    closingCashBank: openingCashBank,
    classifications: []
  };

  vouchers.forEach(voucher => {
    const amount = Math.abs(Number(voucher.totalAmount) || 0);
    if (amount === 0) return;
    const classification = classifyCashFlowVoucher(voucher, ledgers);
    const sourceLedger = ledgers.find(l => l.id === voucher.partyId);

    result.classifications.push({
      voucherId: voucher.id,
      voucherType: voucher.type,
      date: voucher.date,
      amount,
      bucket: classification.bucket,
      sourceLedger: sourceLedger?.name || 'Unknown',
      sourceGroup: sourceLedger?.group || '',
      reason: classification.reason
    });

    switch (classification.bucket) {
      case 'Operating Inflow': result.operatingInflows += amount; break;
      case 'Other Inflow': result.otherInflows += amount; break;
      case 'Investing Inflow': result.investingInflows += amount; break;
      case 'Financing Inflow': result.financingInflows += amount; break;
      case 'Operating Outflow': result.operatingOutflows += amount; break;
      case 'Investing Outflow': result.investingOutflows += amount; break;
      case 'Financing Outflow': result.financingOutflows += amount; break;
      case 'Other Outflow': result.otherOutflows += amount; break;
      default: break;
    }
  });

  result.totalInflows = result.operatingInflows + result.otherInflows + result.investingInflows + result.financingInflows;
  result.totalOutflows = result.operatingOutflows + result.investingOutflows + result.financingOutflows + result.otherOutflows;
  result.operatingCashFlow = result.operatingInflows - result.operatingOutflows;
  result.investingCashFlow = result.investingInflows - result.investingOutflows;
  result.financingCashFlow = result.financingInflows - result.financingOutflows;
  result.otherCashFlow = result.otherInflows - result.otherOutflows;
  result.netCashFlow = result.totalInflows - result.totalOutflows;
  result.closingCashBank = openingCashBank + result.netCashFlow;

  return result;
}

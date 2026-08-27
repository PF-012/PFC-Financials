import { Ledger } from '../types';

export type AccountingClassification =
  | 'Revenue'
  | 'COGS'
  | 'Operating Expense'
  | 'Other Income'
  | 'Finance Cost'
  | 'Tax Expense'
  | 'Depreciation'
  | 'Inventory'
  | 'Trade Receivable'
  | 'Trade Payable'
  | 'Cash & Bank'
  | 'Fixed Asset'
  | 'Loan / Debt'
  | 'Equity / Retained Earnings'
  | 'Other Asset'
  | 'Other Liability'
  | 'Unknown';

export function inferAccountingClassification(ledger: Ledger): AccountingClassification {
  const explicit = (ledger as any).accountingClassification;
  if (explicit) return explicit;
  const g = String(ledger.group || '').toLowerCase();
  const n = String(ledger.name || '').toLowerCase();
  const text = `${g} ${n}`;
  if (g.includes('cash') || g.includes('bank')) return 'Cash & Bank';
  if (g.includes('fixed asset') || /machinery|equipment|furniture|vehicle|computer|building|plant|property|asset purchase/.test(n)) return 'Fixed Asset';
  if (g.includes('sundry debtor') || /accounts receivable|trade receivable|debtor/.test(n)) return 'Trade Receivable';
  if (g.includes('sundry creditor') || /accounts payable|trade payable|creditor|supplier/.test(n)) return 'Trade Payable';
  if (g.includes('purchase') || /cost of goods|cogs|cost of sales/.test(n)) return 'COGS';
  if (g.includes('sales') || g.includes('direct income') || /revenue|sales income/.test(n)) return 'Revenue';
  if (/depreciation|amortisation|amortization/.test(text)) return 'Depreciation';
  if (/interest|finance cost|bank charges|borrowing cost/.test(text)) return 'Finance Cost';
  if (/income tax|tax expense|current tax|deferred tax/.test(text)) return 'Tax Expense';
  if (/inventory|stock in trade|closing stock/.test(text)) return 'Inventory';
  if (/loan|borrowing|term debt|working capital loan|overdraft/.test(text)) return 'Loan / Debt';
  if (g.includes('capital') || /retained earnings|reserves|surplus|share capital|owner capital/.test(text)) return 'Equity / Retained Earnings';
  if (g.includes('indirect income') || /grant|subsidy|other income|miscellaneous income|gain on sale/.test(text)) return 'Other Income';
  if (g.includes('expense') || g.includes('purchase')) return 'Operating Expense';
  if (g.includes('current asset')) return 'Other Asset';
  if (g.includes('current liabilit')) return 'Other Liability';
  return 'Unknown';
}

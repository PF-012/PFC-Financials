export type VoucherType =
  | 'Sales'
  | 'Purchase'
  | 'Receipt'
  | 'Payment'
  | 'Journal'
  | 'Contra'
  | 'Credit Note'
  | 'Debit Note'
  | 'Sales Order'
  | 'Purchase Order';

export type LicenseType = 'free' | 'monthly';

export interface CompanySettings {
  voucherNumbering: 'auto' | 'manual';
  enableGst: boolean;
  enableTds: boolean;
  enableDebitNote?: boolean;
  enableCreditNote?: boolean;
  enableSalesOrder?: boolean;
  enablePurchaseOrder?: boolean;
}

export interface CompanyLicense {
  type: LicenseType;
  validUntil?: string;
  key?: string;
  activatedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  gstin: string;
  pan: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  email: string;
  phone: string;
  financialYearStart: string;
  booksBeginFrom: string;
  settings?: CompanySettings;
  isBanned?: boolean;
  banReason?: string;
  license?: CompanyLicense;
}

export interface Ledger {
  id: string;
  companyId: string;
  name: string;
  group: string;
  openingBalance: number;
  address?: string;
  email?: string;
  hsnCode?: string;
  gstin?: string;
  contactNo?: string;
  registrationType?: string;
  gstType?: string;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  isSystem?: boolean;
}

export interface Voucher {
  id: string;
  companyId: string;
  type: VoucherType;
  date: string;
  number: string;
  partyId: string;
  accountId?: string;
  totalAmount: number;
  gstAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  isSystem?: boolean;
  tdsAmount?: number;
  narration?: string;
  itemName?: string;
  paymentMode?: string;
  items?: VoucherItem[];
}

export interface VoucherItem {
  id: string;
  ledgerId: string;
  amount: number;
  type: 'Dr' | 'Cr';
}

export interface BankTransaction {
  id: string;
  companyId: string;
  date: string;
  description: string;
  amount: number;
  type: 'Dr' | 'Cr';
  isReconciled: boolean;
  reconciliationDate?: string;
  instrumentNumber?: string;
}

export interface Employee {
  id: string;
  companyId: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  pan: string;
  uan?: string;
  pfNumber?: string;
  esiNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  basicSalary: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  isActive: boolean;
  deductPT?: boolean;
}

export interface TaxBreakdown {
  annualGross: number;
  standardDeduction: number;
  taxableIncome: number;
  taxSlabs: Array<{
    slab: string;
    rate: string;
    amount: number;
  }>;
  totalAnnualTax: number;
  monthlyTds: number;
}

export interface SalarySlip {
  id: string;
  companyId: string;
  employeeId: string;
  month: number;
  year: number;

  basic: number;
  hra: number;
  conveyance: number;
  medical: number;
  special: number;
  grossEarnings: number;

  pf: number;
  esi: number;
  pt: number;
  tds: number;
  otherDeductions: number;
  totalDeductions: number;

  netSalary: number;

  workingDays: number;
  presentDays: number;
  leaves: number;
  taxBreakdown?: TaxBreakdown;
}

/* =========================
   Inventory Management
   ========================= */

export interface InvLocation {
  id: string;
  companyId: string;
  name: string;
  address?: string;
  isDefault?: boolean;
}

export interface InvUnit {
  id: string;
  companyId: string;
  name: string;
  symbol: string;
}

export interface InvGroup {
  id: string;
  companyId: string;
  name: string;
  /** Null/undefined means this is a primary (top-level) group. */
  parentId?: string | null;
}

export interface InvItem {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  groupId?: string | null;
  unitId: string;
  description?: string;
  minStockLevel: number;
  isBatchTracking: boolean;
  purchasePrice: number;
  salesPrice: number;
  hsnCode?: string;
  taxRate?: number;
}

export interface InvBatch {
  id: string;
  companyId: string;
  itemId: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate?: string;
}

export type InvTransactionType =
  | 'IN'
  | 'OUT'
  | 'TRANSFER'
  | 'ADJUSTMENT';

export interface InvTransaction {
  id: string;
  companyId: string;
  type: InvTransactionType;
  itemId: string;
  batchId?: string | null;
  /** Source location for OUT/TRANSFER; location receiving stock for IN. */
  locationId: string;
  /** Destination location used only by TRANSFER transactions. */
  toLocationId?: string | null;
  quantity: number;
  rate: number;
  amount: number;
  date: string;
  reference?: string;
  voucherId?: string | null;
}

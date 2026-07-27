export interface CompanySettings {
  voucherNumbering: 'auto' | 'manual';
  enableGst: boolean;
  enableTds: boolean;
  enableDebitNote?: boolean;
  enableCreditNote?: boolean;
  enableSalesOrder?: boolean;
  enablePurchaseOrder?: boolean;
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
  license?: {
    type: 'free' | 'monthly' | 'permanent';
    validUntil?: string; // ISO string
    key?: string;
    activatedAt?: string;
  };
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
  type: 'Sales' | 'Purchase' | 'Receipt' | 'Payment' | 'Journal' | 'Contra' | 'Credit Note' | 'Debit Note' | 'Sales Order' | 'Purchase Order';
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
  items?: any[];
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
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  pan?: string;
  bankAccount?: string;
  bankName?: string;
  ifscCode?: string;
  branchName?: string;
  basicPay: number;
  dateOfJoining?: string;
  location?: string;
  uan?: string;
  pfAccountNumber?: string;
  gender?: string;
  taxRegime?: 'old' | 'new';
}

export interface SalarySlip {
  id: string;
  companyId: string;
  employeeId: string;
  month: string; // e.g., '2023-10'
  date: string;
  payDate?: string;
  basicPay: number;
  da: number;
  hra: number;
  ta: number;
  childrenAllowance?: number;
  medicalAllowance?: number;
  fixedAllowance?: number;
  otherAllowances: number;
  professionalTax?: number;
  epf?: number;
  esi?: number;
  incomeTax?: number;
  charges?: number;
  deductions: number;
  grossEarnings?: number;
  totalDeductions?: number;
  netPay: number;
}

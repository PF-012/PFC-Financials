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
    type: 'free' | 'monthly';
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
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  pan: string;
  uan?: string; // For PF
  pfNumber?: string;
  esiNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  basicSalary: number; // Monthly basic
  hra: number; // Monthly HRA
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  isActive: boolean;
  deductPT?: boolean;
}

export interface SalarySlip {
  id: string;
  companyId: string;
  employeeId: string;
  month: number; // 1-12
  year: number;
  
  // Earnings
  basic: number;
  hra: number;
  conveyance: number;
  medical: number;
  special: number;
  grossEarnings: number;
  
  // Deductions
  pf: number; // Provident Fund (Employee contribution)
  esi: number; // Employee State Insurance (Employee contribution)
  pt: number; // Professional Tax
  tds: number; // Tax Deducted at Source
  otherDeductions: number;
  totalDeductions: number;
  
  // Net
  netSalary: number;
  
  // Additional info
  workingDays: number;
  presentDays: number;
  leaves: number;
  taxBreakdown?: {
    annualGross: number;
    standardDeduction: number;
    taxableIncome: number;
    taxSlabs: { slab: string, rate: string, amount: number }[];
    totalAnnualTax: number;
    monthlyTds: number;
  };
}

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
  parentId?: string;
}

export interface InvItem {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  groupId?: string;
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

export interface InvTransaction {
  id: string;
  companyId: string;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  itemId: string;
  batchId?: string;
  locationId: string; // From location for OUT/TRANSFER, To location for IN
  toLocationId?: string; // Only for TRANSFER
  quantity: number;
  rate: number;
  amount: number;
  date: string;
  reference?: string;
  voucherId?: string;
}

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { X, Printer } from 'lucide-react';
import { Employee, SalarySlip, Company } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slip: SalarySlip;
  employee: Employee;
  company: Company;
}

const numberToWords = (num: number) => {
  if (num === 0) return 'Zero Only';
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  let strNum = Math.floor(num).toString();
  if (strNum.length > 9) return 'Amount too large';
  const n = ('000000000' + strNum).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) : '';
  return str.trim() + ' Rupees Only';
};

const formatMonth = (monthStr: string) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' }).replace(' ', ', ');
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN');
};

export default function SalarySlipPrintModal({ isOpen, onClose, slip, employee, company }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Payslip_${employee.name}_${slip.month}`,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto pt-24 pb-12">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col my-auto max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 shrink-0 bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800">Preview Salary Slip</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handlePrint()}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2 font-medium transition-colors"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-lg border border-gray-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto bg-gray-100 flex justify-center">
          {/* Printable Area */}
          <div ref={printRef} className="bg-white p-10 shadow-sm border border-gray-200 w-[210mm] min-h-[297mm] text-gray-900 mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
            
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
              <h1 className="text-3xl font-bold uppercase tracking-wider text-blue-900 mb-2">{company.name}</h1>
              <p className="text-sm text-gray-600 max-w-xl mx-auto">{company.address}</p>
              {company.gstin && <p className="text-sm text-gray-600 mt-1">GSTIN: <span className="font-medium">{company.gstin}</span></p>}
              <h2 className="text-xl font-bold mt-6 underline underline-offset-4 decoration-2">PAYSLIP FOR THE MONTH OF {formatMonth(slip.month).toUpperCase()}</h2>
            </div>

            {/* Employee Summary Details */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm mb-8">
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">Employee Name:</span>
                <span className="font-bold">{employee.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">Employee ID:</span>
                <span className="font-bold">{employee.employeeId}</span>
              </div>
              
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">Designation:</span>
                <span className="font-bold">{employee.designation}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">Department:</span>
                <span className="font-bold">{employee.department}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">Date of Joining:</span>
                <span className="font-bold">{formatDate(employee.dateOfJoining) || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">Location:</span>
                <span className="font-bold">{employee.location || '-'}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">Gender:</span>
                <span className="font-bold">{employee.gender || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">Pay Date:</span>
                <span className="font-bold">{formatDate(slip.payDate) || '-'}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">PAN Number:</span>
                <span className="font-bold uppercase">{employee.pan || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">UAN:</span>
                <span className="font-bold">{employee.uan || '-'}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">PF A/C Number:</span>
                <span className="font-bold">{employee.pfAccountNumber || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">Bank Name:</span>
                <span className="font-bold">{employee.bankName || '-'}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">Bank Account No:</span>
                <span className="font-bold">{employee.bankAccount || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="font-semibold text-gray-600">IFSC & Branch:</span>
                <span className="font-bold uppercase">{(employee.ifscCode || '') + (employee.branchName ? ' - ' + employee.branchName : '') || '-'}</span>
              </div>
            </div>

            {/* Salary Breakdown Table */}
            <div className="border border-gray-800 rounded-sm mb-6">
              <div className="grid grid-cols-2 bg-gray-100 font-bold text-gray-900 border-b border-gray-800 text-sm">
                <div className="p-3 border-r border-gray-800">EARNINGS</div>
                <div className="p-3">DEDUCTIONS</div>
              </div>
              
              <div className="grid grid-cols-2 text-sm text-gray-800 min-h-[250px]">
                {/* Earnings Column */}
                <div className="p-3 border-r border-gray-800 flex flex-col gap-2">
                  {!!slip.basicPay && <div className="flex justify-between"><span className="text-gray-600">Basic Pay</span><span>{slip.basicPay ? slip.basicPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                  {!!slip.da && <div className="flex justify-between"><span className="text-gray-600">Dearness Allowance (DA)</span><span>{slip.da ? slip.da.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                  {!!slip.hra && <div className="flex justify-between"><span className="text-gray-600">House Rent Allowance</span><span>{slip.hra ? slip.hra.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                  {!!slip.ta && <div className="flex justify-between"><span className="text-gray-600">Transport Allowance</span><span>{slip.ta ? slip.ta.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                  {slip.childrenAllowance! > 0 && <div className="flex justify-between"><span className="text-gray-600">Children Allowance</span><span>{slip.childrenAllowance ? slip.childrenAllowance!.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                  {slip.medicalAllowance! > 0 && <div className="flex justify-between"><span className="text-gray-600">Medical Allowance</span><span>{slip.medicalAllowance ? slip.medicalAllowance!.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                  {slip.fixedAllowance! > 0 && <div className="flex justify-between"><span className="text-gray-600">Fixed Allowance</span><span>{slip.fixedAllowance ? slip.fixedAllowance!.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                  {!!slip.otherAllowances && <div className="flex justify-between"><span className="text-gray-600">Other Allowances</span><span>{slip.otherAllowances ? slip.otherAllowances.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                </div>
                
                {/* Deductions Column */}
                <div className="p-3 flex flex-col gap-2">
                  {slip.professionalTax! > 0 && <div className="flex justify-between"><span className="text-gray-600">Professional Tax</span><span>{slip.professionalTax ? slip.professionalTax!.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                  {slip.epf! > 0 && <div className="flex justify-between"><span className="text-gray-600">Employee PF</span><span>{slip.epf ? slip.epf!.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                  {slip.esi! > 0 && <div className="flex justify-between"><span className="text-gray-600">ESI</span><span>{slip.esi ? slip.esi!.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                  {slip.incomeTax! > 0 && <div className="flex justify-between"><span className="text-gray-600">Income Tax {slip.grossEarnings && slip.incomeTax ? `(${((slip.incomeTax / slip.grossEarnings) * 100).toFixed(1)}%)` : ''}</span><span>{slip.incomeTax ? slip.incomeTax!.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                  {!!slip.charges && <div className="flex justify-between"><span className="text-gray-600">Charges (Damages/Fines)</span><span>{slip.charges ? slip.charges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                  {!!slip.deductions && <div className="flex justify-between"><span className="text-gray-600">Other Deductions</span><span>{slip.deductions ? slip.deductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></div>}
                </div>
              </div>

              {/* Totals Row */}
              <div className="grid grid-cols-2 border-t border-gray-800 font-bold bg-gray-50 text-sm">
                <div className="p-3 border-r border-gray-800 flex justify-between">
                  <span>Gross Earnings</span>
                  <span>Rs. {(slip.grossEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span>Total Deductions</span>
                  <span>Rs. {(slip.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Net Pay Box */}
            <div className="flex flex-col mb-8">
              <div className="border border-blue-900 bg-blue-50/30 p-4 rounded-sm flex justify-between items-center text-blue-900">
                <div>
                   <span className="font-bold text-lg block">Total Net Payable</span>
                   <span className="text-xs text-blue-700">(Gross Earnings - Total Deductions)</span>
                </div>
                <span className="text-2xl font-bold">Rs. {slip.netPay ? slip.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
              </div>
              <div className="mt-3 text-sm text-gray-700">
                <span className="font-semibold">Amount in Words: </span>
                <span className="italic font-medium">{numberToWords(slip.netPay)}</span>
              </div>
            </div>

            {/* Footer / Signatures */}
            <div className="mt-20 flex justify-between text-sm font-semibold text-gray-800">
              <div className="text-center">
                <div className="border-t border-gray-800 pt-2 w-48 mx-auto">
                  Employee Signature
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-800 pt-2 w-48 mx-auto">
                  Authorised Signatory
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center text-xs text-gray-500 italic">
               This is a computer generated document and does not require a signature.
            </div>

            <style>
               {`
                 @media print {
                   @page { size: A4; margin: 0; }
                   body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                 }
               `}
            </style>
          </div>
        </div>
      </div>
    </div>
  );
}

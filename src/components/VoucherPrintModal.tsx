import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { VoucherPDFDocument } from './VoucherPDF';
import { Voucher, Ledger, Company } from '../types';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { js2xml } from 'xml-js';

interface VoucherPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: Voucher | null;
  company: Company | null;
  party: Ledger | null;
  account?: Ledger | null;
}



function numberToWords(num: number): string {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

  if (num === 0) return 'Zero only';
  
  const strNum = Math.floor(num).toString();
  if (strNum.length > 9) return 'overflow';
  
  const n = ('000000000' + strNum).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  
  let str = '';
  str += (parseInt(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
  str += (parseInt(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
  str += (parseInt(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
  str += (parseInt(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
  str += (parseInt(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) + ' ' : '';
  return str.trim() === '' ? '' : str.trim() + ' Only';
}

export default function VoucherPrintModal({ isOpen, onClose, voucher, company, party, account }: VoucherPrintModalProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  
  
  
  const handleDownloadXML = () => {
    if (!voucher) return;
    const xmlObj = { voucher: { ...voucher } };
    const dataStr = js2xml(xmlObj, { compact: true, spaces: 2 });
    const blob = new Blob([dataStr], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Voucher_${voucher.number || 'auto'}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!voucher) return;
    const dataStr = JSON.stringify(voucher, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Voucher_${voucher.number || 'auto'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: voucher ? `Voucher_${voucher.number || 'auto'}` : 'Voucher',
  });

  if (!isOpen || !voucher || !company) return null;

  const doc = <VoucherPDFDocument voucher={voucher} company={company} party={party} account={account} />;

  const formatAmt = (amt: number) => amt.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    
    let cgstAmt = voucher.cgstAmount || 0;
  let sgstAmt = voucher.sgstAmount || 0;
  let igstAmt = voucher.igstAmount || 0;
  let unallocatedGstAmt = 0;
  
  if (voucher.gstAmount && voucher.gstAmount > 0 && cgstAmt === 0 && sgstAmt === 0 && igstAmt === 0) {
    if (party) {
      const cgstRate = party.cgstRate || 0;
      const sgstRate = party.sgstRate || 0;
      const igstRate = party.igstRate || 0;
      const totalGstRate = cgstRate + sgstRate + igstRate;
      
      if (totalGstRate > 0) {
        cgstAmt = (voucher.gstAmount * cgstRate) / totalGstRate;
        sgstAmt = (voucher.gstAmount * sgstRate) / totalGstRate;
        igstAmt = (voucher.gstAmount * igstRate) / totalGstRate;
      } else if (party.gstType === 'CGST' || party.gstType === 'SGST') {
        cgstAmt = voucher.gstAmount / 2;
        sgstAmt = voucher.gstAmount / 2;
      } else if (party.gstType === 'IGST') {
        igstAmt = voucher.gstAmount;
      } else {
        cgstAmt = voucher.gstAmount / 2;
        sgstAmt = voucher.gstAmount / 2;
      }
    } else {
      unallocatedGstAmt = voucher.gstAmount;
    }
  }

  const totalGstInVoucher = cgstAmt + sgstAmt + igstAmt + unallocatedGstAmt;
  const baseValue = (voucher.totalAmount || 0) - totalGstInVoucher + (voucher.tdsAmount || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="text-lg font-medium text-gray-900">Print / Export Options</h3>
          <div className="flex items-center gap-4">
             <button
               onClick={() => handlePrint()}
               className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
             >
               <Printer className="w-4 h-4" /> Print Document
             </button>
             <PDFDownloadLink 
                document={doc} 
                fileName={`Voucher_${voucher.number || 'auto'}.pdf`}
                className="px-4 py-2 bg-blue-900 text-white rounded-md text-sm font-medium hover:bg-blue-800 transition-colors flex items-center gap-2"
             >
                {/* @ts-ignore */}
                {({ loading }) => (
                  <>
                    <Download className="w-4 h-4" /> {loading ? 'PDF...' : 'PDF'}
                  </>
                )}
             </PDFDownloadLink>
             <button 
               onClick={handleDownloadJSON}
               className="px-4 py-2 bg-indigo-900 text-white rounded-md text-sm font-medium hover:bg-indigo-800 transition-colors flex items-center gap-2"
             >
               <Download className="w-4 h-4" /> JSON
             </button>

             <button onClick={onClose} className="text-gray-400 hover:text-gray-500 ml-2">
               <X className="w-5 h-5" />
             </button>

             <button 
               onClick={handleDownloadXML}
               className="px-4 py-2 bg-purple-900 text-white rounded-md text-sm font-medium hover:bg-purple-800 transition-colors flex items-center gap-2"
             >
               <Download className="w-4 h-4" /> XML
             </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex justify-center">
           {/* HTML Mockup of the PDF */}
           <div ref={componentRef} className="bg-white shadow-sm w-full max-w-[21cm] min-h-[29.7cm] p-12 flex flex-col text-[12px] text-slate-800 font-sans mx-auto h-max print:p-8 print:shadow-none">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                  {voucher.type === 'Sales' ? 'INVOICE' : voucher.type.toUpperCase()}
                </h1>
                <div className="text-right text-sm">
                  <p className="text-slate-600 mb-1">Ref No: <span className="font-bold text-slate-900">{voucher.number || 'Auto'}</span></p>
                  <p className="text-slate-600">Date: <span className="font-bold text-slate-900">{format(new Date(voucher.date), 'dd-MM-yyyy')}</span></p>
                </div>
              </div>

              {/* Address Grid */}
              <div className="flex justify-between mb-8">
                {/* Bill To */}
                <div className="w-[48%]">
                  {<h2 className="text-[10px] font-bold text-slate-900 uppercase bg-slate-100 px-2 py-1 mb-2">
           {voucher.type === 'Receipt' ? 'Received From' : voucher.type === 'Payment' ? 'Paid To' : 'Bill To'}
         </h2>}
                  <p className="font-bold text-slate-900 text-sm mb-1">{party ? party.name : 'Cash'}</p>
                  <div className="text-[11px] text-slate-700 space-y-0.5">
                    {party?.address && <p>{party.address}</p>}
                    {party?.contactNo && <p>Contact: {party.contactNo}</p>}
                    {party?.email && <p>Email: {party.email}</p>}
                    {party?.gstin && <p>GSTIN: {party.gstin}</p>}
                  </div>
                </div>
                
                {/* From */}
                <div className="w-[48%]">
                  {<h2 className="text-[10px] font-bold text-slate-900 uppercase bg-slate-100 px-2 py-1 mb-2">
           {voucher.type === 'Receipt' ? 'Received By' : voucher.type === 'Payment' ? 'Paid By' : 'From'}
         </h2>}
                  <p className="font-bold text-slate-900 text-sm mb-1">{company.name}</p>
                  <div className="text-[11px] text-slate-700 space-y-0.5">
                    {company.address && <p>{company.address}</p>}
                    {company.phone && <p>Contact: {company.phone}</p>}
                    {company.email && <p>Email: {company.email}</p>}
                    {company.gstin && <p>GSTIN: {company.gstin}</p>}
                    {company.pan && <p>PAN: {company.pan}</p>}
                  </div>
                </div>
              </div>

              
              {/* Table / Amount Details */}
              {['Receipt', 'Payment'].includes(voucher.type) ? (
                <div className="w-full mt-4 border border-slate-900 p-4 flex justify-between items-center bg-slate-50">
                  <span className="font-bold text-slate-900 text-sm">Amount {voucher.type === 'Receipt' ? 'Received' : 'Paid'}:</span>
                  <span className="font-bold text-slate-900 text-lg">Rs. {formatAmt(voucher.totalAmount || 0)}</span>
                </div>
              ) : (
                <div className="w-full mt-4 border border-slate-900">
                  <div className="flex border-b border-slate-900 bg-slate-100 py-2 px-2 font-bold">
                    <div className="w-12 text-center">Sl. No.</div>
                    <div className="flex-1">Description</div>
                    <div className="w-32 text-right">Amount (Rs)</div>
                  </div>
                  
                  <div className="flex py-2 px-2 border-b border-slate-200">
                    <div className="w-12 text-center">1</div>
                    <div className="flex-1">{voucher.itemName || 'Item / Service'}</div>
                    <div className="w-32 text-right">{formatAmt(baseValue)}</div>
                  </div>

                  {cgstAmt > 0 && ['Sales', 'Purchase'].includes(voucher.type) && (
                    <div className="flex py-1 px-2 border-b border-slate-200">
                      <div className="w-12"></div>
                      <div className="flex-1 text-slate-700">Add: CGST {(voucher.cgstRate || party?.cgstRate) ? `@${voucher.cgstRate || party?.cgstRate}%` : ''}</div>
                      <div className="w-32 text-right text-slate-800">{formatAmt(cgstAmt)}</div>
                    </div>
                  )}
                  {sgstAmt > 0 && ['Sales', 'Purchase'].includes(voucher.type) && (
                    <div className="flex py-1 px-2 border-b border-slate-200">
                      <div className="w-12"></div>
                      <div className="flex-1 text-slate-700">Add: SGST {(voucher.sgstRate || party?.sgstRate) ? `@${voucher.sgstRate || party?.sgstRate}%` : ''}</div>
                      <div className="w-32 text-right text-slate-800">{formatAmt(sgstAmt)}</div>
                    </div>
                  )}
                  {igstAmt > 0 && ['Sales', 'Purchase'].includes(voucher.type) && (
                    <div className="flex py-1 px-2 border-b border-slate-200">
                      <div className="w-12"></div>
                      <div className="flex-1 text-slate-700">Add: IGST {(voucher.igstRate || party?.igstRate) ? `@${voucher.igstRate || party?.igstRate}%` : ''}</div>
                      <div className="w-32 text-right text-slate-800">{formatAmt(igstAmt)}</div>
                    </div>
                  )}
                  {unallocatedGstAmt > 0 && ['Sales', 'Purchase'].includes(voucher.type) && (
                    <div className="flex py-1 px-2 border-b border-slate-200">
                      <div className="w-12"></div>
                      <div className="flex-1 text-slate-700">Add: GST</div>
                      <div className="w-32 text-right text-slate-800">{formatAmt(unallocatedGstAmt)}</div>
                    </div>
                  )}
                  {(voucher.tdsAmount || 0) > 0 && ['Sales', 'Purchase'].includes(voucher.type) && (
                    <div className="flex py-1 px-2 border-b border-slate-200">
                      <div className="w-12"></div>
                      <div className="flex-1 text-slate-700">Less: TDS</div>
                      <div className="w-32 text-right text-slate-800">-{formatAmt(voucher.tdsAmount || 0)}</div>
                    </div>
                  )}

                  {/* Padding */}
                  <div className="h-10"></div>
                  
                  <div className="flex border-t border-slate-900 bg-slate-100 py-2 px-2 font-bold text-sm text-slate-900">
                    <div className="w-12"></div>
                    <div className="flex-1">Total Amount</div>
                    <div className="w-32 text-right">{formatAmt(voucher.totalAmount || 0)}</div>
                  </div>
                </div>
              )}
              {/* Amount in words */}
              <div className="mt-4 text-[11px] text-slate-700 italic">
                Amount in Words: <span className="font-bold text-slate-900">Rupees {numberToWords(voucher.totalAmount || 0)}</span>
              </div>

              {voucher.narration && (
                <div className="mt-4 text-[11px] text-slate-700 italic">
                  Narration: {voucher.narration}
                </div>
              )}

              {/* Bottom Grid */}
              <div className="flex justify-between mt-12 flex-1">
                {/* Bank Details */}
                <div className="w-[45%]">
                  {!['Receipt', 'Payment'].includes(voucher.type) && (
                  <div className="border border-slate-900 p-3">
                    <h3 className="font-bold text-slate-900 text-[11px] border-b border-slate-900 pb-1 mb-2">Bank Details</h3>
                    <div className="space-y-1 text-[11px] text-slate-800">
                      <div className="flex"><span className="w-20 text-slate-600">Bank Name:</span> <span className="font-bold flex-1">{company.bankName || '_________________'}</span></div>
                      <div className="flex"><span className="w-20 text-slate-600">A/C Name:</span> <span className="font-bold flex-1">{company.name}</span></div>
                      <div className="flex"><span className="w-20 text-slate-600">A/C No:</span> <span className="font-bold flex-1">{company.accountNumber || '_________________'}</span></div>
                      <div className="flex"><span className="w-20 text-slate-600">IFSC Code:</span> <span className="font-bold flex-1">{company.ifscCode || '_________________'}</span></div>
                      <div className="flex"><span className="w-20 text-slate-600">Branch:</span> <span className="font-bold flex-1">{company.branchName || '_________________'}</span></div>
                    </div>
                  </div>
                  )}
                </div>

                {/* Right Side */}
                <div className="w-[45%] flex flex-col">
                  <div className="border border-slate-900 p-3">
                    <h3 className="font-bold text-slate-900 text-[11px] border-b border-slate-900 pb-1 mb-2">Mode/Terms of Payment</h3>
                    <div className="text-[11px] text-slate-800 mt-2 font-bold">
                      {voucher.paymentMode ? voucher.paymentMode : <span className="text-slate-300">_____________________</span>}
                    </div>
                  </div>

                  <div className="mt-auto border-t border-slate-900 pt-2 text-center text-[10px] font-bold text-slate-800 w-48 self-end">
                    Authorised Signatory
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 text-center text-[9px] text-slate-500">
                This is a computer generated document and does not require a physical signature.
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}

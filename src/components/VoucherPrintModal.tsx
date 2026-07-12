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
}


export default function VoucherPrintModal({ isOpen, onClose, voucher, company, party }: VoucherPrintModalProps) {
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

  const doc = <VoucherPDFDocument voucher={voucher} company={company} party={party} />;

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
           <div ref={componentRef} className="bg-white shadow-sm w-full max-w-[21cm] min-h-[29.7cm] p-12 text-[12px] text-slate-800 font-sans mx-auto h-max print:p-8 print:shadow-none">
              <div className="text-center mb-8 border-b border-slate-200 pb-4">
                 <h1 className="text-2xl font-bold uppercase mb-1">{company.name}</h1>
                 {company.address && <p className="text-[10px] text-slate-500">{company.address}</p>}
                 {company.phone && <p className="text-[10px] text-slate-500">Contact: {company.phone}</p>}
                 {company.email && <p className="text-[10px] text-slate-500">Email: {company.email}</p>}
              </div>
              
              <div className="flex justify-between mb-6">
                 <div className="w-1/2">
                    <h2 className="text-lg font-bold mb-3">{voucher.type} Voucher</h2>
                    <div className="space-y-1">
                       <p className="text-[10px] text-slate-500 mb-0.5">Date:</p>
                       <p className="font-bold">{format(new Date(voucher.date), 'dd-MM-yyyy')}</p>
                    </div>
                 </div>
                 <div className="w-1/2 text-right">
                    <p className="text-[10px] text-slate-500 mb-0.5">Party Details:</p>
                    <p className="font-bold mb-1 text-sm">{party ? party.name : 'Unknown'}</p>
                    {party?.address && <p className="text-[10px] mb-0.5">{party.address}</p>}
                    {party?.contactNo && <p className="text-[10px] mb-0.5">Contact: {party.contactNo}</p>}
                    {party?.email && <p className="text-[10px] mb-0.5">Email: {party.email}</p>}
                    {party?.hsnCode && <p className="text-[10px] mb-0.5">HSN/SAC: {party.hsnCode}</p>}
                    {party?.gstin && <p className="text-[10px]">GSTIN: {party.gstin}</p>}
                 </div>
              </div>

              <div className="w-full mt-4">
                 <div className="flex border-t border-b border-slate-900 py-2 font-bold">
                    <div className="flex-1">Particulars</div>
                    <div className="w-32 text-right">Amount (Rs)</div>
                 </div>

                 <div className="flex border-b border-slate-200 py-2">
                    <div className="flex-1">{voucher.itemName || 'Item / Service'}</div>
                    <div className="w-32 text-right">{formatAmt(baseValue)}</div>
                 </div>

                 {cgstAmt > 0 && (
                    <div className="flex border-b border-slate-200 py-2">
                       <div className="flex-1 italic text-slate-500">Add: CGST {(voucher.cgstRate || party?.cgstRate) ? `(@${voucher.cgstRate || party?.cgstRate}%)` : ''}</div>
                       <div className="w-32 text-right">{formatAmt(cgstAmt)}</div>
                    </div>
                 )}
                 {sgstAmt > 0 && (
                    <div className="flex border-b border-slate-200 py-2">
                       <div className="flex-1 italic text-slate-500">Add: SGST {(voucher.sgstRate || party?.sgstRate) ? `(@${voucher.sgstRate || party?.sgstRate}%)` : ''}</div>
                       <div className="w-32 text-right">{formatAmt(sgstAmt)}</div>
                    </div>
                 )}
                 {igstAmt > 0 && (
                    <div className="flex border-b border-slate-200 py-2">
                       <div className="flex-1 italic text-slate-500">Add: IGST {(voucher.igstRate || party?.igstRate) ? `(@${voucher.igstRate || party?.igstRate}%)` : ''}</div>
                       <div className="w-32 text-right">{formatAmt(igstAmt)}</div>
                    </div>
                 )}
                 {unallocatedGstAmt > 0 && (
                    <div className="flex border-b border-slate-200 py-2">
                       <div className="flex-1 italic text-slate-500">Add: GST</div>
                       <div className="w-32 text-right">{formatAmt(unallocatedGstAmt)}</div>
                    </div>
                 )}
                 {(voucher.tdsAmount || 0) > 0 && (
                    <div className="flex border-b border-slate-200 py-2">
                       <div className="flex-1 italic text-slate-500">Less: TDS</div>
                       <div className="w-32 text-right">({formatAmt(voucher.tdsAmount || 0)})</div>
                    </div>
                 )}
              </div>

              <div className="mt-6 flex justify-end">
                 <div className="flex justify-between w-[300px] py-3 border-t-2 border-b-2 border-slate-900 mt-1">
                    <div className="font-bold">Total Net Amount</div>
                    <div className="font-bold text-sm">Rs {formatAmt(voucher.totalAmount || 0)}</div>
                 </div>
              </div>

              {voucher.narration && (
                 <div className="mt-6">
                    <p className="text-[10px] text-slate-500 italic mb-1">Narration:</p>
                    <p className="text-[11px]">{voucher.narration}</p>
                 </div>
              )}

              <div className="mt-20 flex justify-between items-end border-t border-slate-200 pt-4">
                 <div>
                    <p className="text-[9px] text-slate-500">Computer generated document,</p>
                    <p className="text-[9px] text-slate-500">no signature required.</p>
                    <p className="text-[9px] text-slate-500 mt-1">E. & O.E.</p>
                 </div>
                 <div className="w-40 border-t border-slate-300 pt-1 text-center text-[10px]">
                    Authorised Signatory
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}

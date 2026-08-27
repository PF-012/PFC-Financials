import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Voucher, VoucherItem, Ledger } from '../types';
import { format } from 'date-fns';

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

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#000000',
  },
  titleBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  metaBlock: {
    alignItems: 'flex-end',
  },
  metaText: {
    fontSize: 10,
    marginBottom: 2,
  },
  metaBold: {
    fontWeight: 'bold',
  },
  addressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  addressBox: {
    width: '48%',
  },
  addressTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    padding: 4,
    textTransform: 'uppercase',
  },
  entityName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 10,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    backgroundColor: '#f0f0f0',
    padding: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    padding: 6,
  },
  tableRowNoBorder: {
    flexDirection: 'row',
    padding: 6,
  },
  colSl: {
    width: '10%',
    textAlign: 'center',
  },
  colParticulars: {
    flex: 1,
  },
  colAmount: {
    width: '25%',
    textAlign: 'right',
  },
  totalsRowFinal: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    padding: 6,
    backgroundColor: '#f0f0f0',
  },
  amountInWords: {
    marginTop: 5,
    fontSize: 10,
    fontStyle: 'italic',
  },
  amountInWordsBold: {
    fontWeight: 'bold',
  },
  bottomGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    flex: 1,
  },
  bottomBoxLeft: {
    width: '45%',
  },
  bottomBoxRight: {
    width: '45%',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bankDetailsBox: {
    borderWidth: 1,
    borderColor: '#000000',
    padding: 8,
    marginTop: 10,
  },
  bankDetailsTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 2,
  },
  bankRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bankLabel: {
    width: 80,
  },
  bankValue: {
    flex: 1,
    fontWeight: 'bold',
  },
  paymentTermsBox: {
    borderWidth: 1,
    borderColor: '#000000',
    padding: 8,
    marginTop: 10,
    width: '100%',
  },
  signatureBox: {
    marginTop: 50,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 5,
    width: 150,
    textAlign: 'center',
  },
  footerNotice: {
    marginTop: 30,
    fontSize: 8,
    textAlign: 'center',
    color: '#666666',
  }
});

interface VoucherPDFProps {
  voucher: Voucher;
  company: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
    pan?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
  };
  party?: Ledger | null;
  account?: Ledger | null;
}

export const VoucherPDFDocument: React.FC<VoucherPDFProps> = ({ voucher, company, party, account }) => {
  const formatAmt = (amt: number) => amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
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

  const docTitle = voucher.type === 'Sales' ? 'INVOICE' : voucher.type.toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.docTitle}>{docTitle}</Text>
          <View style={styles.metaBlock}>
            <Text style={styles.metaText}>Ref No: <Text style={styles.metaBold}>{voucher.number || 'Auto'}</Text></Text>
            <Text style={styles.metaText}>Date: <Text style={styles.metaBold}>{format(new Date(voucher.date), 'dd-MM-yyyy')}</Text></Text>
          </View>
        </View>

        {/* Address Grid */}
        <View style={styles.addressGrid}>
          {/* Bill To (Left) */}
          <View style={styles.addressBox}>
            <Text style={styles.addressTitle}>
           {voucher.type === 'Receipt' ? 'Received From' : voucher.type === 'Payment' ? 'Paid To' : 'Bill To'}
         </Text>
            <Text style={styles.entityName}>{party ? party.name : 'Cash'}</Text>
            {party?.address && <Text style={styles.addressText}>{party.address}</Text>}
            {party?.contactNo && <Text style={styles.addressText}>Contact: {party.contactNo}</Text>}
            {party?.email && <Text style={styles.addressText}>Email: {party.email}</Text>}
            {party?.gstin && <Text style={styles.addressText}>GSTIN: {party.gstin}</Text>}
          </View>

          {/* From (Right) */}
          <View style={styles.addressBox}>
            <Text style={styles.addressTitle}>
           {voucher.type === 'Receipt' ? 'Received By' : voucher.type === 'Payment' ? 'Paid By' : 'From'}
         </Text>
            <Text style={styles.entityName}>{company.name}</Text>
            {company.address && <Text style={styles.addressText}>{company.address}</Text>}
            {company.phone && <Text style={styles.addressText}>Contact: {company.phone}</Text>}
            {company.email && <Text style={styles.addressText}>Email: {company.email}</Text>}
            {company.gstin && <Text style={styles.addressText}>GSTIN: {company.gstin}</Text>}
            {company.pan && <Text style={styles.addressText}>PAN: {company.pan}</Text>}
          </View>
        </View>

       {/* Particulars Table */}
        {['Receipt', 'Payment'].includes(voucher.type) ? (
          <View style={{ width: '100%', marginTop: 15, borderWidth: 1, borderColor: '#000', backgroundColor: '#f9f9f9', flexDirection: 'column' }}>
            {voucher.itemName && (
              <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#ddd', flexDirection: 'row' }}>
                 <Text style={{ fontWeight: 'bold', fontSize: 12, marginRight: 8 }}>Particulars:</Text>
                 <Text style={{ fontSize: 12 }}>{voucher.itemName}</Text>
              </View>
            )}
            <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 12 }}>Amount {voucher.type === 'Receipt' ? 'Received' : 'Paid'}:</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 14 }}>Rs. {formatAmt(voucher.totalAmount || 0)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colSl}>Sl. No.</Text>
              <Text style={styles.colParticulars}>Description</Text>
              <Text style={styles.colAmount}>Amount (Rs)</Text>
            </View>
            
            <View style={styles.tableRowNoBorder}>
              <Text style={styles.colSl}>1</Text>
              <Text style={styles.colParticulars}>{voucher.itemName || 'Item / Service'}</Text>
              <Text style={styles.colAmount}>{formatAmt(baseValue)}</Text>
            </View>

            {cgstAmt > 0 && ['Sales', 'Purchase'].includes(voucher.type) && (
              <View style={styles.tableRowNoBorder}>
                <Text style={styles.colSl}></Text>
                <Text style={styles.colParticulars}>Add: CGST {(voucher.cgstRate || party?.cgstRate) ? `@${voucher.cgstRate || party?.cgstRate}%` : ''}</Text>
                <Text style={styles.colAmount}>{formatAmt(cgstAmt)}</Text>
              </View>
            )}
            
            {sgstAmt > 0 && ['Sales', 'Purchase'].includes(voucher.type) && (
              <View style={styles.tableRowNoBorder}>
                <Text style={styles.colSl}></Text>
                <Text style={styles.colParticulars}>Add: SGST {(voucher.sgstRate || party?.sgstRate) ? `@${voucher.sgstRate || party?.sgstRate}%` : ''}</Text>
                <Text style={styles.colAmount}>{formatAmt(sgstAmt)}</Text>
              </View>
            )}

            {igstAmt > 0 && ['Sales', 'Purchase'].includes(voucher.type) && (
              <View style={styles.tableRowNoBorder}>
                <Text style={styles.colSl}></Text>
                <Text style={styles.colParticulars}>Add: IGST {(voucher.igstRate || party?.igstRate) ? `@${voucher.igstRate || party?.igstRate}%` : ''}</Text>
                <Text style={styles.colAmount}>{formatAmt(igstAmt)}</Text>
              </View>
            )}

            {unallocatedGstAmt > 0 && ['Sales', 'Purchase'].includes(voucher.type) && (
              <View style={styles.tableRowNoBorder}>
                <Text style={styles.colSl}></Text>
                <Text style={styles.colParticulars}>Add: GST</Text>
                <Text style={styles.colAmount}>{formatAmt(unallocatedGstAmt)}</Text>
              </View>
            )}

            {(voucher.tdsAmount || 0) > 0 && ['Sales', 'Purchase'].includes(voucher.type) && (
              <View style={styles.tableRowNoBorder}>
                <Text style={styles.colSl}></Text>
                <Text style={styles.colParticulars}>Less: TDS</Text>
                <Text style={styles.colAmount}>({formatAmt(voucher.tdsAmount || 0)})</Text>
              </View>
            )}

            {/* Padding for table */}
            <View style={{ height: 20 }}></View>

            <View style={styles.totalsRowFinal}>
              <Text style={styles.colSl}></Text>
              <Text style={[styles.colParticulars, { fontWeight: 'bold' }]}>Total Amount</Text>
              <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>{formatAmt(voucher.totalAmount || 0)}</Text>
            </View>
          </View>
        )}
        
        <Text style={styles.amountInWords}>
          Amount in Words: <Text style={styles.amountInWordsBold}>Rupees {numberToWords(voucher.totalAmount || 0)}</Text>
        </Text>

        {voucher.narration && (
          <Text style={{ marginTop: 10, fontSize: 10, fontStyle: 'italic' }}>Narration: {voucher.narration}</Text>
        )}

        {/* Bottom Section */}
        <View style={styles.bottomGrid}>
          {/* Bank Details */}
          <View style={styles.bottomBoxLeft}>
            {!['Receipt', 'Payment'].includes(voucher.type) && (
            <View style={styles.bankDetailsBox}>
              <Text style={styles.bankDetailsTitle}>Bank Details</Text>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Bank Name:</Text>
                <Text style={styles.bankValue}>{company.bankName || '_________________'}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>A/C Name:</Text>
                <Text style={styles.bankValue}>{company.name}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>A/C No:</Text>
                <Text style={styles.bankValue}>{company.accountNumber || '_________________'}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>IFSC Code:</Text>
                <Text style={styles.bankValue}>{company.ifscCode || '_________________'}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Branch:</Text>
                <Text style={styles.bankValue}>{company.branchName || '_________________'}</Text>
              </View>
            </View>
            )}          </View>
          {/* Right Side: Mode/Terms and Signature */}
          <View style={styles.bottomBoxRight}>
            <View style={styles.paymentTermsBox}>
              <Text style={styles.bankDetailsTitle}>Mode/Terms of Payment</Text>
              <Text style={{ fontSize: 10, marginTop: 4 }}>{voucher.paymentMode ? voucher.paymentMode : '_______________'}</Text>
            </View>

            <View style={{ marginTop: 'auto' }}>
              <Text style={styles.signatureBox}>Authorised Signatory</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerNotice}>This is a computer generated document and does not require a physical signature.</Text>

      </Page>
    </Document>
  );
};

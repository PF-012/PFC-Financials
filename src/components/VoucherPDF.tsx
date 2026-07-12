import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Voucher, VoucherItem, Ledger } from '../types';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  headerInfo: {
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
    textAlign: 'center',
    marginBottom: 30,
    borderBottom: '1 solid #e2e8f0',
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  companyAddress: {
    fontSize: 10,
    color: '#64748b',
  },
  rowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  colLeft: {
    width: '50%',
  },
  colRight: {
    width: '50%',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderTop: '1 solid #0f172a',
    borderBottom: '1 solid #0f172a',
    paddingVertical: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
    paddingVertical: 8,
  },
  colParticulars: {
    flex: 1,
  },
  colAmount: {
    width: 100,
    textAlign: 'right',
  },
  totalsContainer: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
    paddingVertical: 6,
    borderBottom: '1 solid #e2e8f0',
  },
  totalsRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
    paddingVertical: 10,
    borderTop: '2 solid #0f172a',
    borderBottom: '2 solid #0f172a',
    marginTop: 4,
  },
  totalsLabel: {
    color: '#64748b',
  },
  totalsValue: {
    fontWeight: 'bold',
  },
  narrationContainer: {
    marginTop: 20,
  },
  narrationLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  narrationText: {
    fontSize: 11,
  },
  footer: {
    marginTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 9,
    color: '#64748b',
  },
  signatureBox: {
    width: 150,
    borderTop: '1 solid #cbd5e1',
    paddingTop: 5,
    textAlign: 'center',
    fontSize: 10,
  },
});

interface VoucherPDFProps {
  voucher: Voucher;
  company: { name: string; address?: string; phone?: string; email?: string; };
  party?: Ledger;
}

export const VoucherPDFDocument: React.FC<VoucherPDFProps> = ({ voucher, company, party }) => {
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
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          
          <View style={styles.headerInfo}>
            <Text style={styles.companyName}>{company.name}</Text>
            {company.address && <Text style={styles.companyAddress}>{company.address}</Text>}
            {company.phone && <Text style={styles.companyAddress}>Contact: {company.phone}</Text>}
            {company.email && <Text style={styles.companyAddress}>Email: {company.email}</Text>}
          </View>
        </View>

        <View style={styles.rowInfo}>
          <View style={styles.colLeft}>
            <Text style={[styles.value, { fontSize: 14 }]}>{voucher.type} Voucher</Text>
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{format(new Date(voucher.date), 'dd-MM-yyyy')}</Text>
            </View>
          </View>
          <View style={styles.colRight}>
            <Text style={styles.label}>Party Details:</Text>
            <Text style={styles.value}>{party ? party.name : 'Unknown'}</Text>
            {party && party.address && <Text style={{ fontSize: 10, marginBottom: 2 }}>{party.address}</Text>}
            {party && party.contactNo && <Text style={{ fontSize: 10, marginBottom: 2 }}>Contact: {party.contactNo}</Text>}
            {party && party.email && <Text style={{ fontSize: 10, marginBottom: 2 }}>Email: {party.email}</Text>}
            {party && party.hsnCode && <Text style={{ fontSize: 10, marginBottom: 2 }}>HSN/SAC: {party.hsnCode}</Text>}
            {party && party.gstin && <Text style={{ fontSize: 10, marginBottom: 2 }}>GSTIN: {party.gstin}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colParticulars}>Particulars</Text>
            <Text style={styles.colAmount}>Amount (Rs)</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.colParticulars}>{voucher.itemName || 'Item / Service'}</Text>
            <Text style={styles.colAmount}>{formatAmt(baseValue)}</Text>
          </View>

          {cgstAmt > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.colParticulars, { fontStyle: 'italic', color: '#64748b' }]}>Add: CGST {(voucher.cgstRate || party?.cgstRate) ? `(@${voucher.cgstRate || party?.cgstRate}%)` : ''}</Text>
              <Text style={styles.colAmount}>{formatAmt(cgstAmt)}</Text>
            </View>
          )}
          
          {sgstAmt > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.colParticulars, { fontStyle: 'italic', color: '#64748b' }]}>Add: SGST {(voucher.sgstRate || party?.sgstRate) ? `(@${voucher.sgstRate || party?.sgstRate}%)` : ''}</Text>
              <Text style={styles.colAmount}>{formatAmt(sgstAmt)}</Text>
            </View>
          )}

          {igstAmt > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.colParticulars, { fontStyle: 'italic', color: '#64748b' }]}>Add: IGST {(voucher.igstRate || party?.igstRate) ? `(@${voucher.igstRate || party?.igstRate}%)` : ''}</Text>
              <Text style={styles.colAmount}>{formatAmt(igstAmt)}</Text>
            </View>
          )}

          {unallocatedGstAmt > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.colParticulars, { fontStyle: 'italic', color: '#64748b' }]}>Add: GST</Text>
              <Text style={styles.colAmount}>{formatAmt(unallocatedGstAmt)}</Text>
            </View>
          )}

          {(voucher.tdsAmount || 0) > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.colParticulars, { fontStyle: 'italic', color: '#64748b' }]}>Less: TDS</Text>
              <Text style={styles.colAmount}>({formatAmt(voucher.tdsAmount || 0)})</Text>
            </View>
          )}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.totalsRowFinal}>
            <Text style={{ fontWeight: 'bold' }}>Total Net Amount</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 14 }}>Rs {formatAmt(voucher.totalAmount || 0)}</Text>
          </View>
        </View>

        {voucher.narration && (
          <View style={styles.narrationContainer}>
            <Text style={styles.narrationLabel}>Narration:</Text>
            <Text style={styles.narrationText}>{voucher.narration}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerText}>Computer generated document,</Text>
            <Text style={styles.footerText}>no signature required.</Text>
            <Text style={[styles.footerText, { marginTop: 4 }]}>E. & O.E.</Text>
          </View>
          <View>
            <Text style={styles.signatureBox}>Authorised Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

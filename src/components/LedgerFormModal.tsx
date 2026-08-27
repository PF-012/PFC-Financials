import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, setDoc } from '../lib/firebase';
import { db } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { AccountingClassification, Ledger } from '../types';

interface LedgerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerId?: string | null;
  onSave?: (ledger: Ledger) => void;
}

const classifications: AccountingClassification[] = [
  'Revenue', 'COGS', 'Operating Expense', 'Other Income', 'Finance Cost',
  'Tax Expense', 'Depreciation', 'Inventory', 'Trade Receivable',
  'Trade Payable', 'Cash & Bank', 'Fixed Asset', 'Loan / Debt',
  'Equity / Retained Earnings', 'Other Asset', 'Other Liability', 'Unknown'
];

const groups = [
  'Capital Account', 'Current Assets', 'Cash-in-Hand', 'Bank Accounts',
  'Direct Expenses', 'Direct Incomes', 'Current Liabilities', 'Fixed Assets',
  'Indirect Expenses', 'Indirect Incomes', 'Purchase Accounts', 'Sales Accounts',
  'Sundry Creditors', 'Sundry Debtors', 'Duties & Taxes'
];

const emptyForm = {
  name: '', group: 'Sundry Debtors', openingBalance: 0,
  cashFlowCategory: '', accountingClassification: '', address: '', email: '',
  hsnCode: '', gstin: '', contactNo: '', registrationType: 'Regular',
  gstType: 'CGST/SGST', cgstRate: 0, sgstRate: 0, igstRate: 0
};

type FormState = typeof emptyForm;

export default function LedgerFormModal({ isOpen, onClose, ledgerId, onSave }: LedgerFormModalProps) {
  const { activeCompany } = useAppContext();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!isOpen) return;
    if (!ledgerId) {
      setForm(emptyForm);
      return;
    }
    setLoading(true);
    getDoc(doc(db, 'ledgers', ledgerId))
      .then((snapshot) => {
        if (!cancelled && snapshot.exists()) {
          const data = snapshot.data() as Partial<Ledger>;
          setForm({ ...emptyForm, ...data, cashFlowCategory: data.cashFlowCategory || '', accountingClassification: data.accountingClassification || '' } as FormState);
        }
      })
      .catch((error) => console.error('Failed to load ledger:', error))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, ledgerId]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeCompany || !user || saving) return;
    if (activeCompany.isBanned && user.email !== 'mndl.yuvi@gmail.com') {
      alert('Your account has been banned. Please contact support.');
      return;
    }
    setSaving(true);
    try {
      const reference = ledgerId ? doc(db, 'ledgers', ledgerId) : doc(collection(db, 'ledgers'));
      const ledger: Ledger = {
        id: reference.id,
        companyId: activeCompany.id,
        name: form.name.trim(),
        group: form.group,
        openingBalance: Number(form.openingBalance) || 0,
        ...(form.cashFlowCategory ? { cashFlowCategory: form.cashFlowCategory as Ledger['cashFlowCategory'] } : {}),
        ...(form.accountingClassification ? { accountingClassification: form.accountingClassification as AccountingClassification } : {}),
        address: form.address,
        email: form.email,
        hsnCode: form.hsnCode,
        gstin: form.gstin,
        contactNo: form.contactNo,
        registrationType: form.registrationType,
        gstType: form.gstType,
        cgstRate: Number(form.cgstRate) || 0,
        sgstRate: Number(form.sgstRate) || 0,
        igstRate: Number(form.igstRate) || 0,
      };
      await setDoc(reference, { ...ledger, userId: user.id }, { merge: true });
      onSave?.(ledger);
      onClose();
    } catch (error) {
      console.error('Failed to save ledger:', error);
      alert('Unable to save ledger. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">{ledgerId ? 'Edit Ledger' : 'New Ledger'}</h2>
          <button type="button" onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700" aria-label="Close">&times;</button>
        </div>

        {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : (
          <form id="ledger-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div><label className="block text-sm font-medium text-gray-700">Ledger Name *</label><input required value={form.name} onChange={(e) => update('name', e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 sm:text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Under Group *</label><select required value={form.group} onChange={(e) => update('group', e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 sm:text-sm">{groups.map((group) => <option key={group} value={group}>{group}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700">Opening Balance</label><input type="number" step="0.01" value={form.openingBalance} onChange={(e) => update('openingBalance', Number(e.target.value))} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 sm:text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700">CFO Cash Flow Classification</label><select value={form.cashFlowCategory} onChange={(e) => update('cashFlowCategory', e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 sm:text-sm"><option value="">Auto-detect from ledger</option>{['Operating','Other','Investing','Financing'].map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Financial Statement Classification</label><select value={form.accountingClassification} onChange={(e) => update('accountingClassification', e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 sm:text-sm"><option value="">Auto-detect from group/name</option>{classifications.map((item) => <option key={item} value={item}>{item}</option>)}</select><p className="mt-1 text-xs text-gray-500">Controls how this ledger is interpreted in FRFSA P&amp;L, Balance Sheet and Cash Flow calculations.</p></div>
            </div>
          </form>
        )}

        <div className="flex shrink-0 justify-end gap-3 border-t bg-gray-50 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700">Cancel</button>
          <button type="submit" form="ledger-form" disabled={saving || loading} className="rounded-md bg-blue-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving...' : 'Save Ledger'}</button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { CompanySettings } from '../types';

export default function Settings() {
  const { activeCompany, setActiveCompany } = useAppContext();
  const { user } = useAuth();
  
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CompanySettings>({
    voucherNumbering: 'auto',
    enableGst: false,
    enableTds: false,
    enableDebitNote: false,
    enableCreditNote: false,
    enableSalesOrder: false,
    enablePurchaseOrder: false
  });

  useEffect(() => {
    if (activeCompany) {
      setSettings(activeCompany.settings || {
        voucherNumbering: 'auto',
        enableGst: false,
        enableTds: false,
        enableDebitNote: false,
        enableCreditNote: false,
        enableSalesOrder: false,
        enablePurchaseOrder: false
      });
    }
  }, [activeCompany]);

  const handleSave = async () => {
    if (!activeCompany || !user) return;
    
    if (activeCompany.isBanned && user.email !== 'mndl.yuvi@gmail.com') {
      alert("Your account has been banned. Please contact support.");
      return;
    }
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'companies', activeCompany.id), {
        settings
      });
      setActiveCompany({ ...activeCompany, settings });
      alert("Settings saved successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!activeCompany) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
         <SettingsIcon className="w-6 h-6 text-blue-900" />
         <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
           <h3 className="text-lg font-medium text-gray-900">Preferences for {activeCompany.name}</h3>
        </div>
        <div className="p-6 space-y-6">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Voucher Numbering</label>
              <div className="flex gap-4">
                 <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="radio" checked={settings.voucherNumbering === 'auto'} onChange={() => setSettings({...settings, voucherNumbering: 'auto'})} className="text-blue-600 focus:ring-blue-500" />
                    Automatic
                 </label>
                 <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="radio" checked={settings.voucherNumbering === 'manual'} onChange={() => setSettings({...settings, voucherNumbering: 'manual'})} className="text-blue-600 focus:ring-blue-500" />
                    Manual
                 </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">If set to manual, you can enter the voucher number yourself when creating a voucher.</p>
           </div>
           
           <div className="border-t border-gray-100 pt-6">
              <label className="flex items-center gap-3">
                 <input type="checkbox" checked={settings.enableGst} onChange={e => setSettings({...settings, enableGst: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                 <span className="text-sm font-medium text-gray-900">Enable GST Features</span>
              </label>
              <p className="mt-1 pl-7 text-xs text-gray-500">Show GST fields (CGST, SGST, IGST) in ledgers and vouchers.</p>
           </div>

           <div className="border-t border-gray-100 pt-6">
              <label className="flex items-center gap-3">
                 <input type="checkbox" checked={settings.enableTds} onChange={e => setSettings({...settings, enableTds: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                 <span className="text-sm font-medium text-gray-900">Enable TDS Features</span>
              </label>
              <p className="mt-1 pl-7 text-xs text-gray-500">Show TDS fields when recording payments or invoices.</p>
           </div>

           <div className="border-t border-gray-100 pt-6">
              <label className="flex items-center gap-3">
                 <input type="checkbox" checked={settings.enableDebitNote} onChange={e => setSettings({...settings, enableDebitNote: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                 <span className="text-sm font-medium text-gray-900">Enable Debit Note</span>
              </label>
              <p className="mt-1 pl-7 text-xs text-gray-500">Allow creation of Debit Notes (Purchase Returns etc).</p>
           </div>

           <div className="border-t border-gray-100 pt-6">
              <label className="flex items-center gap-3">
                 <input type="checkbox" checked={settings.enableCreditNote} onChange={e => setSettings({...settings, enableCreditNote: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                 <span className="text-sm font-medium text-gray-900">Enable Credit Note</span>
              </label>
              <p className="mt-1 pl-7 text-xs text-gray-500">Allow creation of Credit Notes (Sales Returns etc).</p>
           </div>

           <div className="border-t border-gray-100 pt-6">
              <label className="flex items-center gap-3">
                 <input type="checkbox" checked={settings.enableSalesOrder} onChange={e => setSettings({...settings, enableSalesOrder: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                 <span className="text-sm font-medium text-gray-900">Enable Sales Order</span>
              </label>
              <p className="mt-1 pl-7 text-xs text-gray-500">Allow creation of Sales Orders.</p>
           </div>

           <div className="border-t border-gray-100 pt-6">
              <label className="flex items-center gap-3">
                 <input type="checkbox" checked={settings.enablePurchaseOrder} onChange={e => setSettings({...settings, enablePurchaseOrder: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                 <span className="text-sm font-medium text-gray-900">Enable Purchase Order</span>
              </label>
              <p className="mt-1 pl-7 text-xs text-gray-500">Allow creation of Purchase Orders.</p>
           </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
           <button 
             onClick={handleSave} 
             disabled={saving}
             className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors"
           >
             <Save className="w-4 h-4" />
             {saving ? 'Saving...' : 'Save Settings'}
           </button>
        </div>
      </div>
    </div>
  );
}

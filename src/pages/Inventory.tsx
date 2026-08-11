import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs } from '../lib/firebase';
import { InvLocation, InvUnit, InvGroup, InvItem, InvBatch, InvTransaction } from '../types';
import { Package, MapPin, CalendarDays, Clock, Layers, Scale, History, Plus, Edit, Trash2, TrendingUp, AlertTriangle, FileText, ArrowRightLeft, Info, X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Inventory() {
  const { activeCompany } = useAppContext();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showGuide, setShowGuide] = useState(false);

  if (!activeCompany) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200 m-6">
        <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Company Selected</h3>
        <p>Please create and select a Company in the <a href="/companies" className="text-blue-600 hover:underline">Companies tab</a> before managing inventory.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6" /> Inventory Management
        </h1>
        <button onClick={() => setShowGuide(true)} className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full font-medium">
          <Info className="w-4 h-4" /> How to use
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'units', icon: <Scale className="w-4 h-4" />, label: '(1) Units' },
          { id: 'locations', icon: <MapPin className="w-4 h-4" />, label: '(1) Locations' },
          { id: 'groups', icon: <Layers className="w-4 h-4" />, label: '(1) Groups' },
          { id: 'items', icon: <Package className="w-4 h-4" />, label: '(2) Items' },
          { id: 'transactions', icon: <ArrowRightLeft className="w-4 h-4" />, label: '(3) Stock Transactions' },
          { id: 'batches', icon: <CalendarDays className="w-4 h-4" />, label: '(4) Batches & Aging' },
          { id: 'dashboard', icon: <TrendingUp className="w-4 h-4" />, label: '(5) Dashboard & Reports' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[500px]">
        {activeTab === 'dashboard' && <InventoryDashboard activeCompany={activeCompany} user={user} />}
        {activeTab === 'transactions' && <InventoryTransactions activeCompany={activeCompany} user={user} />}
        {activeTab === 'items' && <InventoryItems activeCompany={activeCompany} user={user} />}
        {activeTab === 'groups' && <InventoryGroups activeCompany={activeCompany} user={user} />}
        {activeTab === 'units' && <InventoryUnits activeCompany={activeCompany} user={user} />}
        {activeTab === 'locations' && <InventoryLocations activeCompany={activeCompany} user={user} />}
        {activeTab === 'batches' && <InventoryBatches activeCompany={activeCompany} user={user} />}
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Info className="w-5 h-5 text-blue-600"/> Inventory Guide</h3>
              <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex gap-3"><div className="bg-blue-100 text-blue-800 font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0">1</div><div><strong>Setup Masters:</strong> Start by creating <em>Units</em> (e.g., Kg, Pcs), <em>Locations/Godowns</em>, and <em>Groups</em> to categorize your stock.</div></div>
              <div className="flex gap-3"><div className="bg-blue-100 text-blue-800 font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0">2</div><div><strong>Create Items:</strong> Go to the <em>Items</em> tab to add your products. Link them to the units and groups created in step 1. Enable batch tracking if needed.</div></div>
              <div className="flex gap-3"><div className="bg-blue-100 text-blue-800 font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0">3</div><div><strong>Record Transactions:</strong> Use the <em>Stock Transactions</em> tab to log stock IN (Purchases/Additions), OUT (Sales/Deductions), or TRANSFERs between locations.</div></div>
              <div className="flex gap-3"><div className="bg-blue-100 text-blue-800 font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0">4</div><div><strong>Monitor & Analyze:</strong> Check the <em>Dashboard & Reports</em> for real-time stock valuation, low stock alerts, and top moving items. Manage expiries in the <em>Batches</em> tab.</div></div>
            </div>
            <div className="mt-6 text-right"><button onClick={() => setShowGuide(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded font-medium">Got it</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function useInventoryData(activeCompany: any, collectionName: string) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    if (!activeCompany?.id) return;
    const q = query(collection(db, collectionName), where('companyId', '==', activeCompany.id));
    return onSnapshot(q, (snap: any) => {
      setData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    });
  }, [activeCompany?.id, collectionName]);
  return data;
}

function InventoryLocations({ activeCompany }: { activeCompany: any, user: any }) {
  const locations = useInventoryData(activeCompany, 'inv_locations');
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingLoc, setEditingLoc] = useState<InvLocation | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', isDefault: false });

  const handleSave = async () => {
    try {
      if (editingLoc) await updateDoc(doc(db, 'inv_locations', editingLoc.id), formData);
      else await addDoc(collection(db, 'inv_locations'), { ...formData, companyId: activeCompany.id });
      setShowModal(false);
    } catch (err: any) { console.error('Inventory location save failed:', err); alert('Unable to save location: ' + (err?.message || 'Unknown error')); }
  };

  const handleDelete = (id: string) => setDeleteConfirm(id);
  const confirmDelete = async () => { if (deleteConfirm) { try { await deleteDoc(doc(db, 'inv_locations', deleteConfirm)); } catch (err: any) { console.error(err); alert('Error deleting: ' + err.message); } finally { setDeleteConfirm(null); } } };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-medium">Locations / Godowns</h2><button onClick={() => { setEditingLoc(null); setFormData({ name: '', address: '', isDefault: false }); setShowModal(true); }} className="bg-blue-900 text-white px-3 py-1.5 rounded flex items-center gap-1"><Plus className="w-4 h-4"/> Add Location</button></div>
      <table className="w-full text-left border-collapse"><thead><tr className="bg-gray-50 border-b"><th className="p-2">Name</th><th className="p-2">Address</th><th className="p-2">Actions</th></tr></thead><tbody>{locations.map(loc => (<tr key={loc.id} className="border-b"><td className="p-2">{loc.name} {loc.isDefault && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded ml-1">Default</span>}</td><td className="p-2">{loc.address}</td><td className="p-2 flex gap-2"><button onClick={() => { setEditingLoc(loc); setFormData({ name: loc.name, address: loc.address || '', isDefault: !!loc.isDefault }); setShowModal(true); }} className="text-blue-600"><Edit className="w-4 h-4"/></button><button onClick={() => handleDelete(loc.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></button></td></tr>))}</tbody></table>
      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h3 className="text-lg font-bold mb-4">{editingLoc ? 'Edit' : 'Add'} Location</h3><div className="space-y-3"><div><label className="block text-sm">Name</label><input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div><div><label className="block text-sm">Address</label><input className="w-full border p-2 rounded" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div><div className="flex items-center gap-2"><input type="checkbox" checked={formData.isDefault} onChange={e => setFormData({...formData, isDefault: e.target.checked})} /> <label>Default Location</label></div></div><div className="flex justify-end gap-2 mt-6"><button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button><button onClick={handleSave} className="px-4 py-2 bg-blue-900 text-white rounded">Save</button></div></div></div>}
      <ConfirmModal isOpen={!!deleteConfirm} title="Delete Location" message="Are you sure you want to delete this location? This action cannot be undone." onConfirm={confirmDelete} onCancel={() => setDeleteConfirm(null)} />
    </div>
  );
}

function InventoryUnits({ activeCompany }: { activeCompany: any, user: any }) {
  const units = useInventoryData(activeCompany, 'inv_units');
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<InvUnit | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', symbol: '' });

  const handleSave = async () => {
    try {
      if (editingUnit) await updateDoc(doc(db, 'inv_units', editingUnit.id), formData);
      else await addDoc(collection(db, 'inv_units'), { ...formData, companyId: activeCompany.id });
      setShowModal(false);
    } catch (err: any) { console.error('Inventory unit save failed:', err); alert('Unable to save unit: ' + (err?.message || 'Unknown error')); }
  };

  const handleDelete = (id: string) => setDeleteConfirm(id);
  const confirmDelete = async () => { if (deleteConfirm) { try { await deleteDoc(doc(db, 'inv_units', deleteConfirm)); } catch (err: any) { console.error(err); alert('Error deleting: ' + err.message); } finally { setDeleteConfirm(null); } } };

  return (
    <div className="p-4"><div className="flex justify-between items-center mb-4"><h2 className="text-lg font-medium">Units of Measure</h2><button onClick={() => { setEditingUnit(null); setFormData({ name: '', symbol: '' }); setShowModal(true); }} className="bg-blue-900 text-white px-3 py-1.5 rounded flex items-center gap-1"><Plus className="w-4 h-4"/> Add Unit</button></div><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-50 border-b"><th className="p-2">Name</th><th className="p-2">Symbol</th><th className="p-2">Actions</th></tr></thead><tbody>{units.map(u => (<tr key={u.id} className="border-b"><td className="p-2">{u.name}</td><td className="p-2">{u.symbol}</td><td className="p-2 flex gap-2"><button onClick={() => { setEditingUnit(u); setFormData({ name: u.name, symbol: u.symbol }); setShowModal(true); }} className="text-blue-600"><Edit className="w-4 h-4"/></button><button onClick={() => handleDelete(u.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></button></td></tr>))}</tbody></table>{showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h3 className="text-lg font-bold mb-4">{editingUnit ? 'Edit' : 'Add'} Unit</h3><div className="space-y-3"><div><label className="block text-sm">Name (e.g. Kilograms)</label><input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div><div><label className="block text-sm">Symbol (e.g. kg)</label><input className="w-full border p-2 rounded" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} /></div></div><div className="flex justify-end gap-2 mt-6"><button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button><button onClick={handleSave} className="px-4 py-2 bg-blue-900 text-white rounded">Save</button></div></div></div>}<ConfirmModal isOpen={!!deleteConfirm} title="Delete Unit" message="Are you sure you want to delete this unit? This action cannot be undone." onConfirm={confirmDelete} onCancel={() => setDeleteConfirm(null)} /></div>
  );
}

function InventoryGroups({ activeCompany }: { activeCompany: any, user: any }) {
  const groups = useInventoryData(activeCompany, 'inv_groups');
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<InvGroup | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', parentId: '' });

  const handleSave = async () => {
    const name = formData.name.trim();
    if (!name) {
      alert('Group name is required.');
      return;
    }

    // inv_groups.parentId is a PostgreSQL UUID and is nullable. The empty
    // string used by the form for "None (Primary)" is NOT a valid UUID.
    // Convert it to null before sending it to Supabase.
    const payload = {
      name,
      parentId: formData.parentId || null,
    };

    try {
      if (editingGroup) {
        await updateDoc(doc(db, 'inv_groups', editingGroup.id), payload);
      } else {
        await addDoc(collection(db, 'inv_groups'), {
          ...payload,
          companyId: activeCompany.id,
        });
      }
      setShowModal(false);
      setEditingGroup(null);
      setFormData({ name: '', parentId: '' });
    } catch (err: any) {
      console.error('Inventory group save failed:', err);
      alert('Unable to save group: ' + (err?.message || 'Unknown database error'));
    }
  };

  const handleDelete = (id: string) => setDeleteConfirm(id);
  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteDoc(doc(db, 'inv_groups', deleteConfirm));
      } catch (err: any) {
        console.error(err);
        alert('Error deleting: ' + err.message);
      } finally {
        setDeleteConfirm(null);
      }
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Stock Groups</h2>
        <button onClick={() => { setEditingGroup(null); setFormData({ name: '', parentId: '' }); setShowModal(true); }} className="bg-blue-900 text-white px-3 py-1.5 rounded flex items-center gap-1"><Plus className="w-4 h-4"/> Add Group</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead><tr className="bg-gray-50 border-b"><th className="p-2">Name</th><th className="p-2">Parent Group</th><th className="p-2">Actions</th></tr></thead>
        <tbody>
          {groups.map(g => (
            <tr key={g.id} className="border-b">
              <td className="p-2">{g.name}</td><td className="p-2">{groups.find(p => p.id === g.parentId)?.name || '-'}</td>
              <td className="p-2 flex gap-2">
                <button onClick={() => { setEditingGroup(g); setFormData({ name: g.name, parentId: g.parentId || '' }); setShowModal(true); }} className="text-blue-600"><Edit className="w-4 h-4"/></button>
                <button onClick={() => handleDelete(g.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">{editingGroup ? 'Edit' : 'Add'} Group</h3>
            <div className="space-y-3">
              <div><label className="block text-sm">Name</label><input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div>
                <label className="block text-sm">Parent Group</label>
                <select className="w-full border p-2 rounded" value={formData.parentId} onChange={e => setFormData({...formData, parentId: e.target.value})}>
                  <option value="">None (Primary)</option>
                  {groups.filter(g => g.id !== editingGroup?.id).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-900 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal isOpen={!!deleteConfirm} title="Delete Group" message="Are you sure you want to delete this group? This action cannot be undone." onConfirm={confirmDelete} onCancel={() => setDeleteConfirm(null)} />
    </div>
  );
}

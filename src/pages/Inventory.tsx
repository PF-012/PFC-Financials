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
              <div className="flex gap-3">
                <div className="bg-blue-100 text-blue-800 font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0">1</div>
                <div><strong>Setup Masters:</strong> Start by creating <em>Units</em> (e.g., Kg, Pcs), <em>Locations/Godowns</em>, and <em>Groups</em> to categorize your stock.</div>
              </div>
              <div className="flex gap-3">
                <div className="bg-blue-100 text-blue-800 font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0">2</div>
                <div><strong>Create Items:</strong> Go to the <em>Items</em> tab to add your products. Link them to the units and groups created in step 1. Enable batch tracking if needed.</div>
              </div>
              <div className="flex gap-3">
                <div className="bg-blue-100 text-blue-800 font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0">3</div>
                <div><strong>Record Transactions:</strong> Use the <em>Stock Transactions</em> tab to log stock IN (Purchases/Additions), OUT (Sales/Deductions), or TRANSFERs between locations.</div>
              </div>
              <div className="flex gap-3">
                <div className="bg-blue-100 text-blue-800 font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0">4</div>
                <div><strong>Monitor & Analyze:</strong> Check the <em>Dashboard & Reports</em> for real-time stock valuation, low stock alerts, and top moving items. Manage expiries in the <em>Batches</em> tab.</div>
              </div>
            </div>
            <div className="mt-6 text-right">
              <button onClick={() => setShowGuide(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded font-medium">Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Subcomponents will go here...

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
    if (editingLoc) {
      await updateDoc(doc(db, 'inv_locations', editingLoc.id), formData);
    } else {
      await addDoc(collection(db, 'inv_locations'), { ...formData, companyId: activeCompany.id });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => setDeleteConfirm(id);
  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteDoc(doc(db, 'inv_locations', deleteConfirm));
      } catch (err) {
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
        <h2 className="text-lg font-medium">Locations / Godowns</h2>
        <button onClick={() => { setEditingLoc(null); setFormData({ name: '', address: '', isDefault: false }); setShowModal(true); }} className="bg-blue-900 text-white px-3 py-1.5 rounded flex items-center gap-1"><Plus className="w-4 h-4"/> Add Location</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead><tr className="bg-gray-50 border-b"><th className="p-2">Name</th><th className="p-2">Address</th><th className="p-2">Actions</th></tr></thead>
        <tbody>
          {locations.map(loc => (
            <tr key={loc.id} className="border-b">
              <td className="p-2">{loc.name} {loc.isDefault && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded ml-1">Default</span>}</td>
              <td className="p-2">{loc.address}</td>
              <td className="p-2 flex gap-2">
                <button onClick={() => { setEditingLoc(loc); setFormData(loc); setShowModal(true); }} className="text-blue-600"><Edit className="w-4 h-4"/></button>
                <button onClick={() => handleDelete(loc.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">{editingLoc ? 'Edit' : 'Add'} Location</h3>
            <div className="space-y-3">
              <div><label className="block text-sm">Name</label><input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block text-sm">Address</label><input className="w-full border p-2 rounded" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={formData.isDefault} onChange={e => setFormData({...formData, isDefault: e.target.checked})} /> <label>Default Location</label></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-900 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Location"
        message="Are you sure you want to delete this location? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
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
    if (editingUnit) {
      await updateDoc(doc(db, 'inv_units', editingUnit.id), formData);
    } else {
      await addDoc(collection(db, 'inv_units'), { ...formData, companyId: activeCompany.id });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => setDeleteConfirm(id);
  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteDoc(doc(db, 'inv_units', deleteConfirm));
      } catch (err) {
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
        <h2 className="text-lg font-medium">Units of Measure</h2>
        <button onClick={() => { setEditingUnit(null); setFormData({ name: '', symbol: '' }); setShowModal(true); }} className="bg-blue-900 text-white px-3 py-1.5 rounded flex items-center gap-1"><Plus className="w-4 h-4"/> Add Unit</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead><tr className="bg-gray-50 border-b"><th className="p-2">Name</th><th className="p-2">Symbol</th><th className="p-2">Actions</th></tr></thead>
        <tbody>
          {units.map(u => (
            <tr key={u.id} className="border-b">
              <td className="p-2">{u.name}</td><td className="p-2">{u.symbol}</td>
              <td className="p-2 flex gap-2">
                <button onClick={() => { setEditingUnit(u); setFormData(u); setShowModal(true); }} className="text-blue-600"><Edit className="w-4 h-4"/></button>
                <button onClick={() => handleDelete(u.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">{editingUnit ? 'Edit' : 'Add'} Unit</h3>
            <div className="space-y-3">
              <div><label className="block text-sm">Name (e.g. Kilograms)</label><input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block text-sm">Symbol (e.g. kg)</label><input className="w-full border p-2 rounded" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-900 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Unit"
        message="Are you sure you want to delete this unit? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

function InventoryGroups({ activeCompany }: { activeCompany: any, user: any }) {
  const groups = useInventoryData(activeCompany, 'inv_groups');
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<InvGroup | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', parentId: '' });

  const handleSave = async () => {
    if (editingGroup) {
      await updateDoc(doc(db, 'inv_groups', editingGroup.id), formData);
    } else {
      await addDoc(collection(db, 'inv_groups'), { ...formData, companyId: activeCompany.id });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => setDeleteConfirm(id);
  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteDoc(doc(db, 'inv_groups', deleteConfirm));
      } catch (err) {
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
              <button onClick={handleSave} className="px-4 py-2 bg-blue-900 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Group"
        message="Are you sure you want to delete this group? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

function InventoryItems({ activeCompany }: { activeCompany: any, user: any }) {
  const items = useInventoryData(activeCompany, 'inv_items');
  const groups = useInventoryData(activeCompany, 'inv_groups');
  const units = useInventoryData(activeCompany, 'inv_units');
  const transactions = useInventoryData(activeCompany, 'inv_transactions');

  // Calculate stock purely for display in Items list
  const stockBalances = React.useMemo(() => {
    const balances: Record<string, number> = {};
    items.forEach(i => balances[i.id] = 0);
    transactions.forEach(t => {
      if (balances[t.itemId] === undefined) return;
      if (t.type === 'IN') balances[t.itemId] += Number(t.quantity);
      if (t.type === 'OUT') balances[t.itemId] -= Number(t.quantity);
    });
    return balances;
  }, [items, transactions]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InvItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const initialForm = { name: '', sku: '', groupId: '', unitId: '', description: '', minStockLevel: 0, isBatchTracking: false, purchasePrice: 0, salesPrice: 0, hsnCode: '', taxRate: 0 };
  const [formData, setFormData] = useState<any>(initialForm);

  const handleSave = async () => {
    if(!formData.unitId) return alert('Unit is required');
    if (editingItem) {
      await updateDoc(doc(db, 'inv_items', editingItem.id), formData);
    } else {
      await addDoc(collection(db, 'inv_items'), { ...formData, companyId: activeCompany.id });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => setDeleteConfirm(id);
  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteDoc(doc(db, 'inv_items', deleteConfirm));
      } catch (err) {
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
        <h2 className="text-lg font-medium">Stock Items</h2>
        <button onClick={() => { setEditingItem(null); setFormData(initialForm); setShowModal(true); }} className="bg-blue-900 text-white px-3 py-1.5 rounded flex items-center gap-1"><Plus className="w-4 h-4"/> Add Item</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead><tr className="bg-gray-50 border-b"><th className="p-2">Name / SKU</th><th className="p-2">Group</th><th className="p-2">Prices</th><th className="p-2 text-right">Current Stock</th><th className="p-2">Actions</th></tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id} className="border-b">
              <td className="p-2">
                <div className="font-medium">{i.name}</div>
                <div className="text-xs text-gray-500">{i.sku} | {units.find(u => u.id === i.unitId)?.symbol}</div>
              </td>
              <td className="p-2">{groups.find(g => g.id === i.groupId)?.name || '-'}</td>
              <td className="p-2 text-sm text-gray-600">
                P: ₹{i.purchasePrice}<br/>S: ₹{i.salesPrice}
              </td>
              <td className="p-2 text-right font-medium">
                {stockBalances[i.id] || 0} {units.find(u => u.id === i.unitId)?.symbol}
              </td>
              <td className="p-2">
                <div className="flex gap-2">
                  <button onClick={() => { setEditingItem(i); setFormData(i); setShowModal(true); }} className="text-blue-600"><Edit className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(i.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingItem ? 'Edit' : 'Add'} Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm">Name</label><input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block text-sm">SKU / Code</label><input className="w-full border p-2 rounded" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} /></div>
              <div>
                <label className="block text-sm">Group</label>
                <select className="w-full border p-2 rounded" value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value})}>
                  <option value="">Primary</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm">Unit <span className="text-red-500">*</span></label>
                <select className="w-full border p-2 rounded" value={formData.unitId} onChange={e => setFormData({...formData, unitId: e.target.value})} required>
                  <option value="">Select Unit</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                </select>
              </div>
              <div><label className="block text-sm">Purchase Price</label><input type="number" className="w-full border p-2 rounded" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} /></div>
              <div><label className="block text-sm">Sales Price</label><input type="number" className="w-full border p-2 rounded" value={formData.salesPrice} onChange={e => setFormData({...formData, salesPrice: Number(e.target.value)})} /></div>
              <div><label className="block text-sm">HSN/SAC Code</label><input className="w-full border p-2 rounded" value={formData.hsnCode} onChange={e => setFormData({...formData, hsnCode: e.target.value})} /></div>
              <div><label className="block text-sm">Tax Rate (%)</label><input type="number" className="w-full border p-2 rounded" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})} /></div>
              <div><label className="block text-sm">Min Stock Level</label><input type="number" className="w-full border p-2 rounded" value={formData.minStockLevel} onChange={e => setFormData({...formData, minStockLevel: Number(e.target.value)})} /></div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" id="batch" checked={formData.isBatchTracking} onChange={e => setFormData({...formData, isBatchTracking: e.target.checked})} />
                <label htmlFor="batch" className="text-sm font-medium">Enable Batch / Expiry Tracking</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 border-t pt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-900 text-white rounded">Save Item</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

function InventoryTransactions({ activeCompany }: { activeCompany: any, user: any }) {
  const transactions = useInventoryData(activeCompany, 'inv_transactions');
  const items = useInventoryData(activeCompany, 'inv_items');
  const locations = useInventoryData(activeCompany, 'inv_locations');
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const initialForm = { type: 'IN', itemId: '', locationId: '', toLocationId: '', quantity: 1, rate: 0, date: new Date().toISOString().split('T')[0], reference: '' };
  const [formData, setFormData] = useState<any>(initialForm);

  const handleSave = async () => {
    if(!formData.itemId || !formData.locationId || !formData.quantity) return alert('Fill required fields');
    const dataToSave = { ...formData, amount: formData.quantity * formData.rate, companyId: activeCompany.id };
    if (editingTransaction) {
      await updateDoc(doc(db, 'inv_transactions', editingTransaction.id), dataToSave);
    } else {
      await addDoc(collection(db, 'inv_transactions'), dataToSave);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => setDeleteConfirm(id);
  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteDoc(doc(db, 'inv_transactions', deleteConfirm));
      } catch (err) {
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
        <h2 className="text-lg font-medium">Stock Transactions</h2>
        <button onClick={() => { setEditingTransaction(null); setFormData(initialForm); setShowModal(true); }} className="bg-blue-900 text-white px-3 py-1.5 rounded flex items-center gap-1"><Plus className="w-4 h-4"/> Add Entry</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead><tr className="bg-gray-50 border-b"><th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Item</th><th className="p-2">Location</th><th className="p-2 text-right">Qty</th><th className="p-2">Actions</th></tr></thead>
        <tbody>
          {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
            <tr key={t.id} className="border-b text-sm">
              <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
              <td className="p-2">
                <span className={`px-2 py-0.5 rounded text-xs ${t.type === 'IN' ? 'bg-green-100 text-green-800' : t.type === 'OUT' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>{t.type}</span>
              </td>
              <td className="p-2 font-medium">
                {items.find(i => i.id === t.itemId)?.name}
                {t.batchId && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1 rounded border">Batch: {useInventoryData(activeCompany, 'inv_batches').find(b => b.id === t.batchId)?.batchNumber}</span>}
              </td>
              <td className="p-2">
                {locations.find(l => l.id === t.locationId)?.name}
                {t.type === 'TRANSFER' && <span> → {locations.find(l => l.id === t.toLocationId)?.name}</span>}
              </td>
              <td className="p-2 text-right font-bold">{t.quantity}</td>
              <td className="p-2 flex gap-2">
                <button onClick={() => { setEditingTransaction(t); setFormData(t); setShowModal(true); }} className="text-blue-600"><Edit className="w-4 h-4"/></button>
                <button onClick={() => handleDelete(t.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">{editingTransaction ? 'Edit' : 'Record'} Transaction</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Type</label>
                <select className="w-full border p-2 rounded" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="IN">Stock IN (Purchase/Add)</option>
                  <option value="OUT">Stock OUT (Sale/Deduct)</option>
                  <option value="TRANSFER">Location TRANSFER</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                </select>
              </div>
              <div><label className="block text-sm">Date</label><input type="date" className="w-full border p-2 rounded" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
              {items.find(i => i.id === formData.itemId)?.isBatchTracking && (
                <div className="col-span-2">
                  <label className="block text-sm">Batch</label>
                  <select className="w-full border p-2 rounded" value={formData.batchId || ''} onChange={e => setFormData({...formData, batchId: e.target.value})}>
                    <option value="">Select Batch</option>
                    {useInventoryData(activeCompany, 'inv_batches').filter(b => b.itemId === formData.itemId).map(b => <option key={b.id} value={b.id}>{b.batchNumber}</option>)}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="block text-sm">Item</label>
                <select className="w-full border p-2 rounded" value={formData.itemId} onChange={e => {
                  const item = items.find(i => i.id === e.target.value);
                  setFormData({...formData, itemId: e.target.value, rate: item?.purchasePrice || 0});
                }}>
                  <option value="">Select Item</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm">{formData.type === 'TRANSFER' ? 'From Location' : 'Location'}</label>
                <select className="w-full border p-2 rounded" value={formData.locationId} onChange={e => setFormData({...formData, locationId: e.target.value})}>
                  <option value="">Select</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              {formData.type === 'TRANSFER' && (
                <div>
                  <label className="block text-sm">To Location</label>
                  <select className="w-full border p-2 rounded" value={formData.toLocationId} onChange={e => setFormData({...formData, toLocationId: e.target.value})}>
                    <option value="">Select</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}
              <div><label className="block text-sm">Quantity</label><input type="number" min="0.01" step="any" className="w-full border p-2 rounded" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} /></div>
              <div><label className="block text-sm">Rate</label><input type="number" min="0" step="any" className="w-full border p-2 rounded" value={formData.rate} onChange={e => setFormData({...formData, rate: Number(e.target.value)})} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-6 border-t pt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-900 text-white rounded">Save Entry</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

function InventoryDashboard({ activeCompany }: { activeCompany: any, user: any }) {
  const transactions = useInventoryData(activeCompany, 'inv_transactions');
  const items = useInventoryData(activeCompany, 'inv_items');
  const units = useInventoryData(activeCompany, 'inv_units');
  
  // Calculate Stock Summary
  const stockSummary = useMemo(() => {
    const summary: Record<string, { in: number, out: number, balance: number, value: number }> = {};
    items.forEach(i => summary[i.id] = { in: 0, out: 0, balance: 0, value: 0 });
    
    transactions.forEach(t => {
      if(!summary[t.itemId]) return;
      if(t.type === 'IN') {
        summary[t.itemId].in += Number(t.quantity);
        summary[t.itemId].balance += Number(t.quantity);
      } else if(t.type === 'OUT') {
        summary[t.itemId].out += Number(t.quantity);
        summary[t.itemId].balance -= Number(t.quantity);
      }
      // Transfer doesn't affect total balance, Adjustment we'll treat based on quantity sign (assume + for IN, - for OUT, but UI enforces positive quantity, so we'll need to enhance Adjustment later. For now, IN/OUT covers most)
    });
    
    items.forEach(i => {
      summary[i.id].value = summary[i.id].balance * (i.purchasePrice || 0);
    });
    
    return summary;
  }, [items, transactions]);

  const totalValue = Object.values(stockSummary).reduce((acc: number, curr: any) => acc + curr.value, 0) as number;
  const lowStockItems = items.filter(i => (stockSummary[i.id]?.balance || 0) <= i.minStockLevel);

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Total Inventory Value</div>
          <div className="text-2xl font-bold text-gray-900">₹{totalValue.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Total Items</div>
          <div className="text-2xl font-bold text-gray-900">{items.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Low Stock Alerts</div>
          <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 font-medium flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500"/> Stock Summary (Closing Balances)
          </div>
          <div className="p-0 overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white shadow-sm"><tr><th className="p-3 border-b">Item</th><th className="p-3 border-b text-right">Balance</th><th className="p-3 border-b text-right">Value (₹)</th></tr></thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{i.name}</td>
                    <td className="p-3 text-right font-medium">
                      {stockSummary[i.id]?.balance} {units.find(u => u.id === i.unitId)?.symbol}
                    </td>
                    <td className="p-3 text-right">{(stockSummary[i.id]?.value || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-red-50 font-medium text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4"/> Low Stock Alerts
          </div>
          <div className="p-0 overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white shadow-sm"><tr><th className="p-3 border-b">Item</th><th className="p-3 border-b text-right">Current</th><th className="p-3 border-b text-right">Min Required</th></tr></thead>
              <tbody>
                {lowStockItems.length === 0 ? (
                  <tr><td colSpan={3} className="p-4 text-center text-gray-500">All stock levels are optimal.</td></tr>
                ) : lowStockItems.map(i => (
                  <tr key={i.id} className="border-b bg-red-50/30">
                    <td className="p-3">{i.name}</td>
                    <td className="p-3 text-right font-bold text-red-600">{stockSummary[i.id]?.balance}</td>
                    <td className="p-3 text-right">{i.minStockLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="bg-white border rounded-lg shadow-sm p-4">
        <h3 className="font-medium mb-4 flex items-center gap-2"><History className="w-4 h-4 text-gray-500"/> Movement Analysis (Top 5 Moving Items)</h3>
        <div className="space-y-3">
          {items.map(i => ({...i, movement: (stockSummary[i.id]?.in || 0) + (stockSummary[i.id]?.out || 0)}))
            .sort((a,b) => b.movement - a.movement)
            .slice(0, 5)
            .map(i => (
            <div key={i.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
              <div>
                <div className="font-medium">{i.name}</div>
                <div className="text-xs text-gray-500">{units.find(u => u.id === i.unitId)?.name}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">In: {stockSummary[i.id]?.in} | Out: {stockSummary[i.id]?.out}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InventoryBatches({ activeCompany }: { activeCompany: any, user: any }) {
  const batches = useInventoryData(activeCompany, 'inv_batches');
  const items = useInventoryData(activeCompany, 'inv_items');
  const transactions = useInventoryData(activeCompany, 'inv_transactions');
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<InvBatch | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const initialForm = { itemId: '', batchNumber: '', manufacturingDate: '', expiryDate: '' };
  const [formData, setFormData] = useState<any>(initialForm);

  const handleSave = async () => {
    if(!formData.itemId || !formData.batchNumber) return alert('Item and Batch Number are required');
    if (editingBatch) {
      await updateDoc(doc(db, 'inv_batches', editingBatch.id), formData);
    } else {
      await addDoc(collection(db, 'inv_batches'), { ...formData, companyId: activeCompany.id });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => setDeleteConfirm(id);
  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteDoc(doc(db, 'inv_batches', deleteConfirm));
      } catch (err) {
        console.error(err);
        alert('Error deleting: ' + err.message);
      } finally {
        setDeleteConfirm(null);
      }
    }
  };

  const today = new Date();
  
  // Calculate Batch Balances
  const batchBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    batches.forEach(b => balances[b.id] = 0);
    
    transactions.forEach(t => {
      if (!t.batchId || balances[t.batchId] === undefined) return;
      if (t.type === 'IN') balances[t.batchId] += Number(t.quantity);
      if (t.type === 'OUT') balances[t.batchId] -= Number(t.quantity);
    });
    return balances;
  }, [batches, transactions]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Batch Management & Aging Analysis</h2>
        <button onClick={() => { setEditingBatch(null); setFormData(initialForm); setShowModal(true); }} className="bg-blue-900 text-white px-3 py-1.5 rounded flex items-center gap-1"><Plus className="w-4 h-4"/> Add Batch</button>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 font-medium flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500"/> Stock Aging & Expiry Status
        </div>
        <div className="p-0 overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm border-b">
              <tr>
                <th className="p-3">Batch Number</th>
                <th className="p-3">Item</th>
                                <th className="p-3 text-center">Mfg Date</th>
                <th className="p-3 text-center">Expiry Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => {
                const item = items.find(i => i.id === b.itemId);
                const expDate = b.expiryDate ? new Date(b.expiryDate) : null;
                let status = 'Good';
                let statusColor = 'bg-green-100 text-green-800';
                
                if (expDate) {
                  const daysToExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                  if (daysToExpiry < 0) {
                    status = 'Expired';
                    statusColor = 'bg-red-100 text-red-800 font-bold';
                  } else if (daysToExpiry <= 30) {
                    status = `Expiring in ${daysToExpiry} days`;
                    statusColor = 'bg-orange-100 text-orange-800';
                  }
                }
                
                const currentStock = batchBalances[b.id] || 0;

                return (
                  <tr key={b.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{b.batchNumber}</td>
                    <td className="p-3">{item?.name}</td>
                                        <td className="p-3 text-center text-gray-600">{b.manufacturingDate || '-'}</td>
                    <td className="p-3 text-center text-gray-600">{b.expiryDate || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusColor}`}>{status}</span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => { setEditingBatch(b); setFormData(b); setShowModal(true); }} className="text-blue-600"><Edit className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(b.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">{editingBatch ? 'Edit' : 'Add'} Batch</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm">Item (Batch Tracking Enabled)</label>
                <select className="w-full border p-2 rounded" value={formData.itemId} onChange={e => setFormData({...formData, itemId: e.target.value})}>
                  <option value="">Select Item</option>
                  {items.filter(i => i.isBatchTracking).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className="block text-sm">Batch Number</label><input className="w-full border p-2 rounded" value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} /></div>
              <div><label className="block text-sm">Manufacturing Date</label><input type="date" className="w-full border p-2 rounded" value={formData.manufacturingDate} onChange={e => setFormData({...formData, manufacturingDate: e.target.value})} /></div>
              <div><label className="block text-sm">Expiry Date</label><input type="date" className="w-full border p-2 rounded" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-6 border-t pt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-900 text-white rounded">Save Batch</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Batch"
        message="Are you sure you want to delete this batch? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

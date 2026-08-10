import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs } from '../lib/firebase';
import { Employee, SalarySlip } from '../types';
import { Users, FileText, Settings as SettingsIcon, Calculator, Plus, Trash2, Edit, Printer } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import ConfirmModal from '../components/ConfirmModal';

export default function Payroll() {
  const { activeCompany } = useAppContext();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'employees' | 'process' | 'slips'>('employees');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  
  useEffect(() => {
    if (!activeCompany || !user) return;
    
    const empQ = query(collection(db, 'employees'), where('companyId', '==', activeCompany.id));
    const unsubEmp = onSnapshot(empQ, (snap: any) => {
      setEmployees(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Employee)));
    });
    
    const slipQ = query(collection(db, 'salarySlips'), where('companyId', '==', activeCompany.id));
    const unsubSlip = onSnapshot(slipQ, (snap: any) => {
      setSlips(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as SalarySlip)));
    });
    
    return () => { unsubEmp(); unsubSlip(); };
  }, [activeCompany, user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Management</h2>
          <p className="text-sm text-gray-500">Manage employees, process salaries, and generate payslips</p>
        </div>
      </div>
      
      <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm border border-gray-200 w-fit">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'employees' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Users className="w-4 h-4" />
          Employees
        </button>
        <button
          onClick={() => setActiveTab('process')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'process' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Calculator className="w-4 h-4" />
          Process Salary
        </button>
        <button
          onClick={() => setActiveTab('slips')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'slips' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <FileText className="w-4 h-4" />
          Salary Slips
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[500px]">
        {activeTab === 'employees' && <EmployeeList employees={employees} activeCompany={activeCompany} />}
        {activeTab === 'process' && <ProcessSalary employees={employees} slips={slips} activeCompany={activeCompany} />}
        {activeTab === 'slips' && <SalarySlips slips={slips} employees={employees} />}
      </div>
    </div>
  );
}

// Subcomponents

function EmployeeList({ employees, activeCompany }: { employees: Employee[], activeCompany: any }) {
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const handleSave = async (empData: Partial<Employee>) => {
    if (editingEmp) {
      await updateDoc(doc(db, 'employees', editingEmp.id), empData);
    } else {
      await addDoc(collection(db, 'employees'), { ...empData, companyId: activeCompany.id, isActive: true });
    }
    setShowModal(false);
    setEditingEmp(null);
  };
  
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "employees", id));
    const slipsQuery = query(collection(db, "salarySlips"), where("employeeId", "==", id));
    const slipsSnap = await getDocs(slipsQuery);
    const deletePromises = slipsSnap.docs.map(slipDoc => deleteDoc(doc(db, "salarySlips", slipDoc.id)));
    await Promise.all(deletePromises);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Employee Directory</h3>
        <button onClick={() => { setEditingEmp(null); setShowModal(true); }} className="bg-blue-900 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-800 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Designation</th>
              <th className="p-3 font-medium">Department</th>
              <th className="p-3 font-medium text-right">Basic Salary</th>
              <th className="p-3 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No employees found. Add one to get started.</td></tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{emp.employeeCode}</td>
                  <td className="p-3">{emp.name}</td>
                  <td className="p-3">{emp.designation}</td>
                  <td className="p-3">{emp.department}</td>
                  <td className="p-3 text-right">₹{emp.basicSalary?.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-center flex items-center justify-center gap-2">
                    <button onClick={() => { setEditingEmp(emp); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 mx-1"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm(emp.id)} className="text-red-600 hover:text-red-800 mx-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {showModal && (
        <EmployeeModal 
          emp={editingEmp} 
          onClose={() => setShowModal(false)} 
          onSave={handleSave} 
        />
      )}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Employee"
        message="Are you sure you want to delete this employee?"
        onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

function EmployeeModal({ emp, onClose, onSave }: { emp: Employee | null, onClose: () => void, onSave: (d: any) => void }) {
  const [formData, setFormData] = useState<Partial<Employee>>(emp || {
    employeeCode: '', name: '', designation: '', department: '', dateOfJoining: '',
    pan: '', uan: '', pfNumber: '', esiNumber: '', bankName: '', accountNumber: '', ifscCode: '',
    basicSalary: 0, hra: 0, conveyanceAllowance: 0, medicalAllowance: 0, specialAllowance: 0, deductPT: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-bold">{emp ? 'Edit Employee' : 'Add Employee'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h4 className="col-span-full font-semibold text-gray-700 border-b pb-2">Personal & Job Details</h4>
            <div><label className="block text-sm text-gray-600 mb-1">Employee Code</label><input required type="text" name="employeeCode" value={formData.employeeCode} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Full Name</label><input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Designation</label><input required type="text" name="designation" value={formData.designation} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Department</label><input required type="text" name="department" value={formData.department} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Date of Joining</label><input required type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">PAN Number</label><input type="text" name="pan" value={formData.pan} onChange={handleChange} className="w-full border rounded p-2" /></div>
            
            <h4 className="col-span-full font-semibold text-gray-700 border-b pb-2 mt-4">Statutory & Bank Details</h4>
            <div><label className="block text-sm text-gray-600 mb-1">UAN (PF)</label><input type="text" name="uan" value={formData.uan} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">PF Number</label><input type="text" name="pfNumber" value={formData.pfNumber} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">ESI Number</label><input type="text" name="esiNumber" value={formData.esiNumber} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Bank Name</label><input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Account Number</label><input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">IFSC Code</label><input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="w-full border rounded p-2" /></div>
            
            <div className="col-span-full flex items-center gap-2 mt-2">
              <input type="checkbox" id="deductPT" name="deductPT" checked={formData.deductPT !== false} onChange={(e) => setFormData(prev => ({...prev, deductPT: e.target.checked}))} className="w-4 h-4 text-blue-600 rounded" />
              <label htmlFor="deductPT" className="text-sm text-gray-700">Deduct Professional Tax (PT)</label>
            </div>
            <h4 className="col-span-full font-semibold text-gray-700 border-b pb-2 mt-4">Salary Components (Monthly)</h4>
            <div><label className="block text-sm text-gray-600 mb-1">Basic Salary</label><input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">HRA</label><input type="number" name="hra" value={formData.hra} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Conveyance</label><input type="number" name="conveyanceAllowance" value={formData.conveyanceAllowance} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Medical</label><input type="number" name="medicalAllowance" value={formData.medicalAllowance} onChange={handleChange} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm text-gray-600 mb-1">Special Allowance</label><input type="number" name="specialAllowance" value={formData.specialAllowance} onChange={handleChange} className="w-full border rounded p-2" /></div>
          </div>
          
        </div>
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={() => onSave(formData)} className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800">Save Employee</button>
        </div>
      </div>
    </div>
  );
}

function ProcessSalary({ employees, slips, activeCompany }: { employees: Employee[], slips: SalarySlip[], activeCompany: any }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [workingDays, setWorkingDays] = useState(30);
  const [unprocessConfirm, setUnprocessConfirm] = useState<{emp: Employee, slip: SalarySlip} | null>(null);
  
  const requestUnprocess = (emp: Employee) => {
    const slip = slips.find(s => s.employeeId === emp.id && s.month === month && s.year === year);
    if (slip) {
      setUnprocessConfirm({emp, slip});
    }
  };

  const confirmUnprocess = async () => {
    if (unprocessConfirm) {
      await deleteDoc(doc(db, "salarySlips", unprocessConfirm.slip.id));
      setUnprocessConfirm(null);
    }
  };

  const processForEmployee = async (emp: Employee) => {
    // Check if already processed
    if (slips.some(s => s.employeeId === emp.id && s.month === month && s.year === year)) {
      alert(`Salary already processed for ${emp.name} for this month.`);
      return;
    }
    
    // Auto Calculate
    const gross = (emp.basicSalary || 0) + (emp.hra || 0) + (emp.conveyanceAllowance || 0) + (emp.medicalAllowance || 0) + (emp.specialAllowance || 0);
    
    // PF Calculation: 12% of Basic
    const pf = Math.round((emp.basicSalary || 0) * 0.12);
    
    // ESI Calculation: 0.75% of Gross if Gross <= 21000
    const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
    
    // PT Standard 200 (Simplified)
    const pt = emp.deductPT !== false ? (gross > 15000 ? 200 : 0) : 0;
    
    // TDS Calculation (New Tax Regime)
    const annualGross = gross * 12;
    const standardDeduction = 75000;
    const annualPT = pt * 12;
    const taxableIncome = Math.max(0, annualGross - standardDeduction - annualPT);
    
    let annualTax = 0;
    const taxSlabs: { slab: string, rate: string, amount: number }[] = [];
    
    if (taxableIncome > 700000) {
      // Slab 3L to 6L
      if (taxableIncome > 300000) {
        const taxable = Math.min(taxableIncome - 300000, 300000);
        const tax = Math.round(taxable * 0.05);
        annualTax += tax;
        taxSlabs.push({ slab: '₹3L - ₹6L', rate: '5%', amount: tax });
      }
      // Slab 6L to 9L
      if (taxableIncome > 600000) {
        const taxable = Math.min(taxableIncome - 600000, 300000);
        const tax = Math.round(taxable * 0.10);
        annualTax += tax;
        taxSlabs.push({ slab: '₹6L - ₹9L', rate: '10%', amount: tax });
      }
      // Slab 9L to 12L
      if (taxableIncome > 900000) {
        const taxable = Math.min(taxableIncome - 900000, 300000);
        const tax = Math.round(taxable * 0.15);
        annualTax += tax;
        taxSlabs.push({ slab: '₹9L - ₹12L', rate: '15%', amount: tax });
      }
      // Slab 12L to 15L
      if (taxableIncome > 1200000) {
        const taxable = Math.min(taxableIncome - 1200000, 300000);
        const tax = Math.round(taxable * 0.20);
        annualTax += tax;
        taxSlabs.push({ slab: '₹12L - ₹15L', rate: '20%', amount: tax });
      }
      // Slab Above 15L
      if (taxableIncome > 1500000) {
        const taxable = taxableIncome - 1500000;
        const tax = Math.round(taxable * 0.30);
        annualTax += tax;
        taxSlabs.push({ slab: 'Above ₹15L', rate: '30%', amount: tax });
      }
      
      // Health and Education Cess @ 4%
      if (annualTax > 0) {
        const cess = Math.round(annualTax * 0.04);
        annualTax += cess;
        taxSlabs.push({ slab: 'Cess', rate: '4%', amount: cess });
      }
    } else {
      taxSlabs.push({ slab: 'Up to ₹7L (Rebate 87A)', rate: '0%', amount: 0 });
    }
    
    const tds = Math.round(annualTax / 12);
    
    const taxBreakdown = {
      annualGross,
      standardDeduction,
      taxableIncome,
      taxSlabs,
      totalAnnualTax: annualTax,
      monthlyTds: tds
    };
    
    const totalDeductions = pf + esi + pt + tds;
    const netSalary = gross - totalDeductions;
    
    const slip: Omit<SalarySlip, 'id'> = {
      companyId: activeCompany.id,
      employeeId: emp.id,
      month,
      year,
      basic: emp.basicSalary || 0,
      hra: emp.hra || 0,
      conveyance: emp.conveyanceAllowance || 0,
      medical: emp.medicalAllowance || 0,
      special: emp.specialAllowance || 0,
      grossEarnings: gross,
      pf,
      esi,
      pt,
      tds,
      otherDeductions: 0,
      totalDeductions,
      netSalary,
      workingDays,
      presentDays: workingDays,
      leaves: 0,
      taxBreakdown
    };
    
    await addDoc(collection(db, 'salarySlips'), slip);
    alert(`Processed salary for ${emp.name}`);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Month</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border rounded p-2">
            {Array.from({length: 12}).map((_, i) => (
              <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Year</label>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded p-2 w-24" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Total Working Days</label>
          <input type="number" value={workingDays} onChange={e => setWorkingDays(Number(e.target.value))} className="border rounded p-2 w-24" />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
              <th className="p-3 font-medium">Employee</th>
              <th className="p-3 font-medium text-right">Gross Salary</th>
              <th className="p-3 font-medium text-center">Status</th>
              <th className="p-3 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const isProcessed = slips.some(s => s.employeeId === emp.id && s.month === month && s.year === year);
              const gross = (emp.basicSalary || 0) + (emp.hra || 0) + (emp.conveyanceAllowance || 0) + (emp.medicalAllowance || 0) + (emp.specialAllowance || 0);
              
              return (
                <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-gray-500">{emp.employeeCode}</div>
                  </td>
                  <td className="p-3 text-right">₹{gross.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-center flex items-center justify-center gap-2">
                    {isProcessed ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Processed</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending</span>
                    )}
                  </td>
                  <td className="p-3 text-center flex items-center justify-center gap-2">
                    {isProcessed ? (
                      <button
                        onClick={() => requestUnprocess(emp)}
                        className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded text-xs hover:bg-red-100"
                      >
                        Un-process
                      </button>
                    ) : (
                      <button
                        onClick={() => processForEmployee(emp)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700"
                      >
                        Process
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        isOpen={!!unprocessConfirm}
        title="Un-process Salary"
        message={`Are you sure you want to un-process salary for ${unprocessConfirm?.emp.name}?`}
        onConfirm={confirmUnprocess}
        onCancel={() => setUnprocessConfirm(null)}
      />
    </div>
  );
}

function SalarySlips({ slips, employees }: { slips: SalarySlip[], employees: Employee[] }) {
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "salarySlips", id));
  };

  const getEmp = (id: string) => employees.find(e => e.id === id);

  return (
    <div className="p-4 sm:p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
              <th className="p-3 font-medium">Month/Year</th>
              <th className="p-3 font-medium">Employee</th>
              <th className="p-3 font-medium text-right">Net Salary</th>
              <th className="p-3 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {slips.sort((a,b) => b.year - a.year || b.month - a.month).map(slip => {
              const emp = getEmp(slip.employeeId);
              return (
                <tr key={slip.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    {new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'short' })} {slip.year}
                  </td>
                  <td className="p-3">{emp?.name || 'Unknown'}</td>
                  <td className="p-3 text-right font-medium text-green-700">₹{slip.netSalary.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-center flex items-center justify-center gap-2">
                    <button 
                      onClick={() => setSelectedSlip(slip)}
                      className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto text-sm"
                    >
                      <FileText className="w-4 h-4" /> View Slip
                    </button>
                    <button onClick={() => setDeleteConfirm(slip.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete Slip">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {slips.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No salary slips found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Delete Salary Slip"
        message="Are you sure you want to delete this salary slip?"
        onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
      {selectedSlip && (
        <PrintableSalarySlip 
          slip={selectedSlip} 
          employee={getEmp(selectedSlip.employeeId)!} 
          onClose={() => setSelectedSlip(null)} 
        />
      )}
    </div>
  );
}

function PrintableSalarySlip({ slip, employee, onClose }: { slip: SalarySlip, employee: Employee, onClose: () => void }) {
  const { activeCompany } = useAppContext();
  
  const handleDownload = () => {
    const input = document.getElementById('salary-slip-content');
    if (!input) return;
    
    toPng(input, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' }).then(imgData => {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (input.offsetHeight * pdfWidth) / input.offsetWidth;
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Salary_Slip_${employee.name}_${slip.month}_${slip.year}.pdf`);
    }).catch(err => {
      console.error('Error generating pdf:', err);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[1200px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center shrink-0 bg-white">
          <h3 className="text-lg font-bold">Salary Slip Preview</h3>
          <div className="flex gap-2">
            <button onClick={handleDownload} className="bg-blue-900 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-800">
              <Printer className="w-4 h-4" /> Download PDF (Landscape)
            </button>
            <button onClick={onClose} className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">Close</button>
          </div>
        </div>
        
        <div className="p-8 overflow-auto bg-gray-100 flex-1">
          <div id="salary-slip-content" className="bg-white p-10 border border-gray-200 shadow-sm w-[297mm] mx-auto h-auto min-h-[150mm]" style={{ boxSizing: 'border-box' }}>
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
              <h1 className="text-3xl font-bold uppercase text-gray-900">{activeCompany?.name}</h1>
              <p className="text-sm text-gray-600">{activeCompany?.address}</p>
              <div className="text-sm text-gray-600 mt-1 flex justify-center gap-4">
                {activeCompany?.phone && <span>Phone: {activeCompany.phone}</span>}
                {activeCompany?.email && <span>Email: {activeCompany.email}</span>}
                {activeCompany?.pan && <span>PAN: {activeCompany.pan}</span>}
                {activeCompany?.gstin && <span>GSTIN: {activeCompany.gstin}</span>}
              </div>
              <h2 className="text-xl font-bold mt-4 uppercase">
                Payslip for the month of {new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'long' })} {slip.year}
              </h2>
            </div>
            
            {/* Employee Details */}
            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
              <table className="w-full">
                <tbody>
                  <tr><td className="py-1 font-semibold w-1/3">Employee Name</td><td className="py-1">: {employee?.name}</td></tr>
                  <tr><td className="py-1 font-semibold w-1/3">Employee Code</td><td className="py-1">: {employee?.employeeCode}</td></tr>
                  <tr><td className="py-1 font-semibold w-1/3">Designation</td><td className="py-1">: {employee?.designation}</td></tr>
                  <tr><td className="py-1 font-semibold w-1/3">Department</td><td className="py-1">: {employee?.department}</td></tr>
                  <tr><td className="py-1 font-semibold w-1/3">Date of Joining</td><td className="py-1">: {employee?.dateOfJoining}</td></tr>
                </tbody>
              </table>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-1 font-semibold w-1/3">Bank Name</td><td className="py-1">: {employee?.bankName || '-'}</td></tr>
                  <tr><td className="py-1 font-semibold w-1/3">Account No.</td><td className="py-1">: {employee?.accountNumber || '-'}</td></tr>
                  <tr><td className="py-1 font-semibold w-1/3">PAN Number</td><td className="py-1">: {employee?.pan || '-'}</td></tr>
                  <tr><td className="py-1 font-semibold w-1/3">UAN Number</td><td className="py-1">: {employee?.uan || '-'}</td></tr>
                  <tr><td className="py-1 font-semibold w-1/3">Working Days</td><td className="py-1">: {slip.workingDays}</td></tr>
                </tbody>
              </table>
            </div>
            
            {/* Salary Details */}
            <div className="grid grid-cols-2 border border-gray-400">
              {/* Earnings */}
              <div className="border-r border-gray-400">
                <div className="bg-gray-100 font-bold p-2 text-center border-b border-gray-400">EARNINGS</div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr><td className="p-2 border-b border-gray-200">Basic Salary</td><td className="p-2 border-b border-gray-200 text-right">₹{slip.basic.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td className="p-2 border-b border-gray-200">House Rent Allowance</td><td className="p-2 border-b border-gray-200 text-right">₹{slip.hra.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td className="p-2 border-b border-gray-200">Conveyance Allowance</td><td className="p-2 border-b border-gray-200 text-right">₹{slip.conveyance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td className="p-2 border-b border-gray-200">Medical Allowance</td><td className="p-2 border-b border-gray-200 text-right">₹{slip.medical.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td className="p-2 border-b border-gray-200">Special Allowance</td><td className="p-2 border-b border-gray-200 text-right">₹{slip.special.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td className="p-2">&nbsp;</td><td className="p-2">&nbsp;</td></tr>
                    <tr><td className="p-2">&nbsp;</td><td className="p-2">&nbsp;</td></tr>
                  </tbody>
                </table>
                <div className="bg-gray-50 font-bold p-2 flex justify-between border-t border-gray-400">
                  <span>Gross Earnings (A)</span>
                  <span>₹{slip.grossEarnings.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
              
              {/* Deductions */}
              <div>
                <div className="bg-gray-100 font-bold p-2 text-center border-b border-gray-400">DEDUCTIONS</div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr><td className="p-2 border-b border-gray-200">Provident Fund (PF) (12% of Basic)</td><td className="p-2 border-b border-gray-200 text-right">₹{slip.pf.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td className="p-2 border-b border-gray-200">ESI (0.75% of Gross)</td><td className="p-2 border-b border-gray-200 text-right">₹{slip.esi.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td className="p-2 border-b border-gray-200">Professional Tax (PT)</td><td className="p-2 border-b border-gray-200 text-right">₹{slip.pt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td className="p-2 border-b border-gray-200">TDS</td><td className="p-2 border-b border-gray-200 text-right">₹{slip.tds.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td className="p-2 border-b border-gray-200">Other Deductions</td><td className="p-2 border-b border-gray-200 text-right">₹{slip.otherDeductions.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                    <tr><td className="p-2">&nbsp;</td><td className="p-2">&nbsp;</td></tr>
                    <tr><td className="p-2">&nbsp;</td><td className="p-2">&nbsp;</td></tr>
                  </tbody>
                </table>
                <div className="bg-gray-50 font-bold p-2 flex justify-between border-t border-gray-400">
                  <span>Total Deductions (B)</span>
                  <span>₹{slip.totalDeductions.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
            
            {/* Net Salary */}
            <div className="mt-4 bg-green-50 border border-green-200 p-4 flex justify-between items-center text-lg">
              <span className="font-bold text-gray-800">NET PAY (A - B)</span>
              <span className="font-bold text-green-800 text-2xl">₹{slip.netSalary.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            
            {/* Footer */}
            {slip.taxBreakdown && (
              <div className="mt-4 border border-gray-400 text-sm">
                <div className="bg-gray-100 font-bold p-2 border-b border-gray-400">TDS CALCULATION (NEW TAX REGIME)</div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between py-1"><span>Annual Gross Salary:</span><span>₹{slip.taxBreakdown.annualGross.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span></div>
                    <div className="flex justify-between py-1"><span>Standard Deduction:</span><span>₹{slip.taxBreakdown.standardDeduction.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span></div>
                    <div className="flex justify-between py-1 font-semibold border-t mt-1 pt-1"><span>Taxable Income:</span><span>₹{slip.taxBreakdown.taxableIncome.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span></div>
                  </div>
                  <div>
                    <div className="font-semibold mb-1 border-b pb-1">Tax Slab Breakdown</div>
                    {slip.taxBreakdown.taxSlabs.map((s: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-0.5 text-xs"><span>{s.slab} ({s.rate}):</span><span>₹{s.amount.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span></div>
                    ))}
                    <div className="flex justify-between py-1 font-semibold border-t mt-1 pt-1"><span>Total Annual Tax:</span><span>₹{slip.taxBreakdown.totalAnnualTax.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span></div>
                    <div className="flex justify-between py-1 font-bold text-blue-800"><span>Monthly TDS:</span><span>₹{slip.taxBreakdown.monthlyTds.toLocaleString("en-IN", {minimumFractionDigits: 2})}</span></div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-16 flex justify-between px-8 text-sm text-gray-600">
              <div className="text-center border-t border-gray-400 pt-2 w-48">Employer Signature</div>
              <div className="text-center border-t border-gray-400 pt-2 w-48">Employee Signature</div>
            </div>
            <div className="text-center mt-8 text-xs text-gray-400">
              This is a computer generated payslip and does not require a physical signature.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

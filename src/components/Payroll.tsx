import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, db } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { Employee, SalarySlip } from '../types';
import { Plus, Printer, Trash2, Users, FileText, Edit, Save, X } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import SalarySlipPrintModal from '../components/SalarySlipPrintModal';

const INDIAN_BANKS = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
  "Punjab National Bank", "Bank of Baroda", "Bank of India", "Canara Bank", "Union Bank of India",
  "IDBI Bank", "IndusInd Bank", "Yes Bank", "Federal Bank", "South Indian Bank"
];

export default function Payroll() {
  const { activeCompany } = useAppContext();
  const [activeTab, setActiveTab] = useState<'employees' | 'slips'>('employees');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showSlipForm, setShowSlipForm] = useState(false);
  const [slipToPrint, setSlipToPrint] = useState<SalarySlip | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [slipToDelete, setSlipToDelete] = useState<string | null>(null);
  
  const [empForm, setEmpForm] = useState<Partial<Employee>>({});
  const [slipForm, setSlipForm] = useState<Partial<SalarySlip> & { suggestedTDS?: number, enableEpf?: boolean, enableEsi?: boolean }>({
      basicPay: 0, da: 0, hra: 0, ta: 0, childrenAllowance: 0, medicalAllowance: 0, fixedAllowance: 0, otherAllowances: 0, 
      professionalTax: 0, epf: 0, esi: 0, incomeTax: 0, charges: 0, deductions: 0, netPay: 0, grossEarnings: 0, totalDeductions: 0
  });

  useEffect(() => {
    if (activeCompany) {
      loadEmployees();
      loadSalarySlips();
    }
  }, [activeCompany]);

  
  const calculateTDS = (form: Partial<SalarySlip>, emp: Employee | undefined) => {
    if (!emp) return 0;
    const regime = emp.taxRegime || 'new';
    
    const basic = form.basicPay || 0;
    const da = form.da || 0;
    const hra = form.hra || 0;
    const ta = form.ta || 0;
    const ca = form.childrenAllowance || 0;
    const ma = form.medicalAllowance || 0;
    const fa = form.fixedAllowance || 0;
    const oa = form.otherAllowances || 0;
    
    const monthlyGross = basic + da + hra + ta + ca + ma + fa + oa;
    const annualGross = monthlyGross * 12;
    
    const epf = Math.round((basic + da) * 0.12);
    const pt = form.professionalTax || 0;
    
    let taxableIncome = 0;
    let tax = 0;

    if (regime === 'new') {
      // Standard deduction of 50k applies to new regime too
      taxableIncome = annualGross - 50000;
      if (taxableIncome <= 700000) {
        return 0; // 87A rebate
      }
      if (taxableIncome > 300000) tax += Math.min(taxableIncome - 300000, 300000) * 0.05;
      if (taxableIncome > 600000) tax += Math.min(taxableIncome - 600000, 300000) * 0.10;
      if (taxableIncome > 900000) tax += Math.min(taxableIncome - 900000, 300000) * 0.15;
      if (taxableIncome > 1200000) tax += Math.min(taxableIncome - 1200000, 300000) * 0.20;
      if (taxableIncome > 1500000) tax += (taxableIncome - 1500000) * 0.30;
    } else {
      // Old regime
      const pfAnnual = epf * 12;
      const ptAnnual = pt * 12;
      const standardDeduction = 50000;
      const section80C = Math.min(pfAnnual, 150000); // Only counting PF for now
      
      taxableIncome = annualGross - standardDeduction - ptAnnual - section80C;
      
      if (taxableIncome <= 500000) {
        return 0; // 87A rebate
      }
      if (taxableIncome > 250000) tax += Math.min(taxableIncome - 250000, 250000) * 0.05;
      if (taxableIncome > 500000) tax += Math.min(taxableIncome - 500000, 500000) * 0.20;
      if (taxableIncome > 1000000) tax += (taxableIncome - 1000000) * 0.30;
    }

    if (tax > 0) {
      tax += tax * 0.04; // 4% Health & Education Cess
    }

    return Math.max(0, Math.round(tax / 12));
  };
    
  const loadEmployees = async () => {
    if (!activeCompany) return;
    const q = query(collection(db, 'employees'), where('companyId', '==', activeCompany.id));
    const snapshot = await getDocs(q);
    setEmployees(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
  };

  const loadSalarySlips = async () => {
    if (!activeCompany) return;
    const q = query(collection(db, 'salarySlips'), where('companyId', '==', activeCompany.id));
    const snapshot = await getDocs(q);
    setSalarySlips(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SalarySlip)));
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeCompany) return;
      const newEmp = { ...empForm, companyId: activeCompany.id } as Employee;
      if (empForm.id) {
          await updateDoc(doc(db, 'employees', empForm.id), newEmp);
      } else {
          await addDoc(collection(db, 'employees'), newEmp);
      }
      setShowEmployeeForm(false);
      setEmpForm({});
      loadEmployees();
  };

  const handleSaveSlip = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeCompany) return;
      const gross = (slipForm.basicPay||0) + (slipForm.da||0) + (slipForm.hra||0) + (slipForm.ta||0) + 
                    (slipForm.childrenAllowance||0) + (slipForm.medicalAllowance||0) + (slipForm.fixedAllowance||0) + (slipForm.otherAllowances||0);
      const deductions = (slipForm.professionalTax||0) + (slipForm.epf||0) + (slipForm.esi||0) + (slipForm.incomeTax||0) + (slipForm.charges||0) + (slipForm.deductions||0);
      const netPay = gross - deductions;
      
      const newSlip = { 
          ...slipForm, 
          companyId: activeCompany.id,
          grossEarnings: gross,
          totalDeductions: deductions,
          netPay,
          date: new Date().toISOString()
      } as SalarySlip;
      
      if (slipForm.id) {
          await updateDoc(doc(db, 'salarySlips', slipForm.id), newSlip);
      } else {
          await addDoc(collection(db, 'salarySlips'), newSlip);
      }
      setShowSlipForm(false);
      setSlipForm({ basicPay: 0, da: 0, hra: 0, ta: 0, childrenAllowance: 0, medicalAllowance: 0, fixedAllowance: 0, otherAllowances: 0, professionalTax: 0, epf: 0, esi: 0, incomeTax: 0, charges: 0, deductions: 0, netPay: 0, grossEarnings: 0, totalDeductions: 0, enableEpf: false, enableEsi: false });
      loadSalarySlips();
  };

  const deleteEmployee = async (id: string) => {
      setEmployeeToDelete(id);
  };
  
  const confirmDeleteEmployee = async () => {
      if (!employeeToDelete) return;
      await deleteDoc(doc(db, 'employees', employeeToDelete));
      setEmployeeToDelete(null);
      loadEmployees();
  };

  const deleteSlip = async (id: string) => {
      setSlipToDelete(id);
  };
  
  const confirmDeleteSlip = async () => {
      if (!slipToDelete) return;
      await deleteDoc(doc(db, 'salarySlips', slipToDelete));
      setSlipToDelete(null);
      loadSalarySlips();
  };
  
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

  // Auto-calculate EPF and ESI
  useEffect(() => {
    if (showSlipForm) {
      const basic = slipForm.basicPay || 0;
      const da = slipForm.da || 0;
      const hra = slipForm.hra || 0;
      const ta = slipForm.ta || 0;
      const ca = slipForm.childrenAllowance || 0;
      const ma = slipForm.medicalAllowance || 0;
      const fa = slipForm.fixedAllowance || 0;
      const oa = slipForm.otherAllowances || 0;
      
      const gross = basic + da + hra + ta + ca + ma + fa + oa;
      const epf = slipForm.enableEpf ? Math.round((basic + da) * 0.12) : (slipForm.epf || 0);
      const esi = slipForm.enableEsi ? (gross <= 21000 ? Math.round(gross * 0.0075) : 0) : (slipForm.esi || 0);
      
      const emp = employees.find(e => e.id === slipForm.employeeId);
      const suggestedTDS = calculateTDS({ ...slipForm, epf, grossEarnings: gross }, emp);
      
      setSlipForm(prev => ({ ...prev, epf, esi, grossEarnings: gross, suggestedTDS }));
    }
  }, [
    slipForm.basicPay, slipForm.da, slipForm.hra, slipForm.ta, 
    slipForm.childrenAllowance, slipForm.medicalAllowance, 
    slipForm.fixedAllowance, slipForm.otherAllowances, showSlipForm, slipForm.employeeId, slipForm.enableEpf, slipForm.enableEsi
  ]);

  if (!activeCompany) return <div className="p-8 text-center text-gray-500">Please select a company first.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll System</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employees and generate salary slips</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setActiveTab('employees'); setShowEmployeeForm(true); setEmpForm({}); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Users className="w-4 h-4" /> Add Employee
          </button>
          <button
            onClick={() => { setActiveTab('slips'); setShowSlipForm(true); setSlipForm({ basicPay: 0, da: 0, hra: 0, ta: 0, childrenAllowance: 0, medicalAllowance: 0, fixedAllowance: 0, otherAllowances: 0, professionalTax: 0, epf: 0, esi: 0, incomeTax: 0, charges: 0, deductions: 0, netPay: 0, grossEarnings: 0, totalDeductions: 0, enableEpf: false, enableEsi: false }); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" /> Generate Payslip
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('employees')} className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'employees' ? 'border-b-2 border-blue-900 text-blue-900 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            <div className="flex items-center justify-center gap-2"><Users className="w-4 h-4" /> Employees Database</div>
          </button>
          <button onClick={() => setActiveTab('slips')} className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'slips' ? 'border-b-2 border-blue-900 text-blue-900 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            <div className="flex items-center justify-center gap-2"><FileText className="w-4 h-4" /> Salary Slips History</div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'employees' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left">
                    <th className="pb-3 font-semibold text-gray-600 text-sm">Emp ID</th>
                    <th className="pb-3 font-semibold text-gray-600 text-sm">Name</th>
                    <th className="pb-3 font-semibold text-gray-600 text-sm">Designation</th>
                    <th className="pb-3 font-semibold text-gray-600 text-sm">Department</th>
                    <th className="pb-3 font-semibold text-gray-600 text-sm text-right">Basic Pay</th>
                    <th className="pb-3 font-semibold text-gray-600 text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 text-sm font-medium text-gray-900">{emp.employeeId}</td>
                      <td className="py-4 text-sm text-gray-800">{emp.name}</td>
                      <td className="py-4 text-sm text-gray-600">{emp.designation}</td>
                      <td className="py-4 text-sm text-gray-600">{emp.department}</td>
                      <td className="py-4 text-sm text-gray-900 font-medium text-right">Rs. {emp.basicPay.toLocaleString('en-IN')}</td>
                      <td className="py-4 text-right">
                         <div className="flex justify-end gap-2">
                            <button onClick={() => { setEmpForm(emp); setShowEmployeeForm(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => deleteEmployee(emp.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-gray-500 text-sm">No employees found. Create one to get started.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'slips' && (
             <div className="overflow-x-auto">
             <table className="w-full">
               <thead>
                 <tr className="border-b-2 border-gray-200 text-left">
                   <th className="pb-3 font-semibold text-gray-600 text-sm">Month</th>
                   <th className="pb-3 font-semibold text-gray-600 text-sm">Employee</th>
                   <th className="pb-3 font-semibold text-gray-600 text-sm text-right">Gross</th>
                   <th className="pb-3 font-semibold text-gray-600 text-sm text-right">Net Salary</th>
                   <th className="pb-3 font-semibold text-gray-600 text-sm text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {salarySlips.map(slip => (
                   <tr key={slip.id} className="hover:bg-gray-50 transition-colors">
                     <td className="py-4 text-sm font-medium text-gray-900">{slip.month}</td>
                     <td className="py-4 text-sm text-gray-800">{getEmployeeName(slip.employeeId)}</td>
                     <td className="py-4 text-sm text-gray-600 text-right">Rs. {(slip.grossEarnings||0).toLocaleString('en-IN')}</td>
                     <td className="py-4 text-sm text-blue-900 font-bold text-right">Rs. {slip.netPay.toLocaleString('en-IN')}</td>
                     <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => setSlipToPrint(slip)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Print/Preview"><Printer className="w-4 h-4" /></button>
                           <button onClick={() => { setSlipForm(slip); setShowSlipForm(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                           <button onClick={() => deleteSlip(slip.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </td>
                   </tr>
                 ))}
                 {salarySlips.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-gray-500 text-sm">No salary slips generated yet.</td></tr>}
               </tbody>
             </table>
           </div>
          )}
        </div>
      </div>

      {/* Employee Modal */}
      {showEmployeeForm && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto pt-24 pb-12">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden mt-auto mb-auto">
                 <div className="flex justify-between items-center p-6 border-b border-gray-100">
                     <h2 className="text-xl font-bold text-gray-900">{empForm.id ? 'Edit Employee' : 'Add New Employee'}</h2>
                     <button type="button" onClick={() => setShowEmployeeForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                 </div>
                 <form onSubmit={handleSaveEmployee} className="p-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-1 md:col-span-3 pb-2 border-b font-semibold text-gray-700">Basic Information</div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                            <input required value={empForm.employeeId || ''} onChange={e=>setEmpForm({...empForm, employeeId: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input required value={empForm.name || ''} onChange={e=>setEmpForm({...empForm, name: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select value={empForm.gender || ''} onChange={e=>setEmpForm({...empForm, gender: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border">
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Regime *</label>
                            <select required value={empForm.taxRegime || 'new'} onChange={e=>setEmpForm({...empForm, taxRegime: e.target.value as 'new' | 'old'})} className="w-full rounded-md border-gray-300 px-3 py-2 border">
                                <option value="new">New Regime</option>
                                <option value="old">Old Regime</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                            <input type="date" value={empForm.dateOfJoining || ''} onChange={e=>setEmpForm({...empForm, dateOfJoining: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                            <input required value={empForm.designation || ''} onChange={e=>setEmpForm({...empForm, designation: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                            <input required value={empForm.department || ''} onChange={e=>setEmpForm({...empForm, department: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input value={empForm.location || ''} onChange={e=>setEmpForm({...empForm, location: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary / Basic Pay (Rs.) *</label>
                            <NumericFormat required value={empForm.basicPay || ''} onValueChange={v => setEmpForm({...empForm, basicPay: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                        </div>

                        <div className="col-span-1 md:col-span-3 mt-4 pb-2 border-b font-semibold text-gray-700">Compliance & Bank Details</div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PAN No</label>
                            <input value={empForm.pan || ''} onChange={e=>setEmpForm({...empForm, pan: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border uppercase" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">UAN Number</label>
                            <input value={empForm.uan || ''} onChange={e=>setEmpForm({...empForm, uan: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PF Account No.</label>
                            <input value={empForm.pfAccountNumber || ''} onChange={e=>setEmpForm({...empForm, pfAccountNumber: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                            <input list="banks" value={empForm.bankName || ''} onChange={e=>setEmpForm({...empForm, bankName: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                            <datalist id="banks">
                                {INDIAN_BANKS.map(b => <option key={b} value={b} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account No.</label>
                            <input value={empForm.bankAccount || ''} onChange={e=>setEmpForm({...empForm, bankAccount: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC</label>
                              <input value={empForm.ifscCode || ''} onChange={e=>setEmpForm({...empForm, ifscCode: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border uppercase" />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                              <input value={empForm.branchName || ''} onChange={e=>setEmpForm({...empForm, branchName: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                           </div>
                        </div>
                     </div>
                     <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button type="button" onClick={() => setShowEmployeeForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-lg hover:bg-blue-800 flex items-center gap-2"><Save className="w-4 h-4"/> Save Employee</button>
                     </div>
                 </form>
             </div>
         </div>
      )}

      {/* Salary Slip Modal */}
      {showSlipForm && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto py-12">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col my-auto">
                 <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                     <h2 className="text-xl font-bold text-gray-900">{slipForm.id ? 'Edit Salary Slip' : 'Generate Salary Slip'}</h2>
                     <button type="button" onClick={() => setShowSlipForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                 </div>
                 <form onSubmit={handleSaveSlip} className="p-6 overflow-y-auto">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-4">
                           <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                               <select required value={slipForm.employeeId || ''} onChange={e => {
                                  const emp = employees.find(x=>x.id === e.target.value);
                                  setSlipForm({...slipForm, employeeId: e.target.value, basicPay: emp ? emp.basicPay : slipForm.basicPay});
                               }} className="w-full rounded-md border-gray-300 px-3 py-2 border">
                                  <option value="">Select Employee</option>
                                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>)}
                               </select>
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">Salary Month *</label>
                               <input type="month" required value={slipForm.month || ''} onChange={e=>setSlipForm({...slipForm, month: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-gray-700 mb-1">Pay Date (Optional)</label>
                               <input type="date" value={slipForm.payDate || ''} onChange={e=>setSlipForm({...slipForm, payDate: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                           </div>
                        </div>

                        {/* Earnings */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Earnings</h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <label className="text-sm text-gray-700">Basic Pay</label>
                                    <NumericFormat required value={slipForm.basicPay || ''} onValueChange={v => setSlipForm({...slipForm, basicPay: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <label className="text-sm text-gray-700">Dearness Allowance (DA)</label>
                                    <NumericFormat value={slipForm.da || ''} onValueChange={v => setSlipForm({...slipForm, da: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <label className="text-sm text-gray-700">House Rent Allowance (HRA)</label>
                                    <NumericFormat value={slipForm.hra || ''} onValueChange={v => setSlipForm({...slipForm, hra: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <label className="text-sm text-gray-700">Transport Allowance (TA)</label>
                                    <NumericFormat value={slipForm.ta || ''} onValueChange={v => setSlipForm({...slipForm, ta: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <label className="text-sm text-gray-700">Children Allowance</label>
                                    <NumericFormat value={slipForm.childrenAllowance || ''} onValueChange={v => setSlipForm({...slipForm, childrenAllowance: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <label className="text-sm text-gray-700">Medical Allowance</label>
                                    <NumericFormat value={slipForm.medicalAllowance || ''} onValueChange={v => setSlipForm({...slipForm, medicalAllowance: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <label className="text-sm text-gray-700">Fixed Allowance</label>
                                    <NumericFormat value={slipForm.fixedAllowance || ''} onValueChange={v => setSlipForm({...slipForm, fixedAllowance: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <label className="text-sm text-gray-700">Other Allowances</label>
                                    <NumericFormat value={slipForm.otherAllowances || ''} onValueChange={v => setSlipForm({...slipForm, otherAllowances: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t font-semibold text-gray-800 flex justify-between">
                                <span>Gross Earnings:</span>
                                <span>Rs. {((slipForm.basicPay||0) + (slipForm.da||0) + (slipForm.hra||0) + (slipForm.ta||0) + (slipForm.childrenAllowance||0) + (slipForm.medicalAllowance||0) + (slipForm.fixedAllowance||0) + (slipForm.otherAllowances||0)).toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 flex flex-col">
                            <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Deductions</h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <label className="text-sm text-gray-700">Professional Tax</label>
                                    <NumericFormat value={slipForm.professionalTax || ''} onValueChange={v => setSlipForm({...slipForm, professionalTax: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <div className="flex flex-col"><label className="text-sm text-gray-700">EPF <span className="text-xs text-gray-500">(12% of Basic+DA)</span></label>
     <label className="flex items-center gap-1 mt-1 cursor-pointer"><input type="checkbox" checked={!!slipForm.enableEpf} onChange={(e) => setSlipForm(prev => ({...prev, enableEpf: e.target.checked, epf: e.target.checked ? Math.round(((prev.basicPay||0) + (prev.da||0)) * 0.12) : 0 }))} className="rounded border-gray-300 text-blue-900 focus:ring-blue-900" /><span className="text-xs text-blue-700">Auto Calculate</span></label></div>
                                    <NumericFormat value={slipForm.epf || ''} onValueChange={v => setSlipForm({...slipForm, epf: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border bg-white" disabled={slipForm.enableEpf} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <div className="flex flex-col"><label className="text-sm text-gray-700">ESI <span className="text-xs text-gray-500">(0.75% of Gross, Nil if &gt; 21k)</span></label>
     <label className="flex items-center gap-1 mt-1 cursor-pointer"><input type="checkbox" checked={!!slipForm.enableEsi} onChange={(e) => setSlipForm(prev => ({...prev, enableEsi: e.target.checked, esi: e.target.checked ? (((prev.grossEarnings||0) <= 21000) ? Math.round((prev.grossEarnings||0) * 0.0075) : 0) : 0 }))} className="rounded border-gray-300 text-blue-900 focus:ring-blue-900" /><span className="text-xs text-blue-700">Auto Calculate</span></label></div>
                                    <NumericFormat value={slipForm.esi || ''} onValueChange={v => setSlipForm({...slipForm, esi: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border bg-white" disabled={slipForm.enableEsi} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <div className="flex flex-col"><label className="text-sm text-gray-700">Income Tax (TDS) {!!slipForm.grossEarnings && !!slipForm.incomeTax && <span className="text-xs text-gray-500">({((slipForm.incomeTax / slipForm.grossEarnings) * 100).toFixed(1)}%)</span>}</label>
                                     <button type="button" onClick={() => setSlipForm(prev => ({...prev, incomeTax: prev.suggestedTDS}))} className="text-xs text-blue-600 hover:underline text-left mt-0.5">Use Auto Calc</button></div>
                                    <NumericFormat value={slipForm.incomeTax || ''} onValueChange={v => setSlipForm({...slipForm, incomeTax: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className={`w-full rounded-md px-3 py-2 border ${slipForm.incomeTax !== slipForm.suggestedTDS && slipForm.suggestedTDS !== undefined ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} />
                                    {slipForm.suggestedTDS !== undefined && slipForm.incomeTax !== slipForm.suggestedTDS && (
                                      <p className="text-xs text-red-600 mt-1 col-span-2">
                                        Calculated TDS per {employees.find(e => e.id === slipForm.employeeId)?.taxRegime || 'new'} regime: Rs. {slipForm.suggestedTDS}. Please verify.
                                      </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                      <label className="text-sm text-gray-700">Charges (Damages/Fines)</label>
                                      <NumericFormat value={slipForm.charges || ''} onValueChange={v => setSlipForm({...slipForm, charges: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 items-center">
                                      <label className="text-sm text-gray-700">Other Deductions</label>
                                      <NumericFormat value={slipForm.deductions || ''} onValueChange={v => setSlipForm({...slipForm, deductions: v.floatValue || 0})} thousandSeparator="," thousandsGroupStyle="lakh" className="w-full rounded-md border-gray-300 px-3 py-2 border" />
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t font-semibold text-gray-800 flex justify-between">
                                <span>Total Deductions:</span>
                                <span>Rs. {((slipForm.professionalTax||0) + (slipForm.epf||0) + (slipForm.esi||0) + (slipForm.incomeTax||0) + (slipForm.charges||0) + (slipForm.deductions||0)).toLocaleString('en-IN')}</span>
                            </div>

                            <div className="mt-auto pt-6">
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-center">
                                    <span className="text-sm text-blue-800 font-medium block mb-1">Total Net Payable (Gross - Total Deductions)</span>
                                    <span className="text-2xl font-bold text-blue-900">
                                       Rs. {(((slipForm.basicPay||0) + (slipForm.da||0) + (slipForm.hra||0) + (slipForm.ta||0) + (slipForm.childrenAllowance||0) + (slipForm.medicalAllowance||0) + (slipForm.fixedAllowance||0) + (slipForm.otherAllowances||0)) - ((slipForm.professionalTax||0) + (slipForm.epf||0) + (slipForm.esi||0) + (slipForm.incomeTax||0) + (slipForm.charges||0) + (slipForm.deductions||0))).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>
                     </div>
                     <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100 shrink-0">
                        <button type="button" onClick={() => setShowSlipForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-lg hover:bg-blue-800 flex items-center gap-2"><Save className="w-4 h-4"/> Generate Payslip</button>
                     </div>
                 </form>
             </div>
         </div>
      )}

      {/* Delete Confirmation Modal */}
      {(employeeToDelete || slipToDelete) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden zoom-in-95 animate-in duration-200">
             <div className="p-6">
               <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
               <p className="text-sm text-gray-600">Are you sure you want to delete this record? This action cannot be undone.</p>
             </div>
             <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
               <button
                 onClick={() => { setEmployeeToDelete(null); setSlipToDelete(null); }}
                 className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={() => {
                   if (employeeToDelete) confirmDeleteEmployee();
                   if (slipToDelete) confirmDeleteSlip();
                 }}
                 className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
               >
                 Yes, Delete
               </button>
             </div>
           </div>
         </div>
      )}

      {slipToPrint && activeCompany && employees.find(e => e.id === slipToPrint.employeeId) && (
        <SalarySlipPrintModal 
          isOpen={true} 
          onClose={() => setSlipToPrint(null)} 
          slip={slipToPrint} 
          employee={employees.find(e => e.id === slipToPrint.employeeId)!}
          company={activeCompany}
        />
      )}
    </div>
  );

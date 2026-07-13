import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, setDoc } from '../lib/firebase';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, XCircle, Clock, Copy, Search, ShieldCheck } from 'lucide-react';
import { Company } from '../types';

interface PaymentRequest {
  id: string;
  companyId: string;
  companyName: string;
  whatsapp: string;
  txnId: string;
  plan: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  licenseKey?: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'licenses'>('requests');

  useEffect(() => {
    if (user?.email !== 'mndl.yuvi@gmail.com') return;

    const q = query(collection(db, 'paymentRequests'), orderBy('createdAt', 'desc'));
    const unsubscribeRequests = onSnapshot(q, (snapshot) => {
      const data: PaymentRequest[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as PaymentRequest);
      });
      setRequests(data);
    });

    const qCompanies = query(collection(db, 'companies'));
    const unsubscribeCompanies = onSnapshot(qCompanies, (snapshot) => {
      const data: Company[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Company);
      });
      setCompanies(data);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeCompanies();
    };
  }, [user]);

  if (user?.email !== 'mndl.yuvi@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleApprove = async (request: PaymentRequest) => {
    try {
      const key = Math.floor(10000 + Math.random() * 90000).toString();
      
      await setDoc(doc(db, 'validKeys', key), {
        createdAt: new Date().toISOString(),
        used: false,
        generatedForCompany: request.companyName,
        plan: request.plan
      });

      await updateDoc(doc(db, 'paymentRequests', request.id), {
        status: 'approved',
        licenseKey: key
      });
    } catch (err: any) {
      console.error(err);
      alert("Failed to approve payment: " + (err.message || JSON.stringify(err)));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(db, 'paymentRequests', id), {
        status: 'rejected'
      });
    } catch (err: any) {
      console.error(err);
      alert("Failed to reject payment: " + (err.message || JSON.stringify(err)));
    }
  };

  const filteredRequests = React.useMemo(() => requests.filter(r => 
    r.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.whatsapp.includes(searchTerm) || 
    r.txnId.includes(searchTerm)
  ), [requests, searchTerm]);

  const handleToggleBan = async (companyId: string, currentStatus: boolean | undefined) => {
    if (confirm(currentStatus ? 'Are you sure you want to unban this company?' : 'Are you sure you want to ban this company? They will lose access to premium features.')) {
      try {
        await updateDoc(doc(db, 'companies', companyId), {
          isBanned: !currentStatus
        });
      } catch (err) {
        alert("Failed to update ban status: " + err);
      }
    }
  };

  const filteredCompanies = React.useMemo(() => companies.filter(c =>
    (c.license && c.license.type !== 'free') &&
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.includes(searchTerm))
  ), [companies, searchTerm]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage premium subscriptions and license keys.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment Requests
            </button>
            <button
              onClick={() => setActiveTab('licenses')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'licenses' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Active Licenses
            </button>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'requests' ? (
            React.useMemo(() => (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Txn ID</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action / Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {req.companyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.whatsapp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {req.txnId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {req.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {req.status === 'pending' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1"/> Pending</span>}
                      {req.status === 'approved' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1"/> Approved</span>}
                      {req.status === 'rejected' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1"/> Rejected</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {req.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button onClick={() => handleApprove(req)} className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md font-medium transition-colors">Approve</button>
                          <button onClick={() => handleReject(req.id)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md font-medium transition-colors">Reject</button>
                        </div>
                      )}
                      {req.status === 'approved' && req.licenseKey && (
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-md font-mono font-bold">
                          {req.licenseKey}
                          <button onClick={() => navigator.clipboard.writeText(`Your PFC Financials License Key is: ${req.licenseKey}`)} className="text-blue-500 hover:text-blue-700">
                             <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {req.status === 'rejected' && (
                         <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No payment requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ), [filteredRequests])
          ) : (
            React.useMemo(() => (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Activated On</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Expires On</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCompanies.map((company) => {
                  const lic = company.license;
                  if (!lic) return null;
                  
                  let daysLeft = 0;
                  if (lic.type === 'monthly' && lic.validUntil) {
                    daysLeft = Math.ceil((new Date(lic.validUntil).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  }

                  return (
                    <tr key={company.id} className={company.isBanned ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {company.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {lic.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lic.activatedAt ? formatDate(lic.activatedAt) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lic.validUntil ? formatDate(lic.validUntil) : (lic.type === 'permanent' ? 'Never' : '-')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {company.isBanned ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Banned
                          </span>
                        ) : lic.type === 'monthly' ? (
                          daysLeft > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active ({daysLeft} days left)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Expired
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Permanent
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleToggleBan(company.id, company.isBanned)}
                          className={`px-3 py-1 rounded-md font-medium transition-colors ${
                            company.isBanned
                              ? 'text-green-700 bg-green-100 hover:bg-green-200'
                              : 'text-red-700 bg-red-100 hover:bg-red-200'
                          }`}
                        >
                          {company.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredCompanies.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No active licenses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ), [filteredCompanies])
          )}
        </div>
      </div>
    </div>
  );
}

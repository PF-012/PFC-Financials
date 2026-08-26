import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query, where, orderBy } from '../lib/firebase';
import { db } from '../lib/firebase';
import { AuditLog } from '../types';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function AuditTrail() {
  const { activeCompany } = useAppContext();
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (!activeCompany) return;
    const q = query(
      collection(db, 'audit_logs'),
      where('companyId', '==', activeCompany.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d: any) => d.data());
      // Client-side sort by descending date since mock DB orderBy might not be perfect
      docs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(docs);
    });
    return () => unsub();
  }, [activeCompany]);

  if (!activeCompany) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-6">
        <ShieldCheck className="w-8 h-8 text-blue-900" />
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Compliance & Audit Trail</h1>
          <p className="text-sm text-gray-500">Immutable record of all modifications (SOC 2 Type II compliant).</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
           <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium border border-blue-200 shadow-sm">
             Sector Logic: {activeCompany.settings?.sector || 'General'}
           </span>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp (UTC)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No audit logs found.</td>
                 </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{log.userEmail}</span>
                    <br/><span className="text-xs text-gray-500">{log.userId}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">{log.entityType}</span>
                    <br/><span className="text-xs text-gray-500 mt-1 block">{log.entityId}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="space-y-2">
                      {log.changes.map((change, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-100">
                          <span className="font-medium text-gray-700 w-24 truncate">{change.field}:</span>
                          <span className="line-through text-red-500 bg-red-50 px-1 rounded">{String(change.oldValue || 'none')}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-green-600 bg-green-50 px-1 rounded font-medium">{String(change.newValue || 'none')}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

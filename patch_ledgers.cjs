const fs = require('fs');
let content = fs.readFileSync('src/pages/Ledgers.tsx', 'utf8');

const tableBodyStr = `<tbody className="bg-white divide-y divide-gray-200">
                  {filteredLedgers.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                           No ledgers found matching your search.
                           {ledgers.length > 0 && <div className="mt-2 text-xs text-gray-400">({ledgers.length} total ledgers exist in the company)</div>}
                        </td>
                     </tr>
                  ) : (
                     filteredLedgers.map((l, index) => (
                        <tr 
                         key={l.id} 
                         className={\`cursor-pointer \${selectedIds.includes(l.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}\`}
                        onClick={() => { if(!l.isSystem) setSelectedIds(prev => prev.includes(l.id) ? prev.filter(id => id !== l.id) : [...prev, l.id]) }}
                     >
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {String(l.name || "")}
                              {l.isSystem && <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Default</span>}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(l.gstin || "-")}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(l.group || "-")}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              ₹ {(l.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {!l.isSystem && (
                                 <div className="flex justify-end gap-3">
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(l); }} className="text-blue-600 hover:text-blue-900" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(l.id); }} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                              )}
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>`;

const replacement = `{React.useMemo(() => (
  <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLedgers.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                           No ledgers found matching your search.
                           {ledgers.length > 0 && <div className="mt-2 text-xs text-gray-400">({ledgers.length} total ledgers exist in the company)</div>}
                        </td>
                     </tr>
                  ) : (
                     filteredLedgers.map((l, index) => (
                        <tr 
                         key={l.id} 
                         className={\`cursor-pointer \${selectedIds.includes(l.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}\`}
                        onClick={() => { if(!l.isSystem) setSelectedIds(prev => prev.includes(l.id) ? prev.filter(id => id !== l.id) : [...prev, l.id]) }}
                     >
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {String(l.name || "")}
                              {l.isSystem && <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Default</span>}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(l.gstin || "-")}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {String(l.group || "-")}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              ₹ {(l.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {!l.isSystem && (
                                 <div className="flex justify-end gap-3">
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(l); }} className="text-blue-600 hover:text-blue-900" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(l.id); }} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                              )}
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
), [filteredLedgers, ledgers.length, selectedIds])}`;

content = content.replace(tableBodyStr, replacement);
fs.writeFileSync('src/pages/Ledgers.tsx', content);
console.log("Replaced Ledgers tbody");

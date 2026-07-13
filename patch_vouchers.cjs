const fs = require('fs');
let content = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

const tableBodyStr = `<tbody className="bg-white divide-y divide-gray-200">
                  {filteredVouchers.length === 0 ? (
                     <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                           No vouchers found in the selected date range.
                           {vouchers.length > 0 && <div className="mt-2 text-xs text-gray-400">({vouchers.length} total vouchers exist in the company)</div>}
                        </td>
                     </tr>
                  ) : (
                     filteredVouchers.map((v, index) => {
                        const party = String(ledgers.find(l => l.id === v.partyId)?.name || v.partyId || 'Unknown');
                        const prevType = index > 0 ? filteredVouchers[index - 1].type : null;
                        const typeChanged = prevType && prevType !== v.type;
                        return (
                           <tr 
   id={\`row-\${index}\`} 
   key={v.id} 
   className={\`cursor-pointer \${selectedIds.includes(v.id) ? 'bg-blue-50' : selectedIndex === index ? 'bg-blue-100' : 'hover:bg-gray-50'} \${typeChanged ? 'border-t-4 border-gray-300' : ''}\`} 
   onClick={() => {
      setSelectedIndex(index);
      setSelectedIds(prev => prev.includes(v.id) ? prev.filter(id => id !== v.id) : [...prev, v.id]);
   }}
    onDoubleClick={() => handleEdit(v)}>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{formatDate(v.date)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{String(v.type || "")}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-semibold">
                                 {String(v.number || "-")}
                                 {v.againstReference && <span className="block text-gray-500 text-xs font-normal">Against: {String(v.againstReference || "")}</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{party}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                 ₹ {(v.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                 <div className="flex justify-end gap-3">
                                    <button onClick={() => setPrintingVoucher(v)} className="text-gray-500 hover:text-gray-700" title="Print/Download PDF">
                                       <Printer className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(v); }} className="text-blue-600 hover:text-blue-900" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(v.id); }} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                              </td>
                           </tr>
                        )
                     })
                  )}
               </tbody>`;

const replacement = `{React.useMemo(() => (
  <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVouchers.length === 0 ? (
                     <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                           No vouchers found in the selected date range.
                           {vouchers.length > 0 && <div className="mt-2 text-xs text-gray-400">({vouchers.length} total vouchers exist in the company)</div>}
                        </td>
                     </tr>
                  ) : (
                     filteredVouchers.map((v, index) => {
                        const party = String(ledgers.find(l => l.id === v.partyId)?.name || v.partyId || 'Unknown');
                        const prevType = index > 0 ? filteredVouchers[index - 1].type : null;
                        const typeChanged = prevType && prevType !== v.type;
                        return (
                           <tr 
   id={\`row-\${index}\`} 
   key={v.id} 
   className={\`cursor-pointer \${selectedIds.includes(v.id) ? 'bg-blue-50' : selectedIndex === index ? 'bg-blue-100' : 'hover:bg-gray-50'} \${typeChanged ? 'border-t-4 border-gray-300' : ''}\`} 
   onClick={() => {
      setSelectedIndex(index);
      setSelectedIds(prev => prev.includes(v.id) ? prev.filter(id => id !== v.id) : [...prev, v.id]);
   }}
    onDoubleClick={() => handleEdit(v)}>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{formatDate(v.date)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{String(v.type || "")}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-semibold">
                                 {String(v.number || "-")}
                                 {v.againstReference && <span className="block text-gray-500 text-xs font-normal">Against: {String(v.againstReference || "")}</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{party}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                 ₹ {(v.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                 <div className="flex justify-end gap-3">
                                    <button onClick={() => setPrintingVoucher(v)} className="text-gray-500 hover:text-gray-700" title="Print/Download PDF">
                                       <Printer className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(v); }} className="text-blue-600 hover:text-blue-900" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(v.id); }} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                              </td>
                           </tr>
                        )
                     })
                  )}
               </tbody>
), [filteredVouchers, vouchers.length, ledgers, selectedIds, selectedIndex])}`;

content = content.replace(tableBodyStr, replacement);
fs.writeFileSync('src/pages/Vouchers.tsx', content);
console.log("Replaced Vouchers tbody");

const fs = require('fs');
let content = fs.readFileSync('src/pages/Companies.tsx', 'utf8');

const str = `         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(c => {
               const isActive = activeCompany?.id === c.id;
               return (
                  <div key={c.id} className={\`bg-white rounded-lg border overflow-hidden flex flex-col \${isActive ? 'border-blue-900 shadow-sm ring-1 ring-blue-900' : 'border-gray-200 shadow-sm'}\`}>
                     <div className="p-6 flex-1">
                        <div className="mb-4"><h3 className="text-lg font-medium text-gray-900 truncate" title={c.name}>{c.name}</h3></div>
                        <div className="space-y-2 text-sm text-gray-600">
                           {c.gstin && <p>GSTIN: {c.gstin}</p>}
                           {c.email && <p>Email: {c.email}</p>}
                           {c.phone && <p>Phone: {c.phone}</p>}
                        </div>
                     </div>
                     <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        {isActive ? (
                           <span className="text-sm font-medium text-blue-900">Currently Active</span>
                        ) : (
                           <button onClick={() => setActiveCompany(c)} className="text-sm font-medium text-gray-600 hover:text-gray-900 w-full text-left">
                              Select Company
                           </button>
                        )}
                        <div className="flex gap-3">
                           <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="text-gray-500 hover:text-blue-600 text-sm font-medium">Edit</button>
                           <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(c.id); }} className="text-gray-500 hover:text-red-600 text-sm font-medium">Delete</button>
                        </div>
                     </div>
                  </div>
               )
            })}
         </div>`;

const rep = `{React.useMemo(() => (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(c => {
               const isActive = activeCompany?.id === c.id;
               return (
                  <div key={c.id} className={\`bg-white rounded-lg border overflow-hidden flex flex-col transition-shadow hover:shadow-md \${isActive ? 'border-blue-900 shadow-sm ring-1 ring-blue-900' : 'border-gray-200 shadow-sm'}\`}>
                     <div className="p-6 flex-1">
                        <div className="mb-4"><h3 className="text-lg font-medium text-gray-900 truncate" title={c.name}>{c.name}</h3></div>
                        <div className="space-y-2 text-sm text-gray-600">
                           {c.gstin && <p>GSTIN: {c.gstin}</p>}
                           {c.email && <p>Email: {c.email}</p>}
                           {c.phone && <p>Phone: {c.phone}</p>}
                        </div>
                     </div>
                     <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        {isActive ? (
                           <span className="text-sm font-medium text-blue-900">Currently Active</span>
                        ) : (
                           <button onClick={() => setActiveCompany(c)} className="text-sm font-medium text-gray-600 hover:text-gray-900 w-full text-left transition-colors">
                              Select Company
                           </button>
                        )}
                        <div className="flex gap-3">
                           <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">Edit</button>
                           <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(c.id); }} className="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors">Delete</button>
                        </div>
                     </div>
                  </div>
               )
            })}
         </div>
), [companies, activeCompany?.id])}`;

content = content.replace(str, rep);
fs.writeFileSync('src/pages/Companies.tsx', content);
console.log("Patched Companies");

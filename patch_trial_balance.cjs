const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// Find the Trial Balance section and replace it with a flat list of ledgers
const tbStart = code.indexOf("{activeReport === 'trialBalance' && (");
const tbEnd = code.indexOf("{activeReport === 'cashFlow' && (");
if (tbStart !== -1 && tbEnd !== -1) {
    const flatTbCode = `{activeReport === 'trialBalance' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
           <table className="min-w-full text-left border-collapse">
             <thead>
               <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                 <th className="px-6 py-3">Ledger Name</th>
                 <th className="px-6 py-3">Group</th>
                 <th className="px-6 py-3 text-right">Debit (₹)</th>
                 <th className="px-6 py-3 text-right">Credit (₹)</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-200 bg-white">
               {reportData.allLedgers.map((l: any) => {
                 let bal = reportData.ledgerBalances[l.id] || 0;
                 if (['Indirect Expenses', 'Indirect Incomes', 'Direct Expenses', 'Direct Incomes', 'Sales Accounts', 'Purchase Accounts'].includes(l.group)) {
                    bal = reportData.currentChanges[l.id] || 0;
                 }
                 if (l.group === 'Capital Account') bal = -(reportData.ledgerBalances[l.id] || 0);
                 if (['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes'].includes(l.group)) bal = -(reportData.ledgerBalances[l.id] || 0);
                 
                 // P&L items: Incomes are credit (negative bal here means credit), Expenses are debit (positive)
                 if (['Sales Accounts', 'Indirect Incomes', 'Direct Incomes'].includes(l.group)) bal = -bal;
                 
                 if (Math.abs(bal) < 0.01) return null;
                 return (
                   <tr key={l.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4 text-sm text-gray-900">{l.name}</td>
                     <td className="px-6 py-4 text-sm text-gray-500">{l.group}</td>
                     <td className="px-6 py-4 text-sm text-right font-medium">{bal > 0 ? bal.toLocaleString('en-IN', {minimumFractionDigits: 2}) : ''}</td>
                     <td className="px-6 py-4 text-sm text-right font-medium">{bal < 0 ? Math.abs(bal).toLocaleString('en-IN', {minimumFractionDigits: 2}) : ''}</td>
                   </tr>
                 );
               })}
             </tbody>
             <tfoot className="bg-gray-50 border-t-2 border-gray-200">
               <tr>
                 <td colSpan={2} className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Total:</td>
                 <td className="px-6 py-4 text-sm font-semibold text-blue-900 text-right">
                   {reportData.allLedgers.reduce((sum: number, l: any) => {
                       let bal = reportData.ledgerBalances[l.id] || 0;
                       if (['Indirect Expenses', 'Indirect Incomes', 'Direct Expenses', 'Direct Incomes', 'Sales Accounts', 'Purchase Accounts'].includes(l.group)) {
                          bal = reportData.currentChanges[l.id] || 0;
                       }
                       if (l.group === 'Capital Account') bal = -(reportData.ledgerBalances[l.id] || 0);
                       if (['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes'].includes(l.group)) bal = -(reportData.ledgerBalances[l.id] || 0);
                       if (['Sales Accounts', 'Indirect Incomes', 'Direct Incomes'].includes(l.group)) bal = -bal;
                       return sum + (bal > 0 ? bal : 0);
                   }, 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                 </td>
                 <td className="px-6 py-4 text-sm font-semibold text-blue-900 text-right">
                   {reportData.allLedgers.reduce((sum: number, l: any) => {
                       let bal = reportData.ledgerBalances[l.id] || 0;
                       if (['Indirect Expenses', 'Indirect Incomes', 'Direct Expenses', 'Direct Incomes', 'Sales Accounts', 'Purchase Accounts'].includes(l.group)) {
                          bal = reportData.currentChanges[l.id] || 0;
                       }
                       if (l.group === 'Capital Account') bal = -(reportData.ledgerBalances[l.id] || 0);
                       if (['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes'].includes(l.group)) bal = -(reportData.ledgerBalances[l.id] || 0);
                       if (['Sales Accounts', 'Indirect Incomes', 'Direct Incomes'].includes(l.group)) bal = -bal;
                       return sum + (bal < 0 ? Math.abs(bal) : 0);
                   }, 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                 </td>
               </tr>
             </tfoot>
           </table>
        </div>
      )}
      
      `;
    
    code = code.substring(0, tbStart) + flatTbCode + code.substring(tbEnd);
    fs.writeFileSync('src/pages/Reports.tsx', code);
    console.log("Patched Trial Balance!");
} else {
    console.log("Could not find Trial Balance boundaries");
}

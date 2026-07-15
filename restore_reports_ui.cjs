const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// The original UI used tables inside of the "grid grid-cols-1 md:grid-cols-2" div.
// Let's replace the whole {activeReport === 'pnl' && (...)} block with exactly what the image shows.

const pnlReplacement = `{activeReport === 'pnl' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
           <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Side: Expenses / Direct */}
              <div className="p-0 md:border-r border-gray-200 flex flex-col">
                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-900">Particulars (Dr)</div>
                 <div className="flex-1 p-6 space-y-4">
                    {/* Trading Account Dr */}
                    <div className="flex justify-between text-sm">
                       <span className="text-gray-500">Opening Stock</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.openingStock.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => handleBreakdown('Purchase Accounts', 'ledgers', l => l.group === 'Purchase Accounts')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Purchase Accounts</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.totalPurchases.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => handleBreakdown('Direct Expenses', 'ledgers', l => l.group === 'Direct Expenses')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Direct Expenses</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.directExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    
                    <div className="pt-4 flex justify-between text-sm font-semibold">
                       <span className="text-gray-900">Gross Profit c/o</span>
                       <span className={reportData.grossProfit >= 0 ? "text-gray-900 font-medium" : "text-gray-400 font-medium"}>
                          {reportData.grossProfit > 0 ? "₹ " + reportData.grossProfit.toLocaleString('en-IN', {minimumFractionDigits: 2}) : "-"}
                       </span>
                    </div>

                    {/* PnL Account Dr */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                       <div className="flex justify-between text-sm mb-4 cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => handleBreakdown('Indirect Expenses', 'ledgers', l => l.group === 'Indirect Expenses')}>
                          <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Indirect Expenses</span>
                          <span className="text-gray-900 font-medium">₹ {reportData.indirectExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                       </div>
                       
                       <div className="pt-4 flex justify-between text-sm font-semibold">
                          <span className="text-blue-900">Net Profit</span>
                          <span className={reportData.netProfit >= 0 ? "text-blue-900" : "text-gray-400"}>
                             {reportData.netProfit > 0 ? "₹ " + reportData.netProfit.toLocaleString('en-IN', {minimumFractionDigits: 2}) : "-"}
                          </span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Right Side: Incomes / Indirect */}
              <div className="p-0 flex flex-col">
                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 border-t md:border-t-0 font-medium text-gray-900">Particulars (Cr)</div>
                 <div className="flex-1 p-6 space-y-4">
                    {/* Trading Account Cr */}
                    <div className="flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => handleBreakdown('Sales Accounts', 'ledgers', l => l.group === 'Sales Accounts')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Sales Accounts</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.totalSales.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => handleBreakdown('Direct Incomes', 'ledgers', l => l.group === 'Direct Incomes')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Direct Incomes</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.directIncomes.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-gray-500">Closing Stock</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.closingStock.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    
                    <div className="pt-4 flex justify-between text-sm font-semibold">
                       <span className="text-gray-400">Gross Loss c/o</span>
                       <span className={reportData.grossProfit < 0 ? "text-gray-900 font-medium" : "text-gray-400 font-medium"}>
                          {reportData.grossProfit < 0 ? "₹ " + Math.abs(reportData.grossProfit).toLocaleString('en-IN', {minimumFractionDigits: 2}) : "-"}
                       </span>
                    </div>

                    {/* PnL Account Cr */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                       <div className="flex justify-between text-sm mb-4 font-semibold text-gray-900">
                          <span>Gross Profit b/f</span>
                          <span>{reportData.grossProfit > 0 ? "₹ " + reportData.grossProfit.toLocaleString('en-IN', {minimumFractionDigits: 2}) : "₹ 0.00"}</span>
                       </div>
                       
                       <div className="flex justify-between text-sm mb-4 cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => handleBreakdown('Indirect Incomes', 'ledgers', l => l.group === 'Indirect Incomes')}>
                          <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Indirect Incomes</span>
                          <span className="text-gray-900 font-medium">₹ {reportData.indirectIncomes.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                       </div>
                       
                       <div className="pt-4 flex justify-between text-sm font-semibold">
                          <span className="text-gray-400">Net Loss</span>
                          <span className={reportData.netProfit < 0 ? "text-gray-900" : "text-gray-400"}>
                             {reportData.netProfit < 0 ? "₹ " + Math.abs(reportData.netProfit).toLocaleString('en-IN', {minimumFractionDigits: 2}) : "-"}
                          </span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}`;

const startIdx = code.indexOf("{activeReport === 'pnl' && (");
const endIdx = code.indexOf("{activeReport === 'balanceSheet' && (");
if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + pnlReplacement + "\n      " + code.substring(endIdx);
} else {
    console.error("Could not find pnl replacement block boundaries.");
}

fs.writeFileSync('src/pages/Reports.tsx', code);

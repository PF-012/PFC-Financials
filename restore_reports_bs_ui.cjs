const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const bsReplacement = `{activeReport === 'balanceSheet' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
           <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-0 md:border-r border-gray-200 flex flex-col">
                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-900">Liabilities</div>
                 <div className="flex-1 p-6 space-y-4">
                    <div className="flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => handleBreakdown('Capital Account', 'ledgers', l => l.group === 'Capital Account')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Capital Account</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.capital.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => handleBreakdown('Current Liabilities', 'ledgers', l => ['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes'].includes(l.group))}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Current Liabilities</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.currentLiabilities.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-gray-500">Profit & Loss A/c (Current Year)</span>
                       <span className={reportData.netProfit >= 0 ? "text-gray-900 font-medium" : "text-gray-400 font-medium"}>
                          {reportData.netProfit < 0 ? "₹ " + Math.abs(reportData.netProfit).toLocaleString('en-IN', {minimumFractionDigits: 2}) : "₹ " + reportData.netProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                       </span>
                    </div>
                    {reportData.prevNetProfit !== 0 && (
                      <div className="flex justify-between text-sm">
                         <span className="text-gray-500">Profit & Loss A/c (Previous Years)</span>
                         <span className={reportData.prevNetProfit >= 0 ? "text-gray-900 font-medium" : "text-gray-400 font-medium"}>
                            {reportData.prevNetProfit < 0 ? "₹ " + Math.abs(reportData.prevNetProfit).toLocaleString('en-IN', {minimumFractionDigits: 2}) : "₹ " + reportData.prevNetProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                         </span>
                      </div>
                    )}
                 </div>
              </div>
              <div className="p-0 flex flex-col">
                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 border-t md:border-t-0 font-medium text-gray-900">Assets</div>
                 <div className="flex-1 p-6 space-y-4">
                    <div className="flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => handleBreakdown('Fixed Assets', 'ledgers', l => l.group === 'Fixed Assets')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Fixed Assets</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.fixedAssets.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors" onClick={() => handleBreakdown('Current Assets', 'ledgers', l => ['Current Assets', 'Sundry Debtors', 'Cash-in-Hand', 'Bank Accounts'].includes(l.group))}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Current Assets</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.currentAssets.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}`;

const startIdx = code.indexOf("{activeReport === 'balanceSheet' && (");
const endIdx = code.indexOf("{activeReport === 'trialBalance' && (");
if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + bsReplacement + "\n      " + code.substring(endIdx);
}

fs.writeFileSync('src/pages/Reports.tsx', code);

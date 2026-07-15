const fs = require('fs');
const code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const bsRegex = /\{activeReport === 'balanceSheet' && \([\s\S]*?\{activeReport === 'trialBalance' && \(/;
const match = code.match(bsRegex);

if (match) {
  const replacement = `{activeReport === 'balanceSheet' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
           <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-0 md:border-r border-gray-200 flex flex-col">
                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-900">Liabilities</div>
                 <div className="flex-1 p-6 space-y-4">
                    <div className={\`flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors\`} onClick={() => handleBreakdown('Capital Account', 'ledgers', l => l.group === 'Capital Account')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Capital Account</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.capital.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className={\`flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors\`} onClick={() => handleBreakdown('Current Liabilities', 'ledgers', l => ['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes'].includes(l.group))}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Current Liabilities</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.currentLiabilities.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-gray-700">Profit & Loss A/c (Current Year)</span>
                       <span className={reportData.netProfit >= 0 ? "text-gray-900 font-medium" : "text-red-600 font-medium"}>
                          {reportData.netProfit < 0 ? "-" : ""}₹ {Math.abs(reportData.netProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                       </span>
                    </div>
                    {reportData.prevNetProfit !== 0 && (
                      <div className="flex justify-between text-sm">
                         <span className="text-gray-700">Profit & Loss A/c (Previous Years)</span>
                         <span className={reportData.prevNetProfit >= 0 ? "text-gray-900 font-medium" : "text-red-600 font-medium"}>
                            {reportData.prevNetProfit < 0 ? "-" : ""}₹ {Math.abs(reportData.prevNetProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                         </span>
                      </div>
                    )}
                    {/* Spacer */}
                    <div className="flex-1"></div>
                    <div className="pt-4 mt-auto border-t-2 border-gray-800 flex justify-between text-sm font-bold text-gray-900">
                       <span>Total</span>
                       <span>₹ {(reportData.capital + reportData.currentLiabilities + reportData.netProfit + reportData.prevNetProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                 </div>
              </div>
              <div className="p-0 flex flex-col">
                 <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 border-t md:border-t-0 font-semibold text-gray-900">Assets</div>
                 <div className="flex-1 p-6 space-y-4">
                    <div className={\`flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors\`} onClick={() => handleBreakdown('Fixed Assets', 'ledgers', l => l.group === 'Fixed Assets')}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Fixed Assets</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.fixedAssets.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className={\`flex justify-between text-sm cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors\`} onClick={() => handleBreakdown('Current Assets', 'ledgers', l => ['Current Assets', 'Sundry Debtors', 'Cash-in-Hand', 'Bank Accounts'].includes(l.group))}>
                       <span className="text-blue-600 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600">Current Assets</span>
                       <span className="text-gray-900 font-medium">₹ {reportData.currentAssets.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    {/* Spacer */}
                    <div className="flex-1"></div>
                    <div className="pt-4 mt-auto border-t-2 border-gray-800 flex justify-between text-sm font-bold text-gray-900">
                       <span>Total</span>
                       <span>₹ {(reportData.fixedAssets + reportData.currentAssets).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeReport === 'trialBalance' && (`

  fs.writeFileSync('src/pages/Reports.tsx', code.replace(match[0], replacement));
}

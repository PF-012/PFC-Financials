const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(
  /<div className="mt-8 pt-6 border-t-2 border-gray-200">\s*<div className={`flex justify-between text-sm mb-4 cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors`} onClick=\{/g,
  `<div className="mt-8 pt-6 border-t-2 border-gray-200">
                       <div className="flex justify-between text-sm mb-4">
                          <span className={reportData.grossProfit < 0 ? "text-gray-900 font-semibold" : "text-gray-400 font-semibold"}>Gross Loss b/f</span>
                          <span className={reportData.grossProfit < 0 ? "text-gray-900 font-medium" : "text-gray-400 font-medium"}>{reportData.grossProfit < 0 ? \`₹ \${Math.abs(reportData.grossProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}\` : '-'}</span>
                       </div>
                       <div className={\`flex justify-between text-sm mb-4 cursor-pointer active:bg-gray-200 md:hover:bg-gray-100 -mx-2 px-2 py-1 rounded transition-colors\`} onClick={`
);

fs.writeFileSync('src/pages/Reports.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// Gross Profit c/o (Dr side)
code = code.replace(
  /<div className="pt-4 border-t border-gray-100 flex justify-between text-sm font-semibold">\s*<span className="text-gray-900">Gross Profit c\/o<\/span>\s*<span className="text-gray-900">₹ \{Math.max\(0, reportData.grossProfit\).toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}<\/span>\s*<\/div>/g,
  `<div className="pt-4 border-t border-gray-100 flex justify-between text-sm font-semibold">
                       <span className={reportData.grossProfit > 0 ? "text-gray-900" : "text-gray-400"}>Gross Profit c/o</span>
                       <span className={reportData.grossProfit > 0 ? "text-gray-900" : "text-gray-400"}>{reportData.grossProfit > 0 ? \`₹ \${reportData.grossProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}\` : '-'}</span>
                    </div>`
);

// Net Profit (Dr side)
code = code.replace(
  /<div className="flex justify-between text-sm font-semibold">\s*<span className="text-blue-900">Net Profit<\/span>\s*<span className="text-blue-900">₹ \{Math.max\(0, reportData.netProfit\).toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}<\/span>\s*<\/div>/g,
  `<div className="flex justify-between text-sm font-semibold">
                          <span className={reportData.netProfit > 0 ? "text-blue-900" : "text-gray-400"}>Net Profit</span>
                          <span className={reportData.netProfit > 0 ? "text-blue-900" : "text-gray-400"}>{reportData.netProfit > 0 ? \`₹ \${reportData.netProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}\` : '-'}</span>
                       </div>`
);

// Gross Profit b/f (Cr side)
code = code.replace(
  /<div className="flex justify-between text-sm mb-4">\s*<span className="text-gray-900 font-semibold">Gross Profit b\/f<\/span>\s*<span className="text-gray-900 font-medium">₹ \{Math.max\(0, reportData.grossProfit\).toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}<\/span>\s*<\/div>/g,
  `<div className="flex justify-between text-sm mb-4">
                          <span className={reportData.grossProfit > 0 ? "text-gray-900 font-semibold" : "text-gray-400 font-semibold"}>Gross Profit b/f</span>
                          <span className={reportData.grossProfit > 0 ? "text-gray-900 font-medium" : "text-gray-400 font-medium"}>{reportData.grossProfit > 0 ? \`₹ \${reportData.grossProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}\` : '-'}</span>
                       </div>`
);


fs.writeFileSync('src/pages/Reports.tsx', code);

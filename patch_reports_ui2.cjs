const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// Gross Loss c/o (Cr side)
code = code.replace(
  /<div className="pt-4 border-t border-gray-100 flex justify-between text-sm font-semibold text-gray-400">\s*<span>Gross Loss c\/o<\/span>\s*<span>\{reportData.grossProfit < 0 \? \`₹ \$\{Math.abs\(reportData.grossProfit\).toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}\` : '-'}<\/span>\s*<\/div>/g,
  `<div className="pt-4 border-t border-gray-100 flex justify-between text-sm font-semibold">
                       <span className={reportData.grossProfit < 0 ? "text-gray-900" : "text-gray-400"}>Gross Loss c/o</span>
                       <span className={reportData.grossProfit < 0 ? "text-gray-900" : "text-gray-400"}>{reportData.grossProfit < 0 ? \`₹ \${Math.abs(reportData.grossProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}\` : '-'}</span>
                    </div>`
);

// Net Loss (Cr side)
code = code.replace(
  /<div className="flex justify-between text-sm font-semibold text-gray-400">\s*<span>Net Loss<\/span>\s*<span>\{reportData.netProfit < 0 \? \`₹ \$\{Math.abs\(reportData.netProfit\).toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}\` : '-'}<\/span>\s*<\/div>/g,
  `<div className="flex justify-between text-sm font-semibold">
                          <span className={reportData.netProfit < 0 ? "text-red-600" : "text-gray-400"}>Net Loss</span>
                          <span className={reportData.netProfit < 0 ? "text-red-600" : "text-gray-400"}>{reportData.netProfit < 0 ? \`₹ \${Math.abs(reportData.netProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}\` : '-'}</span>
                       </div>`
);


// Gross Loss b/f (Dr side)
code = code.replace(
  /<div className="flex justify-between text-sm mb-4">\s*<span className="text-gray-900 font-semibold">Gross Loss b\/f<\/span>\s*<span className="text-gray-900 font-medium">₹ \{Math.abs\(Math.min\(0, reportData.grossProfit\)\).toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}<\/span>\s*<\/div>/g,
  `<div className="flex justify-between text-sm mb-4">
                          <span className={reportData.grossProfit < 0 ? "text-gray-900 font-semibold" : "text-gray-400 font-semibold"}>Gross Loss b/f</span>
                          <span className={reportData.grossProfit < 0 ? "text-gray-900 font-medium" : "text-gray-400 font-medium"}>{reportData.grossProfit < 0 ? \`₹ \${Math.abs(reportData.grossProfit).toLocaleString('en-IN', {minimumFractionDigits: 2})}\` : '-'}</span>
                       </div>`
);

fs.writeFileSync('src/pages/Reports.tsx', code);

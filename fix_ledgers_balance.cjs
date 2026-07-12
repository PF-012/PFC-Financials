const fs = require('fs');
let content = fs.readFileSync('src/pages/Ledgers.tsx', 'utf8');

const replacement = `
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              ₹ {Math.abs(Number(l.openingBalance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              <span className="text-gray-500 ml-1 text-xs">{(Number(l.openingBalance) || 0) > 0 ? 'Dr' : (Number(l.openingBalance) || 0) < 0 ? 'Cr' : ''}</span>
                           </td>`;

content = content.replace(
  /<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">\s*₹ \{Math\.abs\(l\.openingBalance\)\.toLocaleString\('en-IN', \{ minimumFractionDigits: 2 \}\)\}\s*<span className="text-gray-500 ml-1 text-xs">\{l\.openingBalance > 0 \? 'Dr' : l\.openingBalance < 0 \? 'Cr' : ''\}<\/span>\s*<\/td>/,
  replacement.trim()
);

fs.writeFileSync('src/pages/Ledgers.tsx', content);

const fs = require('fs');
let code = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

code = code.replace(
  /<button onClick=\{\(\) => setPrintingVoucher\(v\)\} className="text-gray-500 hover:text-gray-700" title="Print\/Download PDF">/g,
  '<button onClick={(e) => { e.stopPropagation(); setPrintingVoucher(v); }} className="text-gray-500 hover:text-gray-700" title="Print/Download PDF">'
);

fs.writeFileSync('src/pages/Vouchers.tsx', code);

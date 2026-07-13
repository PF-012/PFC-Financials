const fs = require('fs');

let admin = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
admin = admin.replace(/\], \[filteredCompanies\]\)\}/g, '], [filteredCompanies])\n          )}');
admin = admin.replace(/\]\), \[filteredCompanies\]\)\}/g, '], [filteredCompanies])\n          )}');
admin = admin.replace(/\]\)\}/g, '])\n          )}'); // wait this might be dangerous

fs.writeFileSync('src/pages/Admin.tsx', admin);

console.log("Fixed");

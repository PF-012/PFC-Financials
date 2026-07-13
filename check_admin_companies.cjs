const fs = require('fs');
let admin = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
if (!admin.includes('console.log("Admin companies length:"')) {
  admin = admin.replace(
    'setCompanies(data);',
    'setCompanies(data); console.log("Admin companies length:", data.length, data.map(d => d.name));'
  );
  fs.writeFileSync('src/pages/Admin.tsx', admin);
}

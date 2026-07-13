const fs = require('fs');
let admin = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
admin = admin.replace(
  /c\.email\.includes\(searchTerm\)/g,
  "(c.email || '').includes(searchTerm)"
);
fs.writeFileSync('src/pages/Admin.tsx', admin);

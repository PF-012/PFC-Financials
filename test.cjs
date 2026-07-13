const fs = require('fs');
let admin = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
admin = admin.replace(
  "const filteredCompanies = React.useMemo(() => companies.filter(c =>",
  "console.log('ALL COMPANIES:', companies);\n  const filteredCompanies = React.useMemo(() => companies.filter(c =>"
);
fs.writeFileSync('src/pages/Admin.tsx', admin);

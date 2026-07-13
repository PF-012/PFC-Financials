const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

content = content.replace(
  /const filteredRequests = requests\.filter\(r =>[\s\S]*?r\.txnId\.includes\(searchTerm\)\s*\);/,
  `const filteredRequests = React.useMemo(() => requests.filter(r => 
    r.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.whatsapp.includes(searchTerm) || 
    r.txnId.includes(searchTerm)
  ), [requests, searchTerm]);`
);

content = content.replace(
  /const filteredCompanies = companies\.filter\(c =>[\s\S]*?\(c\.name\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\) \|\| c\.email\.includes\(searchTerm\)\)\s*\);/,
  `const filteredCompanies = React.useMemo(() => companies.filter(c =>
    (c.license && c.license.type !== 'free') &&
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.includes(searchTerm))
  ), [companies, searchTerm]);`
);

fs.writeFileSync('src/pages/Admin.tsx', content);
console.log("Patched Admin.tsx");

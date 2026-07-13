const fs = require('fs');

let comp = fs.readFileSync('src/pages/Companies.tsx', 'utf8');
comp = comp.replace(/React\.useMemo\(\(\) => \(/g, '(');
comp = comp.replace(/\),\ \[(.*?)\]\)/g, ')');
fs.writeFileSync('src/pages/Companies.tsx', comp);

let admin = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
admin = admin.replace(/React\.useMemo\(\(\) => \(\s*<table/g, '<table');
admin = admin.replace(/<\/table>\s*\),\ \[filteredRequests\]\)/g, '</table>');
admin = admin.replace(/<\/table>\s*\),\ \[filteredCompanies\]\)/g, '</table>');
fs.writeFileSync('src/pages/Admin.tsx', admin);

console.log("Fixed useMemo");

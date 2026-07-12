const fs = require('fs');
let content = fs.readFileSync('src/components/SearchableSelect.tsx', 'utf8');

content = content.replace(
  /o\.name\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)/g,
  "String(o.name || '').toLowerCase().includes(String(search || '').toLowerCase())"
);

fs.writeFileSync('src/components/SearchableSelect.tsx', content);

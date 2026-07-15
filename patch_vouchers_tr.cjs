const fs = require('fs');
let code = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

code = code.replace(
  /onClick=\{\(\) => \{ handleEdit\(v\); \}\}/g,
  "onClick={() => { setSelectedIndex(index); }}"
);

fs.writeFileSync('src/pages/Vouchers.tsx', code);

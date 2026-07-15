const fs = require('fs');
let code = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

code = code.replace(
  /onClick=\{\(\) => \{ setSelectedIndex\(index\); \}\}/g,
  "onClick={() => { handleEdit(v); }}"
);

fs.writeFileSync('src/pages/Vouchers.tsx', code);

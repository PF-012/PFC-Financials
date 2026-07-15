const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(/reportData\.ledgerBalances\[/g, '(reportData.ledgerBalances || {})[');
code = code.replace(/reportData\.currentChanges\[/g, '(reportData.currentChanges || {})[');

fs.writeFileSync('src/pages/Reports.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

// I just need to make sure Voucher and Ledger are exported.

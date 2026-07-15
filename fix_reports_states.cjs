const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

if (!code.includes('const [vouchers, setVouchers] = useState')) {
  code = code.replace(/const \[loading, setLoading\] = useState\(true\);/, `const [loading, setLoading] = useState(true);\n  const [vouchers, setVouchers] = useState<Voucher[]>([]);\n  const [ledgers, setLedgers] = useState<Ledger[]>([]);`);
  fs.writeFileSync('src/pages/Reports.tsx', code);
}

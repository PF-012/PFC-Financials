const fs = require('fs');

function processFile(path, isDashboard = false, isReports = false) {
    let code = fs.readFileSync(path, 'utf8');
    
    // Replace const [vouchers, setVouchers] = useState<Voucher[]>([]);
    code = code.replace(/const \[vouchers, setVouchers\] = useState<Voucher\[\]>\(\[\]\);/g, '');
    code = code.replace(/const \[ledgers, setLedgers\] = useState<Ledger\[\]>\(\[\]\);/g, '');
    
    // Update useAppContext
    if (code.includes('const { activeCompany } = useAppContext()')) {
        code = code.replace(/const \{ activeCompany \} = useAppContext\(\);/, 'const { activeCompany, ledgers: globalLedgers, vouchers: globalVouchers } = useAppContext();\n  const ledgers = globalLedgers.filter(l => l.companyId === activeCompany?.id);\n  const vouchers = globalVouchers.filter(v => v.companyId === activeCompany?.id);');
    } else if (code.includes('const { activeCompany, financialYear } = useAppContext()')) {
        code = code.replace(/const \{ activeCompany, financialYear \} = useAppContext\(\);/, 'const { activeCompany, financialYear, ledgers: globalLedgers, vouchers: globalVouchers } = useAppContext();\n  const ledgers = globalLedgers.filter(l => l.companyId === activeCompany?.id);\n  const vouchers = globalVouchers.filter(v => v.companyId === activeCompany?.id);');
    }

    // Remove useEffect for onSnapshot
    const effectRegex = /useEffect\(\(\) => \{\s*if \(\!activeCompany \|\| \!user\) return;[\s\S]*?return \(\) => .*?;\s*\}, \[activeCompany, user\]\);/g;
    code = code.replace(effectRegex, '');
    
    if (isDashboard) {
        // Special fix for Dashboard
        code = code.replace(/const q = query\(collection\(db, 'vouchers'\), where\('userId', '==', user\.id\)\);[\s\S]*?return \(\) => unsub\(\);/g, `
        let sales = 0;
        let purchases = 0;
        const compVouchers = vouchers.filter(v => v.date >= financialYear.start && v.date <= financialYear.end);
        compVouchers.forEach(v => {
           if (v.type === 'Sales') sales += v.totalAmount;
           if (v.type === 'Purchase') purchases += v.totalAmount;
        });
        setStats({ sales, purchases, totalVouchers: compVouchers.length });
        `);
    }

    if (isReports) {
        code = code.replace(/const checkDone = \(\) => \{[\s\S]*?checkDone\(\);\s*\}\);[\s\S]*?return \(\) => \{ unsubV\(\); unsubL\(\); \};/g, 'setLoading(false);');
    }

    fs.writeFileSync(path, code);
}

processFile('src/pages/Ledgers.tsx');
processFile('src/pages/Vouchers.tsx');
processFile('src/pages/DayBook.tsx');
processFile('src/pages/Dashboard.tsx', true);
processFile('src/pages/Reports.tsx', false, true);


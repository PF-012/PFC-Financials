const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

code = code.replace(/import { Company } from '\.\.\/types';/, "import { Company, Ledger, Voucher } from '../types';");

const typeRegex = /interface AppContextType \{[\s\S]*?availableYears: FinancialYear\[\];/;
const newType = `interface AppContextType {
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompany: (company: Company) => void;
  loading: boolean;
  financialYear: FinancialYear;
  setFinancialYear: (fy: FinancialYear) => void;
  availableYears: FinancialYear[];
  ledgers: Ledger[];
  vouchers: Voucher[];`;
code = code.replace(typeRegex, newType);

const stateRegex = /const \[financialYear, setFinancialYear\] = useState<FinancialYear>\(getFinancialYearDates\(\)\);[\s\S]*?const availableYears = generateAvailableYears\(\);/;
const newState = `const [financialYear, setFinancialYear] = useState<FinancialYear>(getFinancialYearDates());
  const availableYears = generateAvailableYears();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);`;
code = code.replace(stateRegex, newState);

const effectRegex = /const q = query\(collection\(db, 'companies'\), where\('userId', '==', user\.id\)\);[\s\S]*?return \(\) => unsubscribe\(\);/;
const newEffect = `
    const q = query(collection(db, 'companies'), where('userId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(comps);
      
      setActiveCompany(prevActive => {
        if (comps.length > 0 && !prevActive) {
          return comps[0];
        } else if (comps.length === 0) {
          return null;
        } else if (prevActive && !comps.find(c => c.id === prevActive.id)) {
          return comps[0] || null;
        }
        return prevActive;
      });
      
      setLoading(false);
    });

    const lq = query(collection(db, 'ledgers'), where('userId', '==', user.id));
    const unsubL = onSnapshot(lq, (snap) => {
       setLedgers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ledger)));
    });

    const vq = query(collection(db, 'vouchers'), where('userId', '==', user.id));
    const unsubV = onSnapshot(vq, (snap) => {
       setVouchers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voucher)));
    });

    return () => { unsubscribe(); unsubL(); unsubV(); };`;
code = code.replace(effectRegex, newEffect);

const providerRegex = /<AppContext\.Provider value=\{\{ companies, activeCompany, setActiveCompany, loading, financialYear, setFinancialYear, availableYears \}\}>/;
const newProvider = `<AppContext.Provider value={{ companies, activeCompany, setActiveCompany, loading, financialYear, setFinancialYear, availableYears, ledgers, vouchers }}>`;
code = code.replace(providerRegex, newProvider);

fs.writeFileSync('src/context/AppContext.tsx', code);

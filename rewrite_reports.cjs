const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// Replace loadData with a reactive approach

// First, find the state variables and add state for vouchers and ledgers
const stateRegex = /const \[reportData, setReportData\] = useState[\s\S]*?const \[loading, setLoading\] = useState\(true\);/g;
const newStates = `const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);`;

code = code.replace(stateRegex, newStates);

// Replace useEffect and loadData
const loadDataRegex = /useEffect\(\(\) => \{\s*if \(activeCompany && user\) \{\s*loadData\(\);\s*\}\s*\}, \[activeCompany, user, fromDate, toDate\]\);[\s\S]*?setLoading\(false\);\s*\}\s*\};/g;

const newLoadData = `useEffect(() => {
    if (!activeCompany || !user) return;
    
    setLoading(true);
    
    const vq = query(collection(db, 'vouchers'), where('userId', '==', user.id));
    const lq = query(collection(db, 'ledgers'), where('userId', '==', user.id));
    
    let vLoaded = false;
    let lLoaded = false;
    
    const checkDone = () => {
      if (vLoaded && lLoaded) setLoading(false);
    };

    const unsubV = onSnapshot(vq, (snap) => {
      setVouchers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voucher)).filter(v => v.companyId === activeCompany.id));
      vLoaded = true;
      checkDone();
    });
    
    const unsubL = onSnapshot(lq, (snap) => {
      setLedgers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ledger)).filter(l => l.companyId === activeCompany.id && String(l.name || '').trim() && l.name !== 'Unknown'));
      lLoaded = true;
      checkDone();
    });

    return () => { unsubV(); unsubL(); };
  }, [activeCompany, user]);

  useEffect(() => {
    if (loading) return;
    
    try {
      const allVouchers = vouchers;
      
      const ledgerBalances: Record<string, number> = {};
      ledgers.forEach(l => {
         ledgerBalances[l.id] = l.openingBalance || 0;
      });

      let totalSales = 0, totalPurchases = 0, totalReceipts = 0, totalPayments = 0;
      let prevTotalSales = 0, prevTotalPurchases = 0;
      let unassignedReceipts = 0, unassignedPayments = 0, unassignedDuties = 0, unassignedSales = 0, unassignedPurchases = 0;

      const currentChanges: Record<string, number> = {};
      const prevChanges: Record<string, number> = {};

      const relevantVouchers = allVouchers.filter(v => v.date <= toDate);
      const currentVouchers = relevantVouchers.filter(v => v.date >= fromDate);

      relevantVouchers.forEach(v => {
        const isCurrent = v.date >= fromDate;
        const totalGst = (v.cgstAmount || 0) + (v.sgstAmount || 0) + (v.igstAmount || 0) + (v.gstAmount || 0);
        const baseAmt = (v.totalAmount || 0) - totalGst + (v.tdsAmount || 0);

        const applyToLedger = (id: string, amt: number) => {
           ledgerBalances[id] = (ledgerBalances[id] || 0) + amt;
           if (isCurrent) currentChanges[id] = (currentChanges[id] || 0) + amt;
           else prevChanges[id] = (prevChanges[id] || 0) + amt;
        };

        const getLedgerGroup = (id: string) => ledgers.find(l => l.id === id)?.group;

        if (v.type === 'Sales') {
            if (isCurrent) totalSales += baseAmt; else prevTotalSales += baseAmt;
            if (v.accountId) applyToLedger(v.accountId, -baseAmt);
            else if (isCurrent) unassignedSales += baseAmt;
            if (v.partyId) applyToLedger(v.partyId, v.totalAmount || 0);
            if (v.cgstAmount || v.sgstAmount || v.igstAmount || v.gstAmount) {
                const dutiesLedger = ledgers.find(l => l.group === 'Duties & Taxes');
                if (dutiesLedger) applyToLedger(dutiesLedger.id, -totalGst);
                else if (isCurrent) unassignedDuties -= totalGst;
            }
        } else if (v.type === 'Purchase') {
            if (isCurrent) totalPurchases += baseAmt; else prevTotalPurchases += baseAmt;
            if (v.accountId) applyToLedger(v.accountId, baseAmt);
            else if (isCurrent) unassignedPurchases += baseAmt;
            if (v.partyId) applyToLedger(v.partyId, -(v.totalAmount || 0));
            if (v.cgstAmount || v.sgstAmount || v.igstAmount || v.gstAmount) {
                const dutiesLedger = ledgers.find(l => l.group === 'Duties & Taxes');
                if (dutiesLedger) applyToLedger(dutiesLedger.id, totalGst);
                else if (isCurrent) unassignedDuties += totalGst;
            }
        } else if (v.type === 'Receipt') {
            const isCashBank = v.accountId && ['Bank Accounts', 'Cash-in-Hand'].includes(getLedgerGroup(v.accountId) || '');
            if (isCurrent) totalReceipts += baseAmt;
            if (isCashBank) {
                applyToLedger(v.accountId, baseAmt);
            } else {
                if (isCurrent) unassignedReceipts += baseAmt;
            }
            if (v.partyId) applyToLedger(v.partyId, -baseAmt);
        } else if (v.type === 'Payment') {
            const isCashBank = v.accountId && ['Bank Accounts', 'Cash-in-Hand'].includes(getLedgerGroup(v.accountId) || '');
            if (isCurrent) totalPayments += baseAmt;
            if (isCashBank) {
                applyToLedger(v.accountId, -baseAmt);
            } else {
                if (isCurrent) unassignedPayments += baseAmt;
            }
            if (v.partyId) applyToLedger(v.partyId, baseAmt);
        } else if (v.type === 'Contra') {
            if (v.accountId) applyToLedger(v.accountId, baseAmt);
            if (v.partyId) applyToLedger(v.partyId, -baseAmt);
        } else if (v.type === 'Journal') {
            if (v.accountId) applyToLedger(v.accountId, baseAmt);
            if (v.partyId) applyToLedger(v.partyId, -baseAmt);
        }
      });

      let capital = 0;
      let currentLiabilities = 0;
      let fixedAssets = 0;
      let currentAssets = 0;
      
      let directExpenses = 0, directIncomes = 0, indirectExpenses = 0, indirectIncomes = 0;
      let prevDirectExpenses = 0, prevDirectIncomes = 0, prevIndirectExpenses = 0, prevIndirectIncomes = 0;

      ledgers.forEach(l => {
         const curChange = currentChanges[l.id] || 0;
         const prevChange = prevChanges[l.id] || 0;
         const finalBal = ledgerBalances[l.id];

         if (l.group === 'Capital Account') capital -= finalBal;
         else if (l.group === 'Current Liabilities' || l.group === 'Sundry Creditors' || l.group === 'Duties & Taxes') {
            currentLiabilities -= finalBal;
         }
         else if (l.group === 'Fixed Assets') fixedAssets += finalBal;
         else if (l.group === 'Current Assets' || l.group === 'Cash-in-Hand' || l.group === 'Bank Accounts' || l.group === 'Sundry Debtors') {
            currentAssets += finalBal;
         }

         if (l.group === 'Indirect Expenses') indirectExpenses += curChange;
         else if (l.group === 'Indirect Incomes') indirectIncomes -= curChange;
         else if (l.group === 'Direct Expenses') directExpenses += curChange;
         else if (l.group === 'Direct Incomes') directIncomes -= curChange;
         else if (l.group === 'Purchase Accounts') totalPurchases += curChange;
         else if (l.group === 'Sales Accounts') totalSales -= curChange;

         if (l.group === 'Indirect Expenses') prevIndirectExpenses += prevChange;
         else if (l.group === 'Indirect Incomes') prevIndirectIncomes -= prevChange;
         else if (l.group === 'Direct Expenses') prevDirectExpenses += prevChange;
         else if (l.group === 'Direct Incomes') prevDirectIncomes -= prevChange;
         else if (l.group === 'Purchase Accounts') prevTotalPurchases += prevChange;
         else if (l.group === 'Sales Accounts') prevTotalSales -= prevChange;
      });

      if (unassignedDuties < 0) {
         currentLiabilities -= unassignedDuties;
      } else {
         currentAssets += unassignedDuties;
      }
      
      const openingStock = 0;
      const closingStock = 0;

      const grossProfit = totalSales + directIncomes + closingStock - (openingStock + totalPurchases + directExpenses);
      const netProfit = grossProfit + indirectIncomes - indirectExpenses;

      const prevGrossProfit = prevTotalSales + prevDirectIncomes + closingStock - (openingStock + prevTotalPurchases + prevDirectExpenses);
      const prevNetProfit = prevGrossProfit + prevIndirectIncomes - prevIndirectExpenses;
      
      setReportData({
        totalSales,
        totalPurchases,
        totalReceipts,
        totalPayments,
        openingStock,
        closingStock,
        directExpenses,
        directIncomes,
        indirectExpenses,
        indirectIncomes,
        grossProfit,
        netProfit,
        prevNetProfit,
        capital,
        currentLiabilities,
        fixedAssets,
        currentAssets,
        unassignedCash: unassignedReceipts - unassignedPayments,
        unassignedDuties,
        unassignedSales,
        unassignedPurchases,
        allVouchers: currentVouchers,
        allLedgers: ledgers,
        ledgerBalances
      });
    } catch (error) {
      console.error("Error calculating report data:", error);
    }
  }, [vouchers, ledgers, loading, fromDate, toDate]);`;

code = code.replace(loadDataRegex, newLoadData);

fs.writeFileSync('src/pages/Reports.tsx', code);

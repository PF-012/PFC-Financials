const fs = require('fs');
let content = fs.readFileSync('src/pages/DayBook.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\s*if \(\!activeCompany \|\| \!user\) return;\s*const q = query\([\s\S]*?\}, \[activeCompany, user, fromDate, toDate, typeFilter\]\);/;

const replacement = `useEffect(() => {
    if (!activeCompany || !user) return;
    const q = query(
      collection(db, 'vouchers'),
      where('userId', '==', user.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let v = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voucher));
      setVouchers(v.filter(voucher => voucher.companyId === activeCompany.id));
    });
    return () => unsubscribe();
  }, [activeCompany, user]);

  const filteredVouchers = React.useMemo(() => {
    let v = vouchers.filter(voucher => voucher.date >= fromDate && voucher.date <= toDate && (typeFilter ? voucher.type === typeFilter : true));
    return v.sort((a, b) => {
      const typeOrder = ["Purchase","Sales","Payment","Receipt","Journal","Contra","Credit Note","Debit Note","Sales Order","Purchase Order"];
      const getOrder = (t) => {
        const idx = typeOrder.indexOf(t);
        return idx === -1 ? 999 : idx;
      };
      const typeDiff = getOrder(a.type) - getOrder(b.type);
      if (typeDiff !== 0) return typeDiff;
      
      const numSort = String(a.number || '').localeCompare(String(b.number || ''), undefined, { numeric: true });
      if (numSort !== 0) return numSort;
      
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [vouchers, fromDate, toDate, typeFilter]);`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/DayBook.tsx', content);
console.log("Replaced");

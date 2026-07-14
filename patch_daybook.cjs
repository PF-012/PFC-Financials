const fs = require('fs');
let code = fs.readFileSync('src/pages/DayBook.tsx', 'utf8');

// 1. Fix filteredVouchers logic
const oldFilterBlock = /const filteredVouchers = React\.useMemo\(\(\) => \{[\s\S]*?\}, \[vouchers, fromDate, toDate, typeFilter\]\);/;
const newFilterBlock = `const filteredVouchers = React.useMemo(() => {
    let v = vouchers.filter(voucher => voucher.date >= fromDate && voucher.date <= toDate && (typeFilter ? voucher.type === typeFilter : true));
    return v.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;

      const typeOrder = ["Purchase","Sales","Payment","Receipt","Journal","Contra","Credit Note","Debit Note","Sales Order","Purchase Order"];
      const getOrder = (t) => {
        const idx = typeOrder.indexOf(t);
        return idx === -1 ? 999 : idx;
      };
      const typeDiff = getOrder(a.type) - getOrder(b.type);
      if (typeDiff !== 0) return typeDiff;
      
      return String(a.number || '').localeCompare(String(b.number || ''), undefined, { numeric: true });
    });
  }, [vouchers, fromDate, toDate, typeFilter]);`;

code = code.replace(oldFilterBlock, newFilterBlock);

// 2. Fix references from `vouchers` to `filteredVouchers` within the component, but NOT the `vouchers` state or database refs.
// Looking at the grep output, the places to change are line 179 and onwards.
// Wait, a safer way is to replace `vouchers.length`, `vouchers[selectedIndex]`, `vouchers.map`, but wait, `vouchers.map` might be used in `setVouchers(v.filter(...))`.
// Let's do a carefully crafted manual replace of the render part and keyboard handlers.

code = code.replace(/if \(vouchers\.length === 0\) return;/g, "if (filteredVouchers.length === 0) return;");
code = code.replace(/setSelectedIndex\(prev => \(prev < vouchers\.length - 1 \? prev \+ 1 : prev\)\);/g, "setSelectedIndex(prev => (prev < filteredVouchers.length - 1 ? prev + 1 : prev));");
code = code.replace(/selectedIndex < vouchers\.length/g, "selectedIndex < filteredVouchers.length");
code = code.replace(/vouchers\[selectedIndex\]/g, "filteredVouchers[selectedIndex]");
code = code.replace(/\[vouchers, selectedIndex, selectedIds\]\)/g, "[filteredVouchers, selectedIndex, selectedIds])");
code = code.replace(/setSelectedIds\(vouchers\.map\(v => v\.id\)\);/g, "setSelectedIds(filteredVouchers.map(v => v.id));");
code = code.replace(/checked=\{vouchers\.length > 0 && selectedIds\.length === vouchers\.length\}/g, "checked={filteredVouchers.length > 0 && selectedIds.length === filteredVouchers.length}");
code = code.replace(/vouchers\.length === 0 \? \(/g, "filteredVouchers.length === 0 ? (");
code = code.replace(/vouchers\.map\(\(v, index\) => \{/g, "filteredVouchers.map((v, index) => {");

fs.writeFileSync('src/pages/DayBook.tsx', code);

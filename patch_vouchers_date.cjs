const fs = require('fs');
let code = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

const target = `  const filteredVouchers = sortedVouchers.filter(v => {
      const matchSearch = (v.partyId || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (v.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (v.narration || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = v.date >= fromDate && v.date <= toDate;`;

const replacement = `  const normalizeDate = (dString: string) => {
      if (!dString) return "1970-01-01";
      if (typeof dString !== 'string') return "1970-01-01";
      if (dString.match(/^\\d{4}-\\d{2}-\\d{2}$/)) return dString;
      const match = dString.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})$/);
      if (match) {
          return \`\${match[3]}-\${match[2].padStart(2, '0')}-\${match[1].padStart(2, '0')}\`;
      }
      const date = new Date(dString);
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
      return dString;
  };

  const filteredVouchers = sortedVouchers.filter(v => {
      const matchSearch = (v.partyId || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (v.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (v.narration || '').toLowerCase().includes(searchTerm.toLowerCase());
      const normDate = normalizeDate(v.date);
      const matchDate = normDate >= fromDate && normDate <= toDate;`;

code = code.replace(target, replacement);

// Fix date input to ensure format
const target2 = `           date: parsed.date || initialForm.date,`;
const replacement2 = `           date: normalizeDate(parsed.date) || initialForm.date,`;
code = code.replace(target2, replacement2);

fs.writeFileSync('src/pages/Vouchers.tsx', code);
console.log("Patched Vouchers.tsx date parsing");

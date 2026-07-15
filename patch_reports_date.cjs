const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const target = `      const relevantVouchers = allVouchers.filter(v => v.date <= toDate);
      const currentVouchers = relevantVouchers.filter(v => v.date >= fromDate);`;

const replacement = `      const normalizeDate = (dString) => {
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

      const relevantVouchers = allVouchers.filter(v => normalizeDate(v.date) <= toDate);
      const currentVouchers = relevantVouchers.filter(v => normalizeDate(v.date) >= fromDate);`;

code = code.replace(target, replacement);

const target2 = `        const isCurrent = v.date >= fromDate;`;
const replacement2 = `        const isCurrent = normalizeDate(v.date) >= fromDate;`;
code = code.replace(target2, replacement2);

fs.writeFileSync('src/pages/Reports.tsx', code);
console.log("Patched Reports.tsx date parsing");

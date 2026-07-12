const fs = require('fs');

const files = ['src/pages/ImportExport.tsx', 'src/pages/Vouchers.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /l\.name\.toLowerCase\(\) === item\.name\.toLowerCase\(\)/g,
    "String(l.name || '').toLowerCase() === String(item.name || '').toLowerCase()"
  );
  
  content = content.replace(
    /l\.name\.toLowerCase\(\) === parsed\.partyName\.toLowerCase\(\)/g,
    "String(l.name || '').toLowerCase() === String(parsed.partyName || '').toLowerCase()"
  );
  
  content = content.replace(
    /lName\.toLowerCase\(\)/g,
    "String(lName || '').toLowerCase()"
  );

  fs.writeFileSync(file, content);
}

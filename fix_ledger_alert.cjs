const fs = require('fs');
const files = ['src/pages/Ledgers.tsx', 'src/pages/Companies.tsx', 'src/pages/Vouchers.tsx'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/catch \((error: any|error)\) \{\n\s*console\.error\(error\);\n\s*\}/g, "catch (error: any) { console.error(error); alert(error.message || 'An error occurred while saving.'); }");
  fs.writeFileSync(file, content);
}

const fs = require('fs');
const files = ['src/pages/DayBook.tsx', 'src/pages/Admin.tsx'];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/catch \((error: any|error)\) \{\n\s*console\.error\(error\);\n\s*\}/g, "catch (error: any) { console.error(error); alert(error.message || 'An error occurred while saving.'); }");
    fs.writeFileSync(file, content);
  }
}

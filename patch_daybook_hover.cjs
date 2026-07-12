const fs = require('fs');
let content = fs.readFileSync('src/pages/DayBook.tsx', 'utf8');

content = content.replace(/hover:bg-blue-50\/50/g, 'active:bg-blue-100 md:hover:bg-blue-50/50');
fs.writeFileSync('src/pages/DayBook.tsx', content);

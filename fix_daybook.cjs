const fs = require('fs');

const fixFile = (file) => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\{v\.type\}/g, '{String(v.type || "")}');
    content = content.replace(/\{v\.number \|\| '-'\}/g, '{String(v.number || "-")}');
    content = content.replace(/\{party\}/g, '{String(party || "")}');
    fs.writeFileSync(file, content);
};

fixFile('src/pages/DayBook.tsx');


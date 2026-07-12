const fs = require('fs');

const fixFile = (file) => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/item\.name\}/g, 'String(item.name || "")}');
    content = content.replace(/item\.group\}/g, 'String(item.group || "")}');
    content = content.replace(/item\.number/g, 'String(item.number || "")');
    content = content.replace(/item\.date\}/g, 'String(item.date || "")}');
    fs.writeFileSync(file, content);
};

fixFile('src/pages/Reports.tsx');


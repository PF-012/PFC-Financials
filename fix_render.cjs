const fs = require('fs');

const fixFile = (file) => {
    let content = fs.readFileSync(file, 'utf8');
    // We just ensure we convert variables to string if they are objects before rendering, or handle it during render.
    content = content.replace(/\{l\.name\}/g, '{String(l.name || "")}');
    content = content.replace(/\{l\.gstin \|\| '-'\}/g, '{String(l.gstin || "-")}');
    content = content.replace(/\{l\.group\}/g, '{String(l.group || "")}');
    
    content = content.replace(/\{v\.type\}/g, '{String(v.type || "")}');
    content = content.replace(/\{v\.number \|\| '-'\}/g, '{String(v.number || "-")}');
    content = content.replace(/\{v\.againstReference\}/g, '{String(v.againstReference || "")}');
    
    fs.writeFileSync(file, content);
};

fixFile('src/pages/Ledgers.tsx');
fixFile('src/pages/Vouchers.tsx');


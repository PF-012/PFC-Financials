const fs = require('fs');

const fixFile = (file) => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\{t\.description\}/g, '{String(t.description || "")}');
    fs.writeFileSync(file, content);
};

fixFile('src/pages/BankReconciliation.tsx');


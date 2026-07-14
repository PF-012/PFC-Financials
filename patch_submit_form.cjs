const fs = require('fs');
let code = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

const replacement = `
    let submitForm = { ...form };
    
    // Clean up empty optional fields so Supabase doesn't complain if schema is outdated
    if (!submitForm.againstReference) delete submitForm.againstReference;
    if (!submitForm.itemName) delete submitForm.itemName;
    if (!submitForm.items || submitForm.items.length === 0) delete submitForm.items;
`;

code = code.replace("let submitForm = { ...form };", replacement.trim());
fs.writeFileSync('src/pages/Vouchers.tsx', code);

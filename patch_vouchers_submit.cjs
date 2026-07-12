const fs = require('fs');
let content = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

const submitLogic = `
  async function handleSubmit(e: React.FormEvent | { preventDefault: () => void }) {
    e.preventDefault();
    if (!activeCompany || !user) return;

    let submitForm = { ...form };

    if (!forceSave) {
        setIsVerifying(true);
        setAiWarning(null);
        try {
            const partyLedger = ledgers.find(l => l.id === submitForm.partyId);
            const accountLedger = ledgers.find(l => l.id === submitForm.accountId);
            
            const res = await fetch('/api/validate-voucher', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    type: submitForm.type,
                    partyName: partyLedger?.name || '',
                    partyGroup: partyLedger?.group || '',
                    accountName: accountLedger?.name || '',
                    accountGroup: accountLedger?.group || '',
                    amount: submitForm.totalAmount
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.isValid === false && data.reason) {
                    setAiWarning(data.reason);
                    setForceSave(true);
                    setIsVerifying(false);
                    return; // Stop saving, wait for user to click Save Anyway
                }
            }
        } catch (err) {
            console.error('Validation error', err);
        }
        setIsVerifying(false);
    }
    
    setForceSave(false);
    setAiWarning(null);

    try {
      if (!submitForm.number && !editingId && activeCompany?.settings?.voucherNumbering !== 'manual') {
`;

content = content.replace(
  /async function handleSubmit\(e: React\.FormEvent \| \{ preventDefault: \(\) => void \}\) \{\s*e\.preventDefault\(\);\s*if \(\!activeCompany \|\| \!user\) return;\s*try \{\s*let submitForm = \{ \.\.\.form \};\s*if \(\!submitForm\.number && \!editingId && activeCompany\?\.settings\?\.voucherNumbering \!\=\= 'manual'\) \{/,
  submitLogic.trim() + ' {'
);

fs.writeFileSync('src/pages/Vouchers.tsx', content);

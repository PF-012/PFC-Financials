const fs = require('fs');
let content = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

// Add state variables and effect
content = content.replace(
  /const \[form, setForm\] = useState<any>\(initialForm\);/,
  `const [form, setForm] = useState<any>(initialForm);
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [forceSave, setForceSave] = useState(false);

  useEffect(() => {
     setAiWarning(null);
     setForceSave(false);
  }, [form.type, form.partyId, form.accountId, form.totalAmount]);`
);

fs.writeFileSync('src/pages/Vouchers.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

// Add states
content = content.replace(
  /const \[selectedIndex, setSelectedIndex\] = useState<number>\(0\);/,
  "const [selectedIndex, setSelectedIndex] = useState<number>(0);\n  const [isVerifying, setIsVerifying] = useState(false);\n  const [aiWarning, setAiWarning] = useState<string | null>(null);\n  const [forceSave, setForceSave] = useState(false);"
);

// Reset forceSave when form changes
content = content.replace(
  /const setForm = \(newForm: any\) => \{/,
  "const handleSetForm = (val: any) => {\n    setAiWarning(null);\n    setForceSave(false);\n    setFormState(val);\n  };\n  const setForm = "
);
// Actually, it's `const [form, setForm] = useState<Partial<Voucher>>(initialForm);`
// Let's just find and replace the useState for form.

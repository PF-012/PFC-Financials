const fs = require('fs');
let code = fs.readFileSync('src/pages/AIGuide.tsx', 'utf8');

code = code.replace(
  "if (!res.ok) throw new Error('Failed to fetch response');",
  `if (!res.ok) {
        const errText = await res.text();
        throw new Error(\`HTTP \${res.status}: \${errText}\`);
      }`
);

fs.writeFileSync('src/pages/AIGuide.tsx', code);
console.log("Patched AIGuide.tsx error handling");

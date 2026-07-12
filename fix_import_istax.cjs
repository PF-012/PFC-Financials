const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const replacement = `
             // Auto-correction for mismatched ledgers like CGST going to Purchase
             const isTax = lowerName.includes('gst') || lowerName.includes('tax') || lowerName.includes('duty') || lowerName.includes('cess') || lowerName.includes('tds');
             if (isTax && !lowerGroup.includes('tax') && !lowerGroup.includes('dut')) {
                 refinedGroup = 'Duties & Taxes';
`;

content = content.replace(
  /\/\/ Auto-correction for mismatched ledgers[\s\S]*?refinedGroup = 'Duties & Taxes';\n/,
  replacement.trim() + '\n'
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);

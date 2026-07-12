const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const replacement = `
             // Auto-correction for mismatched ledgers like CGST going to Purchase
             let isTax = lowerName.includes('gst') || lowerName.includes('tax') || lowerName.includes('duty') || lowerName.includes('cess') || lowerName.includes('tds');
             if (lowerName.includes('purchase') || lowerName.includes('sale')) {
                 isTax = false; // "GST Purchase" or "GST Sales" are not tax ledgers, they are purchase/sales ledgers.
             }
             if (isTax && !lowerGroup.includes('tax') && !lowerGroup.includes('dut')) {
                 refinedGroup = 'Duties & Taxes';
`;

content = content.replace(
  /\/\/ Auto-correction for mismatched ledgers[\s\S]*?refinedGroup = 'Duties & Taxes';\n/,
  replacement.trim() + '\n'
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);

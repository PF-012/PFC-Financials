const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const replacement = `
             // Skip if name is completely empty
             if (!name || name.trim() === '') return null;

             let refinedGroup = group || 'Capital Account';
             const lowerName = name.toLowerCase();
             const lowerGroup = refinedGroup.toLowerCase();
             // Auto-correction for mismatched ledgers like CGST going to Purchase
             const isTax = lowerName.includes('gst') || lowerName.includes('tax') || lowerName.includes('duty') || lowerName.includes('cess') || lowerName.includes('tds');
             if (isTax && !lowerGroup.includes('tax') && !lowerGroup.includes('dut')) {
                 refinedGroup = 'Duties & Taxes';
             } else if ((lowerName.includes('bank') || lowerName.includes('sbi') || lowerName.includes('hdfc') || lowerName.includes('icici')) && !lowerGroup.includes('bank')) {
                 refinedGroup = 'Bank Accounts';
             } else if (lowerName.includes('cash') && !lowerGroup.includes('cash')) {
                 refinedGroup = 'Cash-in-Hand';
             } else if (lowerName.includes('sale') && !lowerGroup.includes('sale') && !lowerGroup.includes('income') && !lowerName.includes('return') && !isTax) {
                 refinedGroup = 'Sales Accounts';
             } else if (lowerName.includes('purchase') && !lowerGroup.includes('purchase') && !lowerGroup.includes('expense') && !lowerName.includes('return') && !isTax) {
                 refinedGroup = 'Purchase Accounts';
             } else if ((lowerName.includes('discount') || lowerName.includes('salary') || lowerName.includes('rent') || lowerName.includes('freight') || lowerName.includes('expense')) && (!lowerGroup.includes('expense') && !lowerGroup.includes('income')) && !isTax) {
                 refinedGroup = 'Indirect Expenses';
             }
`;

content = content.replace(
  /let refinedGroup = group \|\| 'Capital Account';[\s\S]*?refinedGroup = 'Indirect Expenses';\n             \}/,
  replacement.trim()
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const replacement = `
             // Auto-correction for mismatched ledgers like CGST going to Purchase
             const isTax = lowerName.includes('cgst') || lowerName.includes('sgst') || lowerName.includes('igst') || lowerName.includes('tax') || lowerName.includes('duty') || lowerName.includes('cess') || lowerName.includes('tds');
             if (isTax && !lowerGroup.includes('tax') && !lowerGroup.includes('dut')) {
                 refinedGroup = 'Duties & Taxes';
             } else if ((lowerName.includes('bank') || lowerName.includes('sbi') || lowerName.includes('hdfc') || lowerName.includes('icici')) && !lowerGroup.includes('bank')) {
                 refinedGroup = 'Bank Accounts';
             } else if (lowerName.includes('cash') && !lowerGroup.includes('cash')) {
                 refinedGroup = 'Cash-in-Hand';
             } else if (lowerName.includes('sale') && !lowerGroup.includes('sale') && !lowerGroup.includes('income') && !lowerName.includes('return')) {
                 refinedGroup = 'Sales Accounts';
             } else if (lowerName.includes('purchase') && !lowerGroup.includes('purchase') && !lowerGroup.includes('expense') && !lowerName.includes('return')) {
                 refinedGroup = 'Purchase Accounts';
             } else if ((lowerName.includes('discount') || lowerName.includes('salary') || lowerName.includes('rent') || lowerName.includes('freight') || lowerName.includes('expense')) && (!lowerGroup.includes('expense') && !lowerGroup.includes('income'))) {
                 refinedGroup = 'Indirect Expenses';
             }
`;

content = content.replace(/\/\/ Auto-correction for mismatched ledgers[\s\S]*?refinedGroup = 'Purchase Accounts';\n             \}/g, replacement.trim());
fs.writeFileSync('src/pages/ImportExport.tsx', content);

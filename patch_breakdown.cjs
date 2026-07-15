const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

const search = `        if (title.includes('Current Assets') || title === 'Sundry Debtors / Current Assets') {
            if (reportData.unassignedCash !== 0) data.push({ id: 'pseudo-cash', name: 'Uncategorized Cash/Bank (Receipts - Payments)', group: 'Current Assets', balance: reportData.unassignedCash });
            if (reportData.unassignedDuties > 0) data.push({ id: 'pseudo-duties', name: 'Uncategorized Duties & Taxes (GST Receivable)', group: 'Current Assets', balance: reportData.unassignedDuties });
        }`;

const replace = `        if (title.includes('Current Assets') || title === 'Sundry Debtors / Current Assets') {
            if (reportData.unassignedCash !== 0) data.push({ id: 'pseudo-cash', name: 'Uncategorized Cash/Bank (Receipts - Payments)', group: 'Current Assets', balance: reportData.unassignedCash });
            if (reportData.unassignedDuties > 0) data.push({ id: 'pseudo-duties', name: 'Uncategorized Duties & Taxes (GST Receivable)', group: 'Current Assets', balance: reportData.unassignedDuties });
        }
        if (title === 'Current Liabilities') {
            if (reportData.unassignedDuties < 0) data.push({ id: 'pseudo-duties-liab', name: 'Uncategorized Duties & Taxes (GST Payable)', group: 'Current Liabilities', balance: reportData.unassignedDuties });
        }
        if (title === 'Sales Accounts' || title.includes('Sales')) {
            if (reportData.unassignedSales !== 0) data.push({ id: 'pseudo-sales', name: 'Uncategorized Sales', group: 'Sales Accounts', balance: -reportData.unassignedSales });
        }
        if (title === 'Purchase Accounts' || title.includes('Purchase')) {
            if (reportData.unassignedPurchases !== 0) data.push({ id: 'pseudo-purchases', name: 'Uncategorized Purchases', group: 'Purchase Accounts', balance: reportData.unassignedPurchases });
        }`;

code = code.replace(search, replace);

fs.writeFileSync('src/pages/Reports.tsx', code);

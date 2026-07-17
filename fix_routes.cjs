const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Find the start of Vite middleware
const viteStart = `  // Vite middleware for development`;

// We need to extract the new routes and put them before viteStart.
const validateVoucherStart = `  app.post('/api/validate-voucher', async (req, res) => {`;
const validateVoucherEnd = `      res.json({ isValid: true });\n    }\n  });\n`;

const aiChatStart = `  app.post('/api/ai-chat', async (req, res) => {`;
const aiChatEnd = `      res.status(500).json({ error: 'Failed to chat with AI: ' + (err.message || String(err)) });\n    }\n  });\n`;

let validateVoucherCode = '';
if (code.includes(validateVoucherStart)) {
    const startIndex = code.indexOf(validateVoucherStart);
    const endIndex = code.indexOf(validateVoucherEnd) + validateVoucherEnd.length;
    validateVoucherCode = code.substring(startIndex, endIndex);
    code = code.substring(0, startIndex) + code.substring(endIndex);
}

let aiChatCode = '';
if (code.includes(aiChatStart)) {
    const startIndex = code.indexOf(aiChatStart);
    const endIndex = code.indexOf(aiChatEnd) + aiChatEnd.length;
    aiChatCode = code.substring(startIndex, endIndex);
    code = code.substring(0, startIndex) + code.substring(endIndex);
}

// Now insert them before viteStart
if (code.includes(viteStart)) {
    code = code.replace(viteStart, aiChatCode + '\n' + validateVoucherCode + '\n' + viteStart);
    fs.writeFileSync('server.ts', code);
    console.log("Moved routes before Vite middleware");
} else {
    console.log("Could not find Vite middleware block");
}

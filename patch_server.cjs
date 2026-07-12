const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const validateEndpoint = `
  app.post('/api/validate-voucher', async (req, res) => {
    try {
      const { type, partyName, partyGroup, accountName, accountGroup, amount } = req.body;
      
      const prompt = \`
      You are an expert accountant. Review the following proposed accounting entry to ensure it follows basic accounting rules.
      
      Voucher Type: \${type}
      Primary Ledger (Party/Item): \${partyName} (Group: \${partyGroup})
      Secondary Ledger (Cash/Bank/Account): \${accountName} (Group: \${accountGroup})
      Amount: \${amount}
      
      Determine if this entry makes logical accounting sense.
      Examples of WRONG entries:
      - A "Payment" where the Secondary Ledger is a Customer (Sundry Debtors) instead of Bank/Cash. (Payments are usually made FROM Bank/Cash).
      - A "Receipt" where the Secondary Ledger is a Supplier instead of Bank/Cash.
      - A "Sales" where the Primary Ledger is Cash and Secondary is Bank. (Sales should usually credit a Sales account and debit Customer/Cash/Bank).
      - Paying a Customer (Sundry Debtors) using a "Purchase" voucher.
      
      If it is correct or generally acceptable, return exactly: {"isValid": true}
      If it is blatantly wrong or highly suspicious, return exactly: {"isValid": false, "reason": "Short explanation of why it is wrong and how to fix it."}
      
      Return ONLY valid JSON.
      \`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const rawText = response.text || "{}";
      const cleanedText = rawText.replace(/\\\`\\\`\\\`json/g, '').replace(/\\\`\\\`\\\`/g, '').trim();
      const result = JSON.parse(cleanedText);
      
      res.json(result);
    } catch (err) {
      console.error('AI Validation error:', err);
      // Fallback to valid if AI fails so we don't block the user
      res.json({ isValid: true });
    }
  });
`;

content = content.replace(/app\.listen\(PORT/, validateEndpoint + '\n  app.listen(PORT');
fs.writeFileSync('server.ts', content);

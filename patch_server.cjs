const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
  app.post('/api/map-imported-ledgers', async (req, res) => {
    try {
      const { rawData } = req.body;
      if (!rawData || !Array.isArray(rawData)) {
        return res.status(400).json({ error: 'Missing or invalid rawData array' });
      }

      const itemsToProcess = rawData.slice(0, 50);
      const prompt = \`
      You are an expert accountant and data extraction AI.
      I will give you an array of raw JSON objects representing accounting ledgers/accounts imported from a file (CSV, Excel, JSON, XML).
      Your job is to perfectly map each object into a standardized Ledger schema.
      
      IMPORTANT INSTRUCTIONS FOR MAPPING LEDGERS:
      - 'name' is the name of the ledger/account.
      - 'group' MUST be a valid accounting group. Standard groups: "Capital Account", "Current Assets", "Cash-in-Hand", "Bank Accounts", "Sundry Debtors", "Current Liabilities", "Sundry Creditors", "Duties & Taxes", "Fixed Assets", "Direct Expenses", "Indirect Expenses", "Direct Incomes", "Indirect Incomes", "Purchase Accounts", "Sales Accounts".
      - 'openingBalance' should be a number (default 0).
      - 'address', 'gstin', 'contactNo' are optional strings.

      Raw Data (JSON):
      \${JSON.stringify(itemsToProcess)}

      Return a raw JSON array of objects (no markdown, just the array) with this exact structure for each item:
      [{
        "name": "String",
        "group": "String",
        "openingBalance": Number,
        "address": "String or empty string",
        "gstin": "String or empty string",
        "contactNo": "String or empty string"
      }]
      \`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });
      const rawText = response.text || "[]";
      const cleanedText = rawText.replace(/\\\`\\\`\\\`json/g, '').replace(/\\\`\\\`\\\`/g, '').trim();
      const mappedLedgers = JSON.parse(cleanedText);
      
      res.json({ mappedLedgers });
    } catch (err) {
      console.error('AI Mapping error:', err);
      res.status(500).json({ error: 'Failed to map ledgers via AI' });
    }
  });

`;

code = code.replace("app.post('/api/map-imported-vouchers'", newRoute + "  app.post('/api/map-imported-vouchers'");
code = code.replace(/gemini-3\.1-flash-lite/g, 'gemini-2.5-flash'); // Upgrade model since gemini-3.1-flash-lite might not exist or we should use gemini-2.5-flash
fs.writeFileSync('server.ts', code);

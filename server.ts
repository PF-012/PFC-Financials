import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post('/api/parse-invoice', async (req, res) => {
    try {
      const { fileBase64, mimeType } = req.body;
      if (!fileBase64) return res.status(400).json({ error: 'Missing file base64' });

      const prompt = `
      You are an expert accountant. Extract the following information from this invoice/bill document and return ONLY a raw JSON object (no markdown formatting, no comments).
      Analyze the document to determine the type of voucher for OUR company's books.
      - If it is a bill/invoice addressed TO our company (asking us to pay), it is a "Purchase".
      - If it is an invoice billed BY our company TO a customer, it is a "Sales".
      - If the document is a receipt from a vendor acknowledging that WE paid them (e.g., a "Payment Receipt" from Airtel, Amazon, etc. for a bill we paid), money went out of our account, so it is a "Payment".
      - If it is a receipt showing we received money from a customer, it is a "Receipt".
      
      {
        "type": "Purchase" | "Sales" | "Payment" | "Receipt",
        "partyName": "The name of the other party (vendor or customer)",
        "partyGroup": "Sundry Creditors" | "Sundry Debtors" | "Indirect Expenses" | "Fixed Assets" | "Direct Expenses" (Choose the best fit for this party. Vendors are usually Sundry Creditors or Indirect Expenses. Customers are Sundry Debtors.),
        "number": "Invoice/Receipt number or null",
        "date": "YYYY-MM-DD or null",
        "totalAmount": number or null (the final total including taxes),
        "cgstAmount": number or null,
        "sgstAmount": number or null,
        "igstAmount": number or null,
        "itemName": "A short summary of items/services provided or null",
        "paymentMode": "UPI" | "Card" | "Bank" | "Cash" | null (Extract the payment method used, if available)
      }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: mimeType || 'application/pdf', data: fileBase64 } },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const rawText = response.text || "{}";
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const invoiceData = JSON.parse(cleanedText);
      res.json({ invoice: invoiceData });
    } catch (err: any) {
      console.error('Invoice parsing error:', err);
      res.status(500).json({ error: 'Failed to parse invoice', details: err?.message || String(err) });
    }
  });

  
  app.post('/api/map-imported-ledgers', async (req, res) => {
    try {
      const { rawData } = req.body;
      if (!rawData || !Array.isArray(rawData)) {
        return res.status(400).json({ error: 'Missing or invalid rawData array' });
      }

      const itemsToProcess = rawData.slice(0, 50);
      const prompt = `
      You are an expert accountant and data extraction AI.
      I will give you an array of raw JSON objects representing accounting ledgers/accounts imported from a file (CSV, Excel, JSON, XML).
      Your job is to perfectly map each object into a standardized Ledger schema.
      
      IMPORTANT INSTRUCTIONS FOR MAPPING LEDGERS:
      - 'name' is the name of the ledger/account.
      - 'group' MUST be a valid accounting group. Standard groups: "Capital Account", "Current Assets", "Cash-in-Hand", "Bank Accounts", "Sundry Debtors", "Current Liabilities", "Sundry Creditors", "Duties & Taxes", "Fixed Assets", "Direct Expenses", "Indirect Expenses", "Direct Incomes", "Indirect Incomes", "Purchase Accounts", "Sales Accounts".
      - 'openingBalance' should be a number (default 0).
      - 'address', 'gstin', 'contactNo' are optional strings.

      Raw Data (JSON):
      ${JSON.stringify(itemsToProcess)}

      Return a raw JSON array of objects (no markdown, just the array) with this exact structure for each item:
      [{
        "name": "String",
        "group": "String",
        "openingBalance": Number,
        "address": "String or empty string",
        "gstin": "String or empty string",
        "contactNo": "String or empty string"
      }]
      `;

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
      const cleanedText = rawText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const mappedLedgers = JSON.parse(cleanedText);
      
      res.json({ mappedLedgers });
    } catch (err) {
      console.error('AI Mapping error:', err);
      res.status(500).json({ error: 'Failed to map ledgers via AI' });
    }
  });

  app.post('/api/map-imported-vouchers', async (req, res) => {
    try {
      const { rawData } = req.body;
      if (!rawData || !Array.isArray(rawData)) {
        return res.status(400).json({ error: 'Missing or invalid rawData array' });
      }

      // To avoid huge payloads, let's chunk them if needed, but for now just process up to 100 at a time in a single request.
      const itemsToProcess = rawData.slice(0, 15);

      const prompt = `
      You are an expert accountant and data extraction AI.
      I will give you an array of raw JSON objects representing accounting vouchers/transactions imported from a file (CSV, Excel, JSON, XML).
      Your job is to perfectly map each object into a standardized Voucher schema.
      
      IMPORTANT INSTRUCTIONS FOR MAPPING PARTIES AND ACCOUNTS:
      - 'partyName' is the main entity we are transacting with (Customer, Supplier, Employee, etc.). Often found in fields like "Paid To", "Paid From", "Party Name", "Party", "Customer A/c", "Supplier A/c", "Received From".
      - 'accountName' is the secondary ledger or bank/cash account. Often found in fields like "Paid From", "Deposit To", "Account", "Account Name", "Received In", "Sales Account", "Purchase Account".
      - Ensure you make logical deductions. If a transaction says "Paid To: John", then partyName="John". If it says "Received From: Acme Corp", partyName="Acme Corp".
      - 'type' MUST be one of: "Sales", "Purchase", "Receipt", "Payment", "Journal", "Contra", "Credit Note", "Debit Note". Deduce from context if missing (e.g. if it has "Paid To", it's likely a "Payment").
      - Dates should be converted to YYYY-MM-DD.
      - Amounts should be positive numbers.

      Raw Data (JSON):
      ${JSON.stringify(itemsToProcess)}

      Return a raw JSON array of objects (no markdown, just the array) with this exact structure for each item:
      [{
        "type": "Sales" | "Purchase" | "Receipt" | "Payment" | "Journal" | "Contra" | "Credit Note" | "Debit Note",
        "date": "YYYY-MM-DD",
        "number": "Voucher/Invoice number or empty string",
        "partyName": "String: The main party (Paid To / Received From / Customer / Supplier)",
        "accountName": "String: The secondary account (Bank / Cash / Sales A/c / Deposit To) or empty string",
        "totalAmount": Number (Total amount of the transaction),
        "cgstAmount": Number (or 0),
        "sgstAmount": Number (or 0),
        "igstAmount": Number (or 0),
        "tdsAmount": Number (or 0),
        "itemName": "String: item description or empty string",
        "narration": "String: narration/remarks or empty string"
      }]
      
      Only return the valid items. If an item in the raw data doesn't look like a transaction, you can omit it.
      `;

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
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const mappedVouchers = JSON.parse(cleanedText);
      
      res.json({ mappedVouchers });
    } catch (err: any) {
      console.error('AI Mapping error:', err);
      res.status(500).json({ error: 'Failed to map vouchers via AI', details: err?.message || String(err) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    // Static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  
  

  
  app.post('/api/validate-voucher', async (req, res) => {
    try {
      const { type, partyName, partyGroup, accountName, accountGroup, amount } = req.body;
      
      const prompt = `
      You are an expert accountant. Review the following proposed accounting entry to ensure it follows basic accounting rules.
      
      Voucher Type: ${type}
      Primary Ledger (Party/Item): ${partyName} (Group: ${partyGroup})
      Secondary Ledger (Cash/Bank/Account): ${accountName} (Group: ${accountGroup})
      Amount: ${amount}
      
      Determine if this entry makes logical accounting sense.
      Examples of WRONG entries:
      - A "Payment" where the Secondary Ledger is a Customer (Sundry Debtors) instead of Bank/Cash. (Payments are usually made FROM Bank/Cash).
      - A "Receipt" where the Secondary Ledger is a Supplier instead of Bank/Cash.
      - A "Sales" where the Primary Ledger is Cash and Secondary is Bank. (Sales should usually credit a Sales account and debit Customer/Cash/Bank).
      - Paying a Customer (Sundry Debtors) using a "Purchase" voucher.
      
      If it is correct or generally acceptable, return exactly: {"isValid": true}
      If it is blatantly wrong or highly suspicious, return exactly: {"isValid": false, "reason": "Short explanation of why it is wrong and how to fix it."}
      
      Return ONLY valid JSON.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const rawText = response.text || "{}";
      const cleanedText = rawText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const result = JSON.parse(cleanedText);
      
      res.json(result);
    } catch (err) {
      console.error('AI Validation error:', err);
      // Fallback to valid if AI fails so we don't block the user
      res.json({ isValid: true });
    }
  });

  if (process.env.VERCEL) {
    return app;
  } else {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

const appPromise = startServer();
export default async function (req: any, res: any) {
  const app = await appPromise;
  if (app) app(req, res);
}

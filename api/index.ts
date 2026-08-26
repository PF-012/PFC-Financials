import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const upload = multer({ storage: multer.memoryStorage() });
const app = express();

function formatAIError(err: any): string {
  const msg = err.message || String(err);
  if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('api key')) {
    return 'Authentication Error: Your Gemini API Key is invalid or missing. Please click the Settings menu in the top right corner of AI Studio and enter a valid Gemini API Key.';
  }
  return msg;
}


app.use(express.json({ limit: '50mb' }));

let ai: any = null;
function getAIClient() {
  if (!ai) {
    if (process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } else {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.');
    }
  }
  return ai;
}

app.post('/api/parse-invoice', upload.single('invoice'), async (req, res) => {
  try {
    const { textData, fileData, mimeType } = req.body;
    let itemsToProcess = [];

    if (req.file) {
      itemsToProcess.push({
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype
        }
      });
    } else if (fileData && mimeType) {
       itemsToProcess.push({
          inlineData: {
            data: fileData,
            mimeType: mimeType
          }
       });
    }

    if (textData) {
      try {
        const parsedText = JSON.parse(textData);
        itemsToProcess = itemsToProcess.concat(parsedText);
      } catch (e) {
        itemsToProcess.push({ text: textData });
      }
    }

    const prompt = `
    You are an expert accountant and data extractor.
    Analyze the provided invoice/receipt image or raw text data and extract all valid accounting transactions (vouchers).
    
    IMPORTANT RULES:
    - 'partyName' is the primary ledger involved. Often found in fields like "Billed To", "Customer Name", "Vendor Name", "Customer A/c", "Supplier A/c", "Received From".
    - 'accountName' is the secondary ledger or bank/cash account. Often found in fields like "Paid From", "Deposit To", "Account", "Account Name", "Received In", "Sales Account", "Purchase Account".
    - Ensure you make logical deductions. If a transaction says "Paid To: John", then partyName="John". If it says "Received From: Acme Corp", partyName="Acme Corp".
    - 'type' MUST be one of: "Sales", "Purchase", "Receipt", "Payment", "Journal", "Contra", "Credit Note", "Debit Note". Deduce from context if missing (e.g. if it has "Paid To", it's likely a "Payment").
    - Dates should be converted to YYYY-MM-DD.
    - Amounts should be positive numbers. If this is a Tally XML JSON, the amount is usually nested deep inside 'ALLLEDGERENTRIES.LIST' or 'LEDGERENTRIES.LIST' as 'AMOUNT'. Make sure to find it!

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

    const response = await getAIClient().models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const rawText = response.text || "[]";
    const cleanedText = rawText.replace(/\`\`\`json/g, '').replace(/```/g, '').trim();
    const mappedVouchers = JSON.parse(cleanedText);
    
    res.json({ mappedVouchers });
  } catch (err: any) {
    console.error('AI Mapping error:', err);
    res.status(500).json({ error: 'Failed to map vouchers via AI. ' + formatAIError(err), details: err?.message || String(err) });
  }
});

app.post('/api/ai-chat', async (req, res) => {
  try {
    const { message, attachments, chatHistory } = req.body;
    const systemPrompt = `
    You are a helpful and expert AI Accounting Assistant embedded in an accounting software.
    Your job is to answer accounting questions from users using this software.
    Be concise, professional, and explain concepts simply.
    If the user is asking about how to record something, tell them which "Voucher Type" to use (e.g. Sales, Purchase, Payment, Receipt, Journal, Contra) and which accounts to Debit/Credit.
    
    Import and Data Sync Guidance:
    If the user is asking about an error they encountered while importing data (e.g. Excel, JSON, CSV, XML), or if they upload an image/file showing an import error, explain clearly what the error means, why it happened, and how they can fix their file so it imports properly without any error.
    `;
    
    const contents: any[] = [];
    
    if (chatHistory && Array.isArray(chatHistory)) {
        for (const msg of chatHistory) {
            const parts: any[] = [];
            if (msg.attachments && Array.isArray(msg.attachments)) {
                for (const att of msg.attachments) {
                    parts.push({
                        inlineData: {
                            data: att.base64,
                            mimeType: att.mimeType
                        }
                    });
                }
            }
            if (msg.text) {
                parts.push({ text: msg.text });
            }
            if (parts.length > 0) {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: parts
                });
            }
        }
    }

    // Ensure the first message is from a 'user'
    while (contents.length > 0 && contents[0].role === 'model') {
        contents.shift();
    }

    const currentParts: any[] = [{ text: message }];
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
         currentParts.push({
            inlineData: {
               data: att.base64,
               mimeType: att.mimeType
            }
         });
      }
    }
    
    contents.push({
        role: 'user',
        parts: currentParts
    });

    const response = await getAIClient().models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: contents,
      config: {
           temperature: 0.7,
          systemInstruction: systemPrompt
      }
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error('AI Chat error:', err);
    res.status(500).json({ error: 'Failed to chat with AI: ' + formatAIError(err) });
  }
});

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

    const response = await getAIClient().models.generateContent({
      model: 'gemini-3.1-flash-lite',
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
    res.json({ isValid: true });
  }
});

export default app;

app.post('/api/cfo-insights', async (req, res) => {
  try {
    const { reportData, metrics, sector } = req.body;
    const prompt = `
    You are an expert CFO and financial analyst acting as a human-in-the-loop AI for a SaaS accounting platform.
    The company is operating in the ${sector || 'General'} sector.
    Review the following financial data and metrics. 
    1. Detect any material fluctuations or notable figures based STRICTLY on the provided data. DO NOT hallucinate any numbers or metrics.
    2. Draft a plain-language, CFO-ready commentary explaining the variance and current financial health, keeping the ${sector || 'General'} sector's key performance indicators (KPIs) in mind.
    3. Provide strategic recommendations tailored to the ${sector || 'General'} sector.
    4. IMPORTANT: ALWAYS use Indian Rupees (INR) with the ₹ symbol for all currency amounts. State the EXACT numbers provided in the metrics without rounding them or artificially converting them to text like 'Lakhs' or 'Crores' (e.g., write ₹2,500 or ₹1,50,000). DO NOT use Dollars or the $ symbol. Ensure NO numbers have more than 2 decimal places.
    
    Data:
    Metrics: ${JSON.stringify(metrics, null, 2)}
    
    Respond in professional, clean Markdown. Your Executive Summary MUST begin by explicitly disclosing the particular FY's real-time financial details (Total Revenue, Cash Reserves, Expenses, and Net Profit) strictly based on the provided metrics. After giving this short disclosure of how much cash and revenue we have generated till date, base the rest of your assumptions and variance analysis on it.
    `;
    
    const response = await getAIClient().models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.2 }
    });
    
    res.json({ commentary: response.text });
  } catch (err: any) {
    console.error('CFO Insights error:', err);
    res.status(500).json({ error: 'Failed to generate insights: ' + formatAIError(err) });
  }
});

app.post('/api/generate-frfsa', async (req, res) => {
  try {
    const { metrics, sector, companyName } = req.body;
    const prompt = `
    You are an expert financial modeling AI generating a comprehensive Financial Reporting, Forecasting & Strategic Analysis (FRFSA) model for a company named ${companyName} operating in the ${sector || 'General'} sector.
    
    Based on the current financial metrics provided below, generate a realistic but synthesized 3-year forecast, identify key assumptions, calculate relevant financial ratios tailored to the ${sector} sector, and perform a simplified Discounted Cash Flow (DCF) valuation.
    
    Current Metrics:
    ${JSON.stringify(metrics, null, 2)}
    
    Return the response STRICTLY as a JSON object matching this schema (do NOT use markdown formatting blocks like \`\`\`json, just pure JSON):
    {
      "executiveSummary": "A short disclosure stating exactly how much revenue, cash, and profit the company has generated till date based on the real-time metrics, serving as the basis for the subsequent assumptions.",
      "assumptions": [
        { "parameter": "Revenue Growth Rate", "value": "15%", "rationale": "Based on historical trends and sector average for ${sector}." }
      ],
      "forecasting": [
        { "lineItem": "Revenue", "y0": "100000", "y1": "115000", "y2": "132250", "y3": "152087" },
        { "lineItem": "COGS", "y0": "...", "y1": "...", "y2": "...", "y3": "..." },
        { "lineItem": "EBITDA", "y0": "...", "y1": "...", "y2": "...", "y3": "..." },
        { "lineItem": "Free Cash Flow", "y0": "...", "y1": "...", "y2": "...", "y3": "..." }
      ],
      "ratios": [
        { "name": "Gross Margin", "value": "45%", "benchmark": "40%", "analysis": "Outperforming sector benchmark due to..." }
      ],
      "dcf": {
        "wacc": "12.5%",
        "terminalGrowth": "3.0%",
        "enterpriseValue": "₹5,000,000",
        "equityValue": "₹4,800,000",
        "summary": "The company is valued at an implied EV of ₹5M..."
      }
    }
    
    Ensure the numbers flow logically from the provided metrics and are formatted as strings with currency symbols (₹) and commas where appropriate (e.g. "₹1,50,000").
    `;
    
    const response = await getAIClient().models.generateContent({
      model: 'gemini-3.1-flash-lite', // Better reasoning model for financial math
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });
    
    res.json({ data: JSON.parse(response.text) });
  } catch (err: any) {
    console.error('FRFSA error:', err);
    res.status(500).json({ error: 'Failed to generate FRFSA: ' + formatAIError(err) });
  }
});
app.post('/api/map-imported-vouchers', async (req, res) => {
  try {
    const { rawData } = req.body;
    const prompt = `
    You are an expert accountant and data extraction tool.
    Map the following raw imported JSON objects to an array of valid Accounting Vouchers.
    
    IMPORTANT RULES:
    - 'partyName' is the primary ledger (Customer/Supplier/Paid To/Received From).
    - 'accountName' is the secondary ledger (Bank/Cash).
    - 'type' MUST be one of: "Sales", "Purchase", "Receipt", "Payment", "Journal", "Contra", "Credit Note", "Debit Note". Deduce from context if missing.
    - Dates should be converted to YYYY-MM-DD.
    - Amounts should be positive numbers.

    Raw Data (JSON):
    ${JSON.stringify(rawData)}
    
    Return a raw JSON array of objects (no markdown, just the array) with this exact structure for each item:
    [{
      "type": "Sales" | "Purchase" | "Receipt" | "Payment" | "Journal" | "Contra" | "Credit Note" | "Debit Note",
      "date": "YYYY-MM-DD",
      "number": "Voucher/Invoice number or empty string",
      "partyName": "String: The main party",
      "accountName": "String: The secondary account",
      "totalAmount": Number (Total amount of the transaction),
      "cgstAmount": Number (or 0),
      "sgstAmount": Number (or 0),
      "igstAmount": Number (or 0),
      "tdsAmount": Number (or 0),
      "itemName": "String: item description or empty string",
      "narration": "String: narration/remarks or empty string"
    }]
    `;
    const response = await getAIClient().models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json', temperature: 0.1 }
    });
    
    const rawText = response.text || "[]";
    const cleanedText = rawText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const mappedVouchers = JSON.parse(cleanedText);
    res.json({ mappedVouchers });
  } catch (err: any) {
    console.error('Map imported vouchers error:', err);
    res.status(500).json({ error: 'Failed to map vouchers: ' + formatAIError(err) });
  }
});

app.post('/api/map-imported-ledgers', async (req, res) => {
  try {
    const { rawData } = req.body;
    const prompt = `
    You are an expert accountant and data extraction tool.
    Map the following raw imported JSON objects to an array of valid Accounting Ledgers.
    
    IMPORTANT RULES:
    - 'name' is the Ledger Name (e.g. "Acme Corp", "John Doe").
    - 'group' is the Account Group (e.g. "Sundry Debtors", "Sundry Creditors", "Direct Incomes", "Bank Accounts").
    - 'openingBalance' should be a number (or 0).
    
    Raw Data (JSON):
    ${JSON.stringify(rawData)}
    
    Return a raw JSON array of objects (no markdown, just the array) with this exact structure for each item:
    [{
      "name": "String: The Ledger Name",
      "group": "String: The Account Group",
      "openingBalance": Number,
      "address": "String (optional)",
      "email": "String (optional)",
      "phone": "String (optional)",
      "gstin": "String (optional)"
    }]
    `;
    const response = await getAIClient().models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json', temperature: 0.1 }
    });
    
    const rawText = response.text || "[]";
    const cleanedText = rawText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const mappedLedgers = JSON.parse(cleanedText);
    res.json({ mappedLedgers });
  } catch (err: any) {
    console.error('Map imported ledgers error:', err);
    res.status(500).json({ error: 'Failed to map ledgers: ' + formatAIError(err) });
  }
});

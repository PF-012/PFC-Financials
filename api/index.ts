import express from 'express';
import { GoogleGenAI } from '@google/genai';

const apiApp = express.Router();

apiApp.use(express.json({ limit: '25mb' }));

let ai: GoogleGenAI | null = null;

function getAIClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  return ai;
}

function extractJson(text = '') {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.search(/[\[{]/);
  const end = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));

  if (start === -1 || end === -1 || end < start) {
    throw new Error('AI response did not contain valid JSON.');
  }

  return JSON.parse(raw.slice(start, end + 1));
}

async function generateText(contents: any, systemInstruction: string, temperature = 0.2) {
  const response = await getAIClient().models.generateContent({
    model: 'gemini-flash-latest',
    contents,
    config: {
      temperature,
      systemInstruction,
    },
  });

  return response.text || '';
}

async function generateJson(contents: any, systemInstruction: string) {
  const text = await generateText(contents, systemInstruction, 0.1);
  return extractJson(text);
}

apiApp.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

apiApp.post('/api/ai-chat', async (req, res) => {
  try {
    const { message = '', attachments = [], chatHistory = [] } = req.body;
    const systemPrompt = `
You are a helpful accounting assistant inside an accounting software product.
Answer clearly and practically. For transaction-recording questions, mention the voucher type and debit/credit treatment.
When users ask about import errors or attach files/images, explain what likely went wrong and how to fix the source file.
`;

    const contents: any[] = [];
    for (const msg of Array.isArray(chatHistory) ? chatHistory.slice(-10) : []) {
      const parts: any[] = [];
      for (const att of Array.isArray(msg.attachments) ? msg.attachments : []) {
        if (att?.base64 && att?.mimeType) {
          parts.push({ inlineData: { data: att.base64, mimeType: att.mimeType } });
        }
      }
      if (msg?.text) parts.push({ text: String(msg.text) });
      if (parts.length) {
        contents.push({ role: msg.role === 'ai' ? 'model' : 'user', parts });
      }
    }

    while (contents.length && contents[0].role === 'model') contents.shift();

    const currentParts: any[] = [{ text: String(message || '') }];
    for (const att of Array.isArray(attachments) ? attachments : []) {
      if (att?.base64 && att?.mimeType) {
        currentParts.push({ inlineData: { data: att.base64, mimeType: att.mimeType } });
      }
    }
    contents.push({ role: 'user', parts: currentParts });

    const reply = await generateText(contents, systemPrompt, 0.7);
    res.json({ reply });
  } catch (err: any) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'Failed to chat with AI: ' + (err.message || String(err)) });
  }
});

apiApp.post('/api/validate-voucher', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      res.json({ isValid: true });
      return;
    }

    const result = await generateJson(
      [{ role: 'user', parts: [{ text: JSON.stringify(req.body) }] }],
      `
You validate accounting vouchers. Return only JSON in this exact shape:
{"isValid":true} or {"isValid":false,"reason":"short reason"}
Flag only clear accounting mismatches between voucher type, party group, account group, and amount.
`
    );

    res.json({
      isValid: result.isValid !== false,
      reason: result.reason || result.warning || '',
    });
  } catch (err: any) {
    console.error('Voucher validation error:', err);
    res.json({ isValid: true });
  }
});

apiApp.post('/api/map-imported-ledgers', async (req, res) => {
  try {
    const result = await generateJson(
      [{ role: 'user', parts: [{ text: JSON.stringify(req.body.rawData || []) }] }],
      `
Map imported accounting ledger rows into this JSON shape and return only JSON:
{"mappedLedgers":[{"name":"","group":"","openingBalance":0,"address":"","gstin":"","contactNo":""}]}
Use standard Indian accounting groups such as Sundry Debtors, Sundry Creditors, Sales Accounts, Purchase Accounts, Duties & Taxes, Bank Accounts, Cash-in-Hand, Direct Expenses, Indirect Expenses, Capital Account.
Omit unusable rows.
`
    );

    res.json({ mappedLedgers: Array.isArray(result.mappedLedgers) ? result.mappedLedgers : [] });
  } catch (err: any) {
    console.error('Ledger mapping error:', err);
    res.status(500).json({ error: 'Failed to map ledgers: ' + (err.message || String(err)) });
  }
});

apiApp.post('/api/map-imported-vouchers', async (req, res) => {
  try {
    const result = await generateJson(
      [{ role: 'user', parts: [{ text: JSON.stringify(req.body.rawData || []) }] }],
      `
Map imported voucher rows into this JSON shape and return only JSON:
{"mappedVouchers":[{"type":"Purchase","date":"YYYY-MM-DD","number":"","partyName":"","accountName":"","totalAmount":0,"cgstAmount":0,"sgstAmount":0,"igstAmount":0,"narration":"","itemName":"","paymentMode":""}]}
Valid voucher types are Sales, Purchase, Receipt, Payment, Journal, Contra, Credit Note, Debit Note, Sales Order, Purchase Order.
Omit unusable rows.
`
    );

    res.json({ mappedVouchers: Array.isArray(result.mappedVouchers) ? result.mappedVouchers : [] });
  } catch (err: any) {
    console.error('Voucher mapping error:', err);
    res.status(500).json({ error: 'Failed to map vouchers: ' + (err.message || String(err)) });
  }
});

apiApp.post('/api/parse-invoice', async (req, res) => {
  try {
    const { fileBase64, mimeType } = req.body;
    if (!fileBase64 || !mimeType) {
      res.status(400).json({ error: 'fileBase64 and mimeType are required.' });
      return;
    }

    const result = await generateJson(
      [{
        role: 'user',
        parts: [
          { text: 'Extract this bill/invoice into the requested JSON shape.' },
          { inlineData: { data: fileBase64, mimeType } },
        ],
      }],
      `
Extract invoice data and return only JSON in this exact shape:
{"invoice":{"type":"Purchase","date":"YYYY-MM-DD","number":"","partyName":"","partyGroup":"Sundry Creditors","totalAmount":0,"cgstAmount":0,"sgstAmount":0,"igstAmount":0,"itemName":"","paymentMode":""}}
Choose Sales/Purchase/Payment/Receipt based on the document. Use 0 for missing amounts and empty strings for missing text.
`
    );

    res.json({ invoice: result.invoice || result });
  } catch (err: any) {
    console.error('Invoice parsing error:', err);
    res.status(500).json({ error: 'Failed to parse invoice: ' + (err.message || String(err)) });
  }
});

export default apiApp;

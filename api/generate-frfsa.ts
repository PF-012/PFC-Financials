function getGeminiKey(): string {
  const raw = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  const key = raw.trim().replace(/^['"]|['"]$/g, '');
  if (!key) throw new Error('GEMINI_API_KEY is not configured on the server.');
  return key;
}

async function generateGeminiContent(model: string, prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': getGeminiKey(),
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      }),
    }
  );

  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: any = new Error(payload?.error?.message || `Gemini API returned HTTP ${response.status}.`);
    error.status = response.status;
    throw error;
  }

  return payload?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').join('') || '';
}

function formatGeminiError(err: any): string {
  const message = err?.message || String(err);
  if (err?.status === 401 || err?.status === 403) {
    return 'Gemini rejected the configured API credential. Check that GEMINI_API_KEY contains a valid Gemini API key from Google AI Studio.';
  }
  if (err?.status === 429) {
    return 'Gemini API rate limit or quota has been reached. Please try again later.';
  }
  return message;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { metrics, sector, companyName } = req.body || {};
    const prompt = `You are an expert financial modeling AI generating a Financial Reporting, Forecasting & Strategic Analysis (FRFSA) model for ${companyName || 'the company'} in the ${sector || 'General'} sector.
Use the supplied current accounting metrics and classified cash-flow statement as the factual base. Do not alter current actuals.
The cashFlow object represents direct cash/bank movements. Sales, Purchase and Journal vouchers are not cash flows by themselves. Government grants/subsidies, loans, capital contributions, fixed-asset disposals/acquisitions and other funding must remain in their classified cash-flow sections rather than being treated as sales revenue.
Generate a logical synthesized 3-year forecast, assumptions, sector-specific ratios and simplified DCF valuation. Clearly use current cash flow and funding mix when forming assumptions.
Current Metrics: ${JSON.stringify(metrics, null, 2)}
Return ONLY valid JSON matching this structure:
{
  "executiveSummary":"short disclosure of current revenue, closing cash, operating cash flow, financing cash flow and profit based strictly on supplied metrics",
  "assumptions":[{"parameter":"Revenue Growth Rate","value":"15%","rationale":"Reason"}],
  "forecasting":[{"lineItem":"Revenue","y0":"100000","y1":"115000","y2":"132250","y3":"152087"},{"lineItem":"COGS","y0":"...","y1":"...","y2":"...","y3":"..."},{"lineItem":"EBITDA","y0":"...","y1":"...","y2":"...","y3":"..."},{"lineItem":"Free Cash Flow","y0":"...","y1":"...","y2":"...","y3":"..."}],
  "ratios":[{"name":"Gross Margin","value":"45%","benchmark":"40%","analysis":"Analysis"}],
  "dcf":{"wacc":"12.5%","terminalGrowth":"3.0%","enterpriseValue":"₹5,000,000","equityValue":"₹4,800,000","summary":"Summary"}
}
Use INR/₹ for currency and make all figures flow logically from the supplied metrics. Do not present funding receipts such as grants or loans as operating sales revenue.`;

    const raw = await generateGeminiContent('gemini-3.1-flash-lite', prompt);
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return res.status(200).json({ data: JSON.parse(cleaned) });
  } catch (err: any) {
    console.error('FRFSA error:', err);
    return res.status(500).json({ error: 'Failed to generate FRFSA: ' + formatGeminiError(err) });
  }
}

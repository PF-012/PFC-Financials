import { generateContent, formatGeminiError } from './gemini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { metrics, sector, companyName } = req.body || {};
    const prompt = `You are an expert financial modeling AI generating a Financial Reporting, Forecasting & Strategic Analysis (FRFSA) model for ${companyName || 'the company'} in the ${sector || 'General'} sector.
Use the supplied current metrics as the factual base. Generate a logical synthesized 3-year forecast, assumptions, sector-specific ratios and simplified DCF valuation.
Current Metrics: ${JSON.stringify(metrics, null, 2)}
Return ONLY valid JSON matching this structure:
{
  "executiveSummary":"short disclosure of current revenue, cash and profit based strictly on supplied metrics",
  "assumptions":[{"parameter":"Revenue Growth Rate","value":"15%","rationale":"Reason"}],
  "forecasting":[{"lineItem":"Revenue","y0":"100000","y1":"115000","y2":"132250","y3":"152087"},{"lineItem":"COGS","y0":"...","y1":"...","y2":"...","y3":"..."},{"lineItem":"EBITDA","y0":"...","y1":"...","y2":"...","y3":"..."},{"lineItem":"Free Cash Flow","y0":"...","y1":"...","y2":"...","y3":"..."}],
  "ratios":[{"name":"Gross Margin","value":"45%","benchmark":"40%","analysis":"Analysis"}],
  "dcf":{"wacc":"12.5%","terminalGrowth":"3.0%","enterpriseValue":"₹5,000,000","equityValue":"₹4,800,000","summary":"Summary"}
}
Use INR/₹ for currency and make all figures flow logically from the supplied metrics.`;

    const response = await generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      temperature: 0.1,
      responseMimeType: 'application/json',
    });

    const raw = response.text || '{}';
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return res.status(200).json({ data: JSON.parse(cleaned) });
  } catch (err: any) {
    console.error('FRFSA error:', err);
    return res.status(500).json({ error: 'Failed to generate FRFSA: ' + formatGeminiError(err) });
  }
}

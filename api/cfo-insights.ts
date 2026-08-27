import { generateContent, formatGeminiError } from './gemini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { metrics, sector } = req.body || {};
    const prompt = `You are an expert CFO and financial analyst acting as a human-in-the-loop AI for an accounting platform.
Company sector: ${sector || 'General'}.
Review ONLY these supplied metrics. Do not invent numbers.
Detect material fluctuations, explain financial health, and provide sector-aware recommendations.
Always use INR and ₹. Preserve supplied numbers and use no more than 2 decimal places.
Metrics: ${JSON.stringify(metrics, null, 2)}
Respond in professional clean Markdown. Begin with a concise FY disclosure of Total Revenue, Cash Reserves, Expenses and Net Profit strictly from the supplied metrics.`;

    const response = await generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      temperature: 0.2,
    });

    return res.status(200).json({ commentary: response.text || '' });
  } catch (err: any) {
    console.error('CFO Insights error:', err);
    return res.status(500).json({ error: 'Failed to generate insights: ' + formatGeminiError(err) });
  }
}

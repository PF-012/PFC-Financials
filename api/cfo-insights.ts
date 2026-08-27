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
        generationConfig: { temperature: 0.2 },
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
    const { metrics, sector } = req.body || {};
    const prompt = `You are an expert CFO and financial analyst acting as a human-in-the-loop AI for an accounting platform.
Company sector: ${sector || 'General'}.
Review ONLY these supplied metrics. Do not invent numbers.
Detect material fluctuations, explain financial health, and provide sector-aware recommendations.
Always use INR and ₹. Preserve supplied numbers and use no more than 2 decimal places.
Metrics: ${JSON.stringify(metrics, null, 2)}
Respond in professional clean Markdown. Begin with a concise FY disclosure of Total Revenue, Cash Reserves, Expenses and Net Profit strictly from the supplied metrics.`;

    const commentary = await generateGeminiContent('gemini-3.1-flash-lite', prompt);
    return res.status(200).json({ commentary });
  } catch (err: any) {
    console.error('CFO Insights error:', err);
    return res.status(500).json({ error: 'Failed to generate insights: ' + formatGeminiError(err) });
  }
}

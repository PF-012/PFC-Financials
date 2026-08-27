const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function getApiKey(): string {
  const raw = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  const key = raw.trim().replace(/^['"]|['"]$/g, '');
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return key;
}

export async function generateContent(options: {
  model: string;
  contents: unknown;
  temperature?: number;
  responseMimeType?: string;
  systemInstruction?: string;
}) {
  const key = getApiKey();
  const generationConfig: Record<string, unknown> = {};

  if (typeof options.temperature === 'number') {
    generationConfig.temperature = options.temperature;
  }
  if (options.responseMimeType) {
    generationConfig.responseMimeType = options.responseMimeType;
  }

  const body: Record<string, unknown> = {
    contents: options.contents,
  };

  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(options.model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify(body),
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || `Gemini API request failed with status ${response.status}.`;
    const error: any = new Error(message);
    error.status = response.status;
    error.code = payload?.error?.code;
    error.reason = payload?.error?.details?.find((detail: any) => detail?.reason)?.reason;
    throw error;
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: any) => part?.text || '')
    .join('') || '';

  return { text };
}

export function formatGeminiError(err: any): string {
  const message = err?.message || String(err);
  const status = err?.status;

  if (status === 401 || status === 403) {
    return 'Gemini rejected the configured API credential. Check that GEMINI_API_KEY contains a valid Gemini API key from Google AI Studio.';
  }
  if (status === 429) {
    return 'Gemini API rate limit or quota has been reached. Please try again later.';
  }
  return message;
}

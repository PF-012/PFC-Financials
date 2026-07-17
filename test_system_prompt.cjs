const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
    config: {
        systemInstruction: "You are a helpful assistant.",
        temperature: 0.7
    }
}).then(res => console.log(res.text)).catch(e => console.log(e.message));

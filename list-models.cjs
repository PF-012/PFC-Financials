const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
ai.models.list().then(res => {
  for (let model of res.models) {
    if (model.name.includes('flash')) console.log(model.name);
  }
}).catch(e => console.log(e.message));

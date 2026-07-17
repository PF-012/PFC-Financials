const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });",
  `let ai = null;
function getAIClient() {
  if (!ai) {
    if (process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } else {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.');
    }
  }
  return ai;
}`
);

code = code.replace(/await ai\.models\.generateContent/g, 'await getAIClient().models.generateContent');
code = code.replace(/model: 'gemini-1\.5-flash'/g, "model: 'gemini-flash-latest'");
code = code.replace(/model: 'gemini-1\.5-flash-latest'/g, "model: 'gemini-flash-latest'");

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts");

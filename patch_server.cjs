const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const aiChatStart = `  app.post('/api/ai-chat', async (req, res) => {`;
const aiChatEnd = `      res.status(500).json({ error: 'Failed to chat with AI: ' + (err.message || String(err)) });\n    }\n  });`;

if (code.includes(aiChatStart)) {
    const startIndex = code.indexOf(aiChatStart);
    let endIndex = code.indexOf(aiChatEnd);
    if (endIndex !== -1) {
        endIndex += aiChatEnd.length;
        
        const newCode = `  app.post('/api/ai-chat', async (req, res) => {
    try {
      const { message, attachments, chatHistory } = req.body;
      const systemPrompt = \`
      You are a helpful and expert AI Accounting Assistant embedded in an accounting software.
      Your job is to answer accounting questions from users using this software.
      Be concise, professional, and explain concepts simply.
      If the user is asking about how to record something, tell them which "Voucher Type" to use (e.g. Sales, Purchase, Payment, Receipt, Journal, Contra) and which accounts to Debit/Credit.
      
      Import and Data Sync Guidance:
      If the user is asking about an error they encountered while importing data (e.g. Excel, JSON, CSV), or if they upload an image/file showing an import error, explain clearly what the error means, why it happened, and how they can fix their file so it imports properly without any error.
      \`;
      
      const contents = [];
      
      if (chatHistory && Array.isArray(chatHistory)) {
          for (const msg of chatHistory) {
              const parts = [];
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

      const currentParts = [{ text: message }];
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

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: contents,
        config: { 
            temperature: 0.7,
            systemInstruction: systemPrompt
        }
      });
      res.json({ reply: response.text });
    } catch (err) {
      console.error('AI Chat error:', err);
      res.status(500).json({ error: 'Failed to chat with AI: ' + (err.message || String(err)) });
    }
  });`;
        
        code = code.substring(0, startIndex) + newCode + code.substring(endIndex);
        fs.writeFileSync('server.ts', code);
        console.log("Patched server.ts with better systemInstruction and role handling.");
    } else {
        console.log("Could not find end of ai-chat");
    }
} else {
    console.log("Could not find start of ai-chat");
}

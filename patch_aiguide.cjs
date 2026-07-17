const fs = require('fs');
let code = fs.readFileSync('src/pages/AIGuide.tsx', 'utf8');

code = code.replace(
  "const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: data.reply || \"I didn't quite get that.\" };",
  `if (data.error) {
        throw new Error(data.error);
      }
      const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: data.reply || "I didn't quite get that." };`
);

code = code.replace(
  "const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: \"Sorry, I encountered an error while trying to respond.\" };",
  "const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: \"Error: \" + (error instanceof Error ? error.message : String(error)) };"
);

fs.writeFileSync('src/pages/AIGuide.tsx', code);
console.log("Patched AIGuide.tsx");

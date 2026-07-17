const fs = require('fs');
let code = fs.readFileSync('src/pages/AIGuide.tsx', 'utf8');

const missingMethods = `
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const base64Data = reader.result.split(',')[1];
            setAttachments(prev => [...prev, {
              base64: base64Data,
              mimeType: file.type,
              url: reader.result as string
            }]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    const userMessage: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: input,
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };
    
    // We send previous chat history up to the last 10 messages to maintain context
    const chatHistory = messages.slice(-10);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.text,
          attachments: userMessage.attachments,
          chatHistory: chatHistory 
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(\`HTTP \${res.status}: \${errText}\`);
      }
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: data.reply || "I didn't quite get that." };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: "Error: " + (error instanceof Error ? error.message : String(error)) };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
`;

code = code.replace(
  "return (",
  missingMethods + "\n  return ("
);

fs.writeFileSync('src/pages/AIGuide.tsx', code);
console.log("Restored missing methods");

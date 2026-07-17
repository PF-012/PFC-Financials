import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Paperclip, X, Image as ImageIcon } from 'lucide-react';

interface Attachment {
  base64: string;
  mimeType: string;
  url: string; // Data URL for preview
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  attachments?: Attachment[];
}

export default function AIGuide() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ai-chat-history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
    return [{
      id: 'welcome',
      role: 'ai',
      text: "Hello! I'm your AI Accounting Assistant. You can ask me how to record transactions, clarify accounting scenarios, or get general accounting advice. How can I help you today?"
    }];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    try {
      localStorage.setItem('ai-chat-history', JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat history", e);
    }
  }, [messages]);

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

      if (!res.ok) throw new Error('Failed to fetch response');
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

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col gap-1 mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">AI Accounting Guide</h1>
        <p className="text-sm text-gray-500">Ask the AI assistant about journal entries, vouchers, and get help with data import errors.</p>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex gap-3 p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                {msg.role === 'ai' && <Bot className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />}
                
                <div className="flex flex-col gap-2">
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.attachments.map((att, i) => (
                         <div key={i} className="relative rounded overflow-hidden border border-white/20">
                            {att.mimeType.startsWith('image/') ? (
                              <img src={att.url} alt="Attachment" className="max-w-[200px] max-h-[200px] object-cover" />
                            ) : (
                              <div className="bg-white/10 p-4 flex items-center justify-center min-w-[100px] min-h-[100px]">
                                <ImageIcon className="w-8 h-8 opacity-50" />
                              </div>
                            )}
                         </div>
                      ))}
                    </div>
                  )}
                  <div className="text-[14px] whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                </div>

                {msg.role === 'user' && <User className="w-5 h-5 shrink-0 mt-0.5 text-white/80" />}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-4 rounded-lg flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-3">
          {attachments.length > 0 && (
             <div className="flex flex-wrap gap-3">
                {attachments.map((att, index) => (
                   <div key={index} className="relative group rounded-md border border-gray-300 bg-white overflow-hidden w-16 h-16 shadow-sm">
                      {att.mimeType.startsWith('image/') ? (
                         <img src={att.url} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center bg-gray-100">
                           <ImageIcon className="w-6 h-6 text-gray-400" />
                         </div>
                      )}
                      <button 
                         onClick={() => removeAttachment(index)}
                         className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                         <X className="w-3 h-3" />
                      </button>
                   </div>
                ))}
             </div>
          )}
          <div className="flex gap-2 items-center">
            <button
               onClick={() => fileInputRef.current?.click()}
               className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
               title="Attach Image/File"
               disabled={loading}
            >
               <Paperclip className="w-5 h-5" />
            </button>
            <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               onChange={handleFileChange}
               multiple
               accept="image/*,.pdf,.csv,.json,.xml,.xlsx,.xls,.txt"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="E.g., How do I fix this import error?"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && attachments.length === 0)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

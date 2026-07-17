const fs = require('fs');
let code = fs.readFileSync('src/pages/AIGuide.tsx', 'utf8');

const replacement = `export default function AIGuide() {
  const { user } = useAuth();
  const storageKey = user ? \`ai-chat-history-\${user.id}\` : 'ai-chat-history';

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [{
      id: 'welcome',
      role: 'ai',
      text: "Hello! I'm your AI Accounting Assistant. You can ask me how to record transactions, clarify accounting scenarios, or get general accounting advice. How can I help you today?"
    }];
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([{
          id: 'welcome',
          role: 'ai',
          text: "Hello! I'm your AI Accounting Assistant. You can ask me how to record transactions, clarify accounting scenarios, or get general accounting advice. How can I help you today?"
        }]);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  }, [storageKey]);

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
    // Only save if it's more than just the welcome message, or if it changed
    if (messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.error("Failed to save chat history", e);
      }
    }
  }, [messages, storageKey]);

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      const welcome = [{
        id: 'welcome',
        role: 'ai',
        text: "Hello! I'm your AI Accounting Assistant. You can ask me how to record transactions, clarify accounting scenarios, or get general accounting advice. How can I help you today?"
      }];
      setMessages(welcome);
      localStorage.removeItem(storageKey);
    }
  };`;

// Use regex to replace the function up to handleClearChat
code = code.replace(/export default function AIGuide\(\) \{[\s\S]*?localStorage\.removeItem\('ai-chat-history'\);\s*\}\s*\};\s*/, replacement + '\n\n');

fs.writeFileSync('src/pages/AIGuide.tsx', code);
console.log("Patched AIGuide.tsx logic");

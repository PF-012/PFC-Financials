import React, { useState } from 'react';
import { Bot, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PayrollGuide() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Hi! I am your AI Payroll Guide. I can help you with Tax Calculations, EPF rules, New vs Old Regime comparisons, or any other payroll-related queries based on the 2026 Tax Rules. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsgs = [...messages, { role: 'user' as const, text: input }];
    setMessages(newMsgs);
    setInput('');

    // Simulated AI Response for now - in a real app this would call an API
    setTimeout(() => {
      let reply = "I'm sorry, I'm currently in demo mode. However, you can check the standard tax rules directly in the app. For the New Tax Regime (2026), income up to 7L is tax-free due to the 87A rebate. Standard deduction of ₹50,000 applies to both old and new regimes!";
      
      if (input.toLowerCase().includes('tax') || input.toLowerCase().includes('regime')) {
        reply = "Under the New Tax Regime (FY 26-27), the standard deduction is ₹50,000. Income up to ₹7,00,000 is tax-free due to Section 87A rebate. Slabs are: 0-3L (Nil), 3-6L (5%), 6-9L (10%), 9-12L (15%), 12-15L (20%), >15L (30%). Old regime allows 80C deductions up to ₹1.5L.";
      } else if (input.toLowerCase().includes('epf') || input.toLowerCase().includes('pf')) {
        reply = "Employee Provident Fund (EPF) deduction is mandatory for employees with basic salary up to ₹15,000, but widely applied to all. The standard rate is 12% of (Basic Pay + DA). The employer also contributes 12% (3.67% to EPF, 8.33% to EPS).";
      }

      setMessages([...newMsgs, { role: 'ai', text: reply }]);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <button onClick={() => navigate('/payroll')} className="p-2 text-gray-500 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Bot className="w-6 h-6" /></span>
            Payroll AI Guide
          </h1>
          <p className="text-sm text-gray-500 mt-1">Get instant answers about tax calculations and payroll compliance</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-blue-900 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-3">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about 2026 tax slabs, standard deductions, or EPF calculations..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-3 bg-blue-900 text-white rounded-xl font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Ask <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

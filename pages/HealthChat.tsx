
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Send, User, Bot, Loader2, RefreshCw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const HealthChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your Health Helpdesk Chatbot. How can I assist you today? You can ask about general health tips, symptom information, or how our kiosk works.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: 'You are an expert health advisor for a rural health helpdesk. Provide helpful, medically accurate information while always advising to seek professional care. Use simple language.'
        }
      });

      const response = await chat.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm sorry, I couldn't process that request." }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HealthChat AI</h1>
          <p className="text-slate-500">24/7 Support with Gemini Pro Reasoning</p>
        </div>
        <button 
          onClick={() => setMessages([{ role: 'assistant', content: 'Chat reset. How can I help you?' }])}
          className="p-2 text-slate-400 hover:text-teal-600 transition-colors"
        >
          <RefreshCw size={20} />
        </button>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-sm mb-6 overflow-y-auto p-6 space-y-6"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
              m.role === 'assistant' ? 'bg-teal-600 text-white' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {m.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              m.role === 'assistant' 
                ? 'bg-slate-50 text-slate-800' 
                : 'bg-teal-600 text-white'
            }`}>
              <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white shrink-0 flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-2">
              <Loader2 className="animate-spin text-teal-600" size={16} />
              <span className="text-slate-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a health question (e.g., 'What are the first signs of malaria?')"
          className="w-full pl-6 pr-16 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-100 outline-none transition-all"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          <Send size={20} />
        </button>
      </div>
      <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">
        Powered by Gemini 3 Pro • For information only
      </p>
    </div>
  );
};

export default HealthChat;

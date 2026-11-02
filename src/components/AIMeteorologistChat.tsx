import React, { useState, useRef, useEffect } from 'react';
import { LocationData, ForecastData, HistoricalClimateData } from '../types/weather';
import { askAIMeteorologist } from '../services/weatherApi';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  HelpCircle,
  Minimize2,
  RefreshCw,
} from 'lucide-react';

interface AIMeteorologistChatProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationData;
  forecast: ForecastData;
  historical: HistoricalClimateData | null;
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AIMeteorologistChat: React.FC<AIMeteorologistChatProps> = ({
  isOpen,
  onClose,
  location,
  forecast,
  historical,
  initialQuestion,
  onClearInitialQuestion,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello! I am AetherBot, your AI Meteorologist powered by Gemini 3.8. I have loaded all current observations, the 14-day deterministic forecast, and multi-decade climate archives for **${location.name}**. How can I assist your meteorological analysis today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle external prompt clicks (from AIMeteorologyCard)
  useEffect(() => {
    if (initialQuestion && isOpen) {
      handleSend(initialQuestion);
      onClearInitialQuestion?.();
    }
  }, [initialQuestion, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const answer = await askAIMeteorologist(
        q,
        location,
        forecast.current,
        forecast.daily,
        historical
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `I encountered an issue analyzing the atmosphere for that query. Please check your connection or retry in a moment.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const starterPrompts = [
    `Will it rain this weekend in ${location.name}?`,
    `How does this 14-day period compare to 20-year climate norms?`,
    `What should I wear or pack for the upcoming week?`,
    `Are there any high wind or convective storm risks?`,
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full sm:w-[440px] max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-32px)] flex flex-col rounded-3xl bg-slate-900 border border-cyan-500/30 shadow-2xl overflow-hidden backdrop-blur-xl animate-fadeIn">
      {/* Top Header */}
      <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white">AI Meteorologist</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300">
                Gemini 3.8
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
              Active context: {location.name}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-cyan-400'
              }`}
            >
              {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[82%] p-3.5 rounded-2xl ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-950/80 border border-slate-800/80 text-slate-200 rounded-tl-none leading-relaxed'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>
              <div
                className={`mt-1.5 text-[9px] font-mono ${
                  m.sender === 'user' ? 'text-blue-200' : 'text-slate-500'
                }`}
              >
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs w-max">
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Analyzing atmospheric synoptics...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto whitespace-nowrap flex items-center gap-2 scrollbar-none text-[11px]">
        {starterPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder={`Ask about ${location.name}'s weather or climate...`}
          className="flex-1 px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isLoading}
          className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition-all shadow-sm shadow-cyan-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

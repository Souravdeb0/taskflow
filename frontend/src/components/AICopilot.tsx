import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, X, Bot, Sparkles, MessageSquare, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AICopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem('taskflow_copilot_chat');
    if (saved) return JSON.parse(saved);
    return [{
      role: 'assistant',
      content: "Hello! I am your TaskFlow Copilot. Ask me anything about tickets, task statuses, or team workloads in your workspace!",
    }];
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const suggestionChips = [
    "List high priority tickets",
    "What tasks are in progress?",
    "Summarize my workspace workload",
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Save to session storage whenever messages change
  useEffect(() => {
    sessionStorage.setItem('taskflow_copilot_chat', JSON.stringify(messages));
  }, [messages]);

  const [lastMessageTime, setLastMessageTime] = useState(0);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const now = Date.now();
    if (now - lastMessageTime < 3000) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⏳ Please wait a few seconds before sending another message to avoid rate limits.' }]);
      return;
    }
    setLastMessageTime(now);

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setIsLoading(true);

    try {
      // Send message to backend with history (limit to last 15 messages to save tokens)
      const recentMessages = messages.slice(-15);
      const chatHistory = recentMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await api.ai.chat(textToSend, chatHistory);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err: any) {
      console.error('AICopilot Error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Sorry, I encountered an error: ${err.message || 'Failed to connect to AI server.'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full shadow-lg hover:shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all z-50 flex items-center justify-center border border-indigo-400/20"
        title="Open AI Copilot"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </button>

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px]">
          {/* Backdrop closer */}
          <div className="flex-1" onClick={() => setIsOpen(false)} />

          {/* Chat Container */}
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md border-l border-slate-100 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Bot className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
                    TaskFlow Copilot
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">AI Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body & Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-sm shadow-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}
                  >
                    <div className="space-y-1 markdown-prose">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-none p-3.5 shadow-sm flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-xs text-slate-500 font-medium">Analysing workspace...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Box (shown if no loading & at beginning) */}
            {messages.length === 1 && !isLoading && (
              <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 mb-2 px-1">Suggested Prompts</p>
                <div className="flex flex-col gap-1.5">
                  {suggestionChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="text-left w-full px-3 py-2 bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 rounded-xl text-xs font-medium text-slate-700 hover:text-indigo-800 transition-all flex items-center justify-between group"
                    >
                      {chip}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-600 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(message);
              }}
              className="p-3 bg-white border-t border-slate-100 flex gap-2"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about tickets, assignees..."
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all placeholder:text-slate-400 text-slate-800"
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all flex items-center justify-center shadow-md shadow-indigo-600/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

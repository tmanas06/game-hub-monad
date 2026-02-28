"use client"

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "👋 Hey there! I'm your AI Gaming Assistant! I can help you with:\n\n🎮 Game strategies and tips\n💰 Understanding rewards and payouts\n🏆 Achievement guidance\n⚡ Performance optimization\n\nWhat would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:5001'
      : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001'));

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(`${API_URL}/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory: conversationHistory
        })
      });

      const data = await response.json();

      if (data.success && data.response) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateAIResponse(currentInput),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    if (lowerInput.includes("strategy") || lowerInput.includes("tip") || lowerInput.includes("help")) {
      return "🎯 **Strategy Tips:**\n\n• Focus on building combos - rapid taps = more points!\n• In Snake: Plan your route to trap food near walls\n• Power-ups are game changers!";
    }
    if (lowerInput.includes("reward") || lowerInput.includes("mon")) {
      return "💰 **Rewards System:**\n\n• Score 100+ points to earn rewards\n• 100 points = 1 MON";
    }
    return "🤖 Thanks for your question! Feel free to ask me anything about the games! 💡";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pt-24 pb-12 px-4 overflow-x-hidden relative font-body">
      {/* Background Graphic Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-brand-skyblue/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-purple/10 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 relative">
          <h1 className="text-6xl md:text-8xl font-display font-black mb-4 uppercase italic tracking-tighter italic">
            AI <span className="text-brand-lime">ASSISTANT</span>
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-1 w-12 bg-brand-purple neo-brutalism-sm"></div>
            <p className="text-xl font-display font-black uppercase italic tracking-tight text-white/70">Next-gen gaming intelligence</p>
            <div className="h-1 w-12 bg-brand-skyblue neo-brutalism-sm"></div>
          </div>
        </div>

        {/* Chat Container - Neo Brutalist Overhaul */}
        <div className="bg-white p-0 neo-brutalism overflow-hidden h-[700px] flex flex-col border-4 border-black mb-12">
          {/* Chat Header */}
          <div className="bg-brand-purple p-5 border-b-4 border-black flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black flex items-center justify-center neo-brutalism-sm">
                <Bot className="w-7 h-7 text-brand-lime" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black uppercase tracking-tight text-white">GAMING-BOT-3000</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-brand-lime rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-lime">System Online</span>
                </div>
              </div>
            </div>
            <Sparkles className="w-8 h-8 text-brand-yellow animate-pulse" />
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F8F8F8]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-10 h-10 bg-black flex items-center justify-center self-end neo-brutalism-sm-black">
                    <Bot className="w-6 h-6 text-brand-lime" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] p-5 neo-brutalism-sm relative",
                    message.role === "user"
                      ? "bg-brand-lime border-black text-black rotate-[1deg]"
                      : "bg-black border-black text-white rotate-[-1deg]"
                  )}
                >
                  <p className="whitespace-pre-wrap font-body font-bold text-sm md:text-base leading-relaxed">
                    {message.content}
                  </p>
                  <div className={cn(
                    "mt-3 text-[10px] font-black uppercase tracking-widest opacity-40",
                    message.role === "user" ? "text-black" : "text-brand-lime"
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="w-10 h-10 bg-brand-yellow flex items-center justify-center self-end neo-brutalism-sm-black text-black font-display font-black">
                    U
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 bg-black flex items-center justify-center neo-brutalism-sm-black">
                  <Bot className="w-6 h-6 text-brand-lime" />
                </div>
                <div className="bg-black border-black text-white p-5 neo-brutalism-sm rotate-[-1deg]">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 bg-brand-lime animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-brand-skyblue animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-brand-coral animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - High Contrast */}
          <div className="p-6 bg-brand-yellow border-t-4 border-black">
            <div className="flex gap-4">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="PROMPT THE ENGINE..."
                className="flex-1 bg-white border-4 border-black px-6 py-4 text-black font-display font-black placeholder-black/40 focus:outline-none focus:bg-brand-lime transition-all uppercase tracking-tight"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-8 h-[60px] bg-black text-brand-lime font-display font-black uppercase text-lg neo-brutalism-sm transition-all hover:bg-neutral-900 active:translate-y-1 disabled:opacity-50 flex items-center gap-2"
              >
                <span>SEND</span>
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

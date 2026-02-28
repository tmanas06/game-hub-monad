"use client"

import { useState, useEffect } from "react";
import MonadGamingDApp from "@/components/game";
import SnakeGame from "@/components/SnakeGame";
import CryptoDodger from "@/components/CryptoDodger";
import GuessTheMarket from "@/components/GuessTheMarket";
import { Gamepad2, MoveRight, Shield, Sparkles, Trophy, Zap, Star, Bot, X, ChevronRight, TrendingUp } from "lucide-react";

type GameType = 'bubble' | 'snake' | 'crypto' | 'market';

export default function GamePage() {
  const [activeGame, setActiveGame] = useState<GameType>('bubble');
  const [showAIMessage, setShowAIMessage] = useState(true);
  const [aiMessage, setAiMessage] = useState("");
  const [aiMessages, setAiMessages] = useState<string[]>([]);

  // AI-powered game tips based on selected game
  useEffect(() => {
    const tips = {
      bubble: "💡 AI Assistant: Pop bubbles rapidly to build combo multipliers! Quick taps = more points! Avoid red bombs - they're game enders!",
      snake: "🤖 AI Assistant: Strategic thinking wins! Trap food near walls for longer snake growth. Patience over speed - plan your route!",
      crypto: "⚡ AI Assistant: Coin collection is priority #1! Use freeze power-ups strategically when overwhelmed. Pattern recognition is key!",
      market: "📈 AI Assistant: Predict crypto movements in 10 seconds! Analyze trends and make smart guesses. +10 for correct, -10 for wrong predictions!"
    };

    setShowAIMessage(true);
    const newTip = tips[activeGame];
    setAiMessage(newTip);
    setAiMessages(prev => [...prev.filter(m => m !== newTip), newTip]);

    // Don't auto-hide - let user dismiss manually
  }, [activeGame]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pt-24 pb-12 px-4 overflow-x-hidden relative font-body">
      {/* Background Graphic Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-brand-lime/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-coral/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="max-w-7xl mx-auto min-h-[calc(100vh-5rem)] relative z-10 text-center">
        {/* Header Section */}
        <div className="mb-12 relative animate-fadeIn">
          <h1 className="text-6xl md:text-8xl font-display font-black mb-4 uppercase italic tracking-tighter italic">
            ARCADE <span className="text-brand-lime">CENTER</span>
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="px-4 py-1.5 bg-brand-yellow text-black font-display font-black text-sm neo-brutalism-sm rotate-[-1deg]">
              PLAY & EARN
            </div>
            <div className="px-4 py-1.5 bg-brand-coral text-black font-display font-black text-sm neo-brutalism-sm rotate-[1deg]">
              GASLESS
            </div>
            <div className="px-4 py-1.5 bg-brand-skyblue text-black font-display font-black text-sm neo-brutalism-sm rotate-[-2deg]">
              AI ASSISTED
            </div>
          </div>
        </div>

        {/* AI Assistant Panel - Neo Brutalist Style */}
        {showAIMessage && (
          <div className="mb-10 mx-auto max-w-4xl relative group">
            <div className="bg-brand-skyblue p-6 neo-brutalism rotate-[0.5deg] relative">
              <div className="flex items-start gap-5 text-black">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-black flex items-center justify-center neo-brutalism-sm">
                    <Bot className="w-8 h-8 text-brand-lime" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-black animate-pulse" />
                    <h3 className="text-xl font-display font-black uppercase italic">AI Gaming Assistant</h3>
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-ping ml-2"></div>
                  </div>
                  <p className="text-black font-body font-black text-lg leading-tight uppercase tracking-tight">{aiMessage}</p>
                </div>
                <button
                  onClick={() => setShowAIMessage(false)}
                  className="flex-shrink-0 p-2 bg-black hover:bg-white hover:text-black transition-colors neo-brutalism-sm group-hover:rotate-6"
                >
                  <X className="w-5 h-5 text-white group-hover:text-black" />
                </button>
              </div>
            </div>
            {/* Background shadow box */}
            <div className="absolute top-2 left-2 w-full h-full bg-black -z-10 neo-brutalism pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </div>
        )}

        {/* AI toggle if hidden */}
        {!showAIMessage && (
          <div className="mb-10">
            <button
              onClick={() => setShowAIMessage(true)}
              className="px-8 py-3 bg-brand-skyblue text-black font-display font-black text-lg neo-brutalism uppercase hover:bg-white transition-all transform hover:-translate-y-1 hover:-translate-x-1"
            >
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                Summon AI Assistant
              </div>
            </button>
          </div>
        )}

        {/* Game Selector - Redesigned Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-5xl mx-auto">
          {[
            { id: 'bubble', label: 'Bubble Tap', icon: Gamepad2, color: 'bg-brand-lime', activeColor: 'bg-white' },
            { id: 'snake', label: 'Classic Snake', icon: MoveRight, color: 'bg-brand-coral', activeColor: 'bg-white' },
            { id: 'crypto', label: 'Crypto Dodger', icon: Shield, color: 'bg-brand-skyblue', activeColor: 'bg-white' },
            { id: 'market', label: 'Guess Market', icon: TrendingUp, color: 'bg-brand-yellow', activeColor: 'bg-white' }
          ].map((game) => (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id as GameType)}
              className={cn(
                "p-4 flex flex-col items-center gap-3 transition-all neo-brutalism",
                activeGame === game.id ? "bg-white text-black scale-105" : game.color + " text-black hover:bg-white"
              )}
            >
              <div className="p-2 bg-black neo-brutalism-sm">
                <game.icon className={cn("w-6 h-6", activeGame === game.id ? "text-white" : "text-white")} />
              </div>
              <span className="font-display font-black text-base uppercase italic">{game.label}</span>
              {activeGame === game.id && (
                <div className="absolute -top-2 -right-2 bg-black text-white p-1 neo-brutalism-sm animate-bounce">
                  <Star className="w-4 h-4 fill-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Game Container Section */}
        <div className="relative mb-12">
          <div className="bg-black p-4 md:p-8 neo-brutalism border-8 border-black shadow-[20px_20px_0_0_rgba(255,255,255,0.05)]">
            <div className="bg-[#121214] min-h-[500px] rounded-sm relative overflow-hidden flex flex-col items-center justify-center p-2 border-4 border-black/30">
              {activeGame === 'bubble' && <MonadGamingDApp />}
              {activeGame === 'snake' && <SnakeGame />}
              {activeGame === 'crypto' && <CryptoDodger />}
              {activeGame === 'market' && <GuessTheMarket />}
            </div>
          </div>

          {/* Decorative corner tag */}
          <div className="absolute -top-4 -left-4 px-6 py-2 bg-brand-coral text-black font-display font-black text-lg neo-brutalism-sm rotate-[-5deg] z-20">
            LIVE NOW
          </div>
          <div className="absolute -bottom-4 -right-4 px-6 py-2 bg-brand-lime text-black font-display font-black text-lg neo-brutalism-sm rotate-[3deg] z-20">
            WIN TOKENS
          </div>
        </div>

        {/* Info Footer Card */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-brand-yellow p-8 neo-brutalism rotate-[-1deg]">
            <div className="flex flex-col md:flex-row items-center gap-8 text-black">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                  <Zap className="w-8 h-8 text-black animate-pulse" />
                  <h3 className="text-2xl font-display font-black uppercase italic">Game Objectives</h3>
                </div>
                <p className="text-xl font-body font-black uppercase italic tracking-tighter leading-tight border-b-4 border-black/20 pb-2 mb-4">
                  {activeGame === 'bubble' ? '🎯 Click bubbles to pop them and score points!' :
                    activeGame === 'snake' ? '🐍 Use arrow keys or WASD to control the snake!' :
                      activeGame === 'crypto' ? '🚀 Dodge bombs and collect coins to score!' :
                        '📈 Predict crypto price movements and earn points!'}
                </p>
                <div className="flex items-center gap-2 font-display font-bold text-lg uppercase tracking-tight bg-black text-white p-3 neo-brutalism-sm">
                  {activeGame === 'market' ? '💵 Correct guess: +10 pts | Wrong: -10 pts' : '💰 Earn Rewards: 100 points = 1 MON Token'}
                </div>
              </div>
              <div className="flex-shrink-0 w-full md:w-auto">
                <div className="p-6 bg-brand-purple text-white neo-brutalism rotate-[3deg] hover:rotate-0 transition-transform">
                  <Bot className="w-10 h-10 mb-2 mx-auto" />
                  <p className="font-display font-black text-sm uppercase">AI Enhanced</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}


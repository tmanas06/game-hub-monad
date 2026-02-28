"use client"

import Link from "next/link";
import { Gamepad2, Trophy, Zap, Bot, Coins, ArrowRight, Star } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pt-28 pb-20 px-4 overflow-x-hidden relative">
      {/* Background Graphic Elements */}
      <div className="absolute top-40 -left-20 w-80 h-80 bg-brand-purple/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-40 -right-20 w-80 h-80 bg-brand-lime/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
          <div className="flex-1 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-lime neo-brutalism-sm mb-6 rotate-[-1deg]">
              <Star className="w-4 h-4 text-black fill-black" />
              <span className="text-xs font-display font-black text-black tracking-tight uppercase">The Future of Web3 Gaming</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-display font-black leading-[0.9] mb-8 uppercase italic tracking-tighter">
              Bolder. <span className="text-brand-lime">Faster.</span> <br />
              <span className="text-brand-coral">Better.</span>
            </h1>

            <p className="text-lg md:text-xl font-body font-bold text-gray-400 mb-10 max-w-2xl leading-relaxed">
              Experience <span className="text-white">GASLESS</span> gaming on Monad Testnet. AI-powered strategies, lightning-fast gameplay, and massive rewards. Zero generic vibes.
            </p>

            <div className="flex flex-wrap gap-6">
              <Link href="/game">
                <button className="px-10 py-5 bg-brand-lime text-black font-display font-black text-xl neo-brutalism uppercase hover:bg-white hover:text-black hover:-translate-y-1 hover:-translate-x-1 transition-all flex items-center gap-3">
                  <Gamepad2 className="w-6 h-6" />
                  Play Now
                  <ArrowRight className="w-6 h-6" />
                </button>
              </Link>
              <Link href="/leaderboard">
                <button className="px-10 py-5 bg-brand-skyblue text-black font-display font-black text-xl neo-brutalism uppercase hover:bg-white hover:text-black hover:-translate-y-1 hover:-translate-x-1 transition-all">
                  Scoreboard
                </button>
              </Link>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="relative z-10 p-4 bg-brand-purple neo-brutalism rotate-[3deg] hover:rotate-0 transition-transform duration-500">
              <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center border-4 border-black">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/40 to-brand-coral/40 animate-pulse"></div>
                <Gamepad2 className="w-32 h-32 text-white animate-bounce" />
                <div className="absolute bottom-4 left-4 right-4 h-4 bg-brand-lime neo-brutalism-sm"></div>
              </div>
            </div>
            {/* Decorative background boxes */}
            <div className="absolute top-10 right-10 w-full h-full border-4 border-brand-coral neo-brutalism -z-10 bg-transparent rotate-[-2deg]"></div>
            <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-brand-yellow neo-brutalism rotate-[15deg] -z-10"></div>
          </div>
        </div>

        {/* Features Row - High Contrast Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {[
            {
              title: "AI AGENT",
              desc: "Pro-level strategies and real-time tips to dominate every leaderboard.",
              icon: <Bot className="w-10 h-10" />,
              color: "bg-brand-lime",
              rotation: "rotate-[-1deg]"
            },
            {
              title: "GASLESS",
              desc: "Zero transaction fees. Play instantly on Monad Testnet with our gasless relayer.",
              icon: <Zap className="w-10 h-10" />,
              color: "bg-brand-skyblue",
              rotation: "rotate-[1deg]"
            },
            {
              title: "REWARDS",
              desc: "Earn MON tokens for your skills. 100 points = 1 MON. Paid out instantly.",
              icon: <Coins className="w-10 h-10" />,
              color: "bg-brand-coral",
              rotation: "rotate-[-2deg]"
            }
          ].map((feat, i) => (
            <div key={i} className={cn("p-8 neo-brutalism", feat.color, feat.rotation)}>
              <div className="p-3 bg-black inline-block mb-6 neo-brutalism-sm">
                <div className="text-white">{feat.icon}</div>
              </div>
              <h3 className="text-3xl font-display font-black text-black mb-4 uppercase">{feat.title}</h3>
              <p className="font-body font-bold text-black/80 text-lg leading-tight uppercase tracking-tight">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="p-12 bg-brand-yellow neo-brutalism text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-black group-hover:h-full transition-all duration-300 -z-10 group-hover:opacity-10"></div>
          <h2 className="text-5xl md:text-7xl font-display font-black text-black mb-8 uppercase italic tracking-tighter italic">
            Ready to <span className="underline decoration-8 decoration-black">Win?</span>
          </h2>
          <div className="flex justify-center flex-wrap gap-6">
            <Link href="/ai-chat">
              <button className="px-8 py-4 bg-black text-white font-display font-black text-lg neo-brutalism-sm uppercase hover:bg-brand-lime hover:text-black transition-colors">
                Chat with AI
              </button>
            </Link>
            <Link href="/profile">
              <button className="px-8 py-4 bg-white text-black border-4 border-black font-display font-black text-lg neo-brutalism-sm uppercase hover:bg-brand-coral transition-colors">
                View Profile
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

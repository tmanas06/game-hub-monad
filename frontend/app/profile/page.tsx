'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { formatEther } from 'viem';
import { publicClient } from '@/lib/viem';
import { Trophy, Star, Target, TrendingUp, Award, Crown, Coins, Copy, Check } from 'lucide-react';

export default function ProfilePage() {
  const { user, authenticated, ready } = usePrivy();
  const [balance, setBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const address = user?.wallet?.address;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'NOT CONNECTED';

  useEffect(() => {
    if (!authenticated || !address) return;
    let cancelled = false;

    (async () => {
      try {
        const wei = await publicClient.getBalance({
          address: address as `0x${string}`,
        });
        if (!cancelled) setBalance(formatEther(wei));
      } catch (err) {
        console.error('Balance fetch failed:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [authenticated, address]);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const [gameStats, setGameStats] = useState<any>(null);
  const [marketStats, setMarketStats] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  useEffect(() => {
    if (!authenticated || !address) return;

    const fetchStats = async () => {
      try {
        const [gResp, mResp] = await Promise.all([
          fetch(`${API_URL}/api/stats/${address}`),
          fetch(`${API_URL}/api/market/stats/${address}`)
        ]);

        if (gResp.ok) setGameStats(await gResp.json());
        if (mResp.ok) {
          const mData = await mResp.json();
          setMarketStats(mData.stats);
        }
      } catch (err) {
        console.error('Stats fetch failed:', err);
      }
    };

    fetchStats();
  }, [authenticated, address, API_URL]);

  const stats = [
    {
      label: "Games Played",
      value: gameStats?.gamesPlayed || "0",
      icon: <Target className="w-6 h-6" />,
      color: "bg-brand-lime"
    },
    {
      label: "Best Score",
      value: gameStats?.bestScore || "0",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-brand-coral"
    },
    {
      label: "Market Guesses",
      value: marketStats?.totalGuesses || "0",
      icon: <Trophy className="w-6 h-6" />,
      color: "bg-brand-skyblue"
    },
    {
      label: "Win Rate",
      value: marketStats?.totalGuesses > 0
        ? `${Math.round((marketStats.correctGuesses / marketStats.totalGuesses) * 100)}%`
        : "0%",
      icon: <Star className="w-6 h-6" />,
      color: "bg-brand-yellow"
    }
  ];

  const achievements = [
    { name: "Bubble Popper", icon: "🎯", unlocked: (gameStats?.totalScore || 0) >= 1000, description: "Earn 1000 total points" },
    { name: "Time Master", icon: "⏱️", unlocked: (gameStats?.gamesPlayed || 0) >= 10, description: "Play 10 sessions" },
    { name: "Predictor", icon: "🔮", unlocked: (marketStats?.correctGuesses || 0) >= 5, description: "5 correct market guesses" },
    { name: "Combo King", icon: "🔥", unlocked: (gameStats?.bestScore || 0) >= 500, description: "Get score over 500" },
    { name: "Early Adopter", icon: "💎", unlocked: true, description: "Monad Testnet pioneer" },
    { name: "Whale in Training", icon: "🐋", unlocked: (marketStats?.totalGuesses || 0) >= 20, description: "Make 20 market predictions" }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pt-24 pb-12 px-4 overflow-x-hidden relative font-body">
      {/* Background Graphic Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-brand-purple/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-lime/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Profile Header - Neo Brutalist Overhaul */}
        <div className="bg-brand-purple p-8 neo-brutalism rotate-[-1deg] mb-12 relative group">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-black">
            {/* Avatar Section */}
            <div className="relative group-hover:rotate-6 transition-transform">
              <div className="w-36 h-36 bg-black flex items-center justify-center text-6xl font-display font-black neo-brutalism text-brand-lime uppercase">
                {user?.email?.address?.[0] || user?.wallet?.address?.[2] || 'U'}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-brand-lime w-8 h-8 rounded-none border-4 border-black neo-brutalism-sm"></div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl md:text-7xl font-display font-black mb-2 uppercase italic tracking-tighter italic">
                PLAYER <span className="text-white bg-black px-4 neo-brutalism-sm">{authenticated ? 'ACTIVE' : 'READY'}</span>
              </h1>
              <button
                onClick={copyAddress}
                className="group flex items-center gap-2 mx-auto md:mx-0 text-2xl font-display font-black text-black/70 mb-6 uppercase tracking-tight hover:text-black transition-colors"
                title="Copy Address"
              >
                {shortAddress}
                {copied ? <Check className="w-5 h-5 text-black" /> : <Copy className="w-5 h-5 text-black opacity-40 group-hover:opacity-100" />}
              </button>

              <div className="inline-flex items-center gap-3 px-6 py-3 bg-brand-yellow neo-brutalism-sm text-black">
                <Coins className="w-6 h-6" />
                <span className="font-display font-black text-lg uppercase">
                  Balance: <span className="underline decoration-4">
                    {balance !== null ? `${Number(balance).toFixed(4)} MON` : 'SYNCING...'}
                  </span>
                </span>
              </div>
            </div>
          </div>
          {/* Background Shadow Box */}
          <div className="absolute top-3 left-3 w-full h-full bg-black -z-10 neo-brutalism pointer-events-none opacity-20 transition-opacity"></div>
        </div>

        {/* Stats Grid - High Contrast Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                "p-8 neo-brutalism transition-all hover:bg-white flex flex-col items-center group",
                stat.color,
                index % 2 === 0 ? "rotate-[1deg]" : "rotate-[-1deg]"
              )}
            >
              <div className="p-3 bg-black text-white neo-brutalism-sm mb-4 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <div className="text-4xl font-display font-black text-black mb-1 leading-none uppercase">
                {stat.value}
              </div>
              <div className="text-sm font-display font-black text-black/60 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Achievements Section - Neo Brutalist Layout */}
        <div className="bg-black p-8 neo-brutalism mb-16 shadow-[15px_15px_0_0_rgba(255,255,255,0.05)] border-4 border-brand-yellow/50">
          <div className="flex items-center gap-4 mb-8">
            <Award className="w-10 h-10 text-brand-yellow animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter">
              AWARDS & <span className="text-brand-yellow">RANKINGS</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={cn(
                  "p-5 neo-brutalism-sm border-2 transition-all group flex items-center gap-5",
                  achievement.unlocked
                    ? 'bg-brand-coral/10 border-brand-coral hover:bg-brand-coral hover:text-black'
                    : 'bg-white/5 border-white/10 opacity-40 grayscale'
                )}
              >
                <div className={cn(
                  "w-16 h-16 flex items-center justify-center text-3xl neo-brutalism-sm transition-transform group-hover:rotate-12",
                  achievement.unlocked ? 'bg-brand-yellow' : 'bg-gray-800'
                )}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      "text-xl font-display font-black uppercase tracking-tight",
                      achievement.unlocked ? 'text-white group-hover:text-black' : 'text-gray-500'
                    )}>
                      {achievement.name}
                    </h3>
                    {achievement.unlocked && <Crown className="w-4 h-4 text-brand-yellow" />}
                  </div>
                  <p className={cn(
                    "text-sm font-body font-bold uppercase tracking-tight leading-none",
                    achievement.unlocked ? 'text-white/70 group-hover:text-black/80' : 'text-gray-600'
                  )}>
                    {achievement.description}
                  </p>
                </div>
                {achievement.unlocked && (
                  <div className="bg-black p-1 neo-brutalism-sm group-hover:bg-white transition-colors">
                    <Star className="w-4 h-4 text-brand-yellow group-hover:text-brand-coral fill-current" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

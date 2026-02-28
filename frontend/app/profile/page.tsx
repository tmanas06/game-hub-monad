'use client';

import { Trophy, Star, Target, TrendingUp, Award, Crown } from 'lucide-react';
import { Coins } from 'lucide-react';

export default function ProfilePage() {
  const stats = [
    { label: "Games Played", value: "24", icon: <Target className="w-6 h-6" />, color: "bg-brand-lime" },
    { label: "High Score", value: "1,250", icon: <TrendingUp className="w-6 h-6" />, color: "bg-brand-coral" },
    { label: "Current Rank", value: "#42", icon: <Trophy className="w-6 h-6" />, color: "bg-brand-skyblue" },
    { label: "Total Points", value: "8,760", icon: <Star className="w-6 h-6" />, color: "bg-brand-yellow" }
  ];

  const achievements = [
    { name: "Bubble Popper", icon: "🎯", unlocked: true, description: "Pop 100 bubbles" },
    { name: "Time Master", icon: "⏱️", unlocked: true, description: "Complete time attack mode" },
    { name: "Survivor", icon: "🛡️", unlocked: true, description: "Survive 5 minutes" },
    { name: "Combo King", icon: "🔥", unlocked: false, description: "Get 10x combo" },
    { name: "Crypto Collector", icon: "💰", unlocked: false, description: "Earn 10 MON" },
    { name: "Legendary", icon: "👑", unlocked: false, description: "Reach top 10" }
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
                U
              </div>
              <div className="absolute -bottom-2 -right-2 bg-brand-lime w-8 h-8 rounded-none border-4 border-black neo-brutalism-sm"></div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl md:text-7xl font-display font-black mb-2 uppercase italic tracking-tighter italic">
                PLAYER <span className="text-white bg-black px-4 neo-brutalism-sm">ONE</span>
              </h1>
              <p className="text-2xl font-display font-black text-black/70 mb-6 uppercase tracking-tight">@username</p>

              <div className="inline-flex items-center gap-3 px-6 py-3 bg-brand-yellow neo-brutalism-sm text-black">
                <Coins className="w-6 h-6" />
                <span className="font-display font-black text-lg uppercase">
                  Balance: <span className="underline decoration-4">2.5 MON</span>
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

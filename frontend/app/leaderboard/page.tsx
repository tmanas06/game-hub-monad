'use client';

import { Trophy, Crown, Medal, Award, Loader2, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/src/config';

interface LeaderboardEntry {
  address: string;
  totalPoints: number;
  correctGuesses: number;
  totalGuesses: number;
}

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.LEADERBOARD, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
            `Failed to fetch leaderboard: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        if (data.success) {
          setRankings(data.leaderboard || []);
        } else {
          throw new Error(data.error || 'Failed to load leaderboard data');
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();

    // Set up polling to refresh leaderboard every 30 seconds
    const intervalId = setInterval(fetchLeaderboard, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pt-24 pb-12 px-4 overflow-x-hidden relative font-body">
      {/* Background Graphic Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-brand-yellow/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-lime/10 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 relative animate-fadeIn">
          <h1 className="text-6xl md:text-8xl font-display font-black mb-4 uppercase italic tracking-tighter italic">
            HALL OF <span className="text-brand-yellow">FAME</span>
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-1 w-12 bg-brand-coral neo-brutalism-sm"></div>
            <p className="text-xl font-display font-black uppercase italic tracking-tight text-white/70">Top players competing for MON rewards</p>
            <div className="h-1 w-12 bg-brand-skyblue neo-brutalism-sm"></div>
          </div>
        </div>

        {/* Top 3 Podium Cards */}
        {!isLoading && rankings.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
            {/* Rank 2 */}
            <div className="order-2 md:order-1 bg-brand-skyblue p-6 neo-brutalism rotate-[-2deg] text-black">
              <div className="flex flex-col items-center">
                <div className="p-2 bg-black neo-brutalism-sm mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-display font-black uppercase mb-1 opacity-60">RANK 2</span>
                <span className="text-xl font-display font-black uppercase italic mb-3">{formatAddress(rankings[1].address)}</span>
                <div className="bg-black text-white px-4 py-1 neo-brutalism-sm font-display font-black">
                  {rankings[1].totalPoints.toLocaleString()} PTS
                </div>
              </div>
            </div>
            {/* Rank 1 */}
            <div className="order-1 md:order-2 bg-brand-yellow p-8 neo-brutalism scale-105 z-10 text-black">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-black neo-brutalism-sm mb-4">
                  <Crown className="w-10 h-10 text-brand-lime animate-bounce" />
                </div>
                <span className="text-sm font-display font-black uppercase mb-1 opacity-60">CHAMPION</span>
                <span className="text-2xl font-display font-black uppercase italic mb-3">{formatAddress(rankings[0].address)}</span>
                <div className="bg-black text-white px-6 py-2 neo-brutalism-sm font-display font-black text-xl">
                  {rankings[0].totalPoints.toLocaleString()} PTS
                </div>
              </div>
            </div>
            {/* Rank 3 */}
            <div className="order-3 bg-brand-coral p-6 neo-brutalism rotate-[2deg] text-black">
              <div className="flex flex-col items-center">
                <div className="p-2 bg-black neo-brutalism-sm mb-4">
                  <Medal className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-display font-black uppercase mb-1 opacity-60">RANK 3</span>
                <span className="text-xl font-display font-black uppercase italic mb-3">{formatAddress(rankings[2].address)}</span>
                <div className="bg-black text-white px-4 py-1 neo-brutalism-sm font-display font-black">
                  {rankings[2].totalPoints.toLocaleString()} PTS
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table Container */}
        <div className="bg-black p-0 neo-brutalism overflow-hidden border-4 border-black mb-16">
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-4 bg-brand-lime p-4 border-b-4 border-black text-black">
            <div className="font-display font-black uppercase flex items-center gap-2">
              <Award className="w-5 h-5" />
              Rank
            </div>
            <div className="font-display font-black uppercase flex items-center gap-2 col-span-2">
              <Trophy className="w-5 h-5" />
              Player Address
            </div>
            <div className="font-display font-black uppercase text-right">Score</div>
          </div>

          {/* Rankings List */}
          <div className="bg-[#121214]">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-20 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-brand-lime" />
                <span className="font-display font-black uppercase tracking-widest text-white/50">Fetching Elite Data...</span>
              </div>
            ) : error ? (
              <div className="text-center py-20 text-brand-coral px-4">
                <p className="font-display font-black text-2xl uppercase italic mb-6">Critical Error: {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-brand-coral text-black font-display font-black text-lg neo-brutalism hover:bg-white"
                >
                  REBOOT INTERFACE
                </button>
              </div>
            ) : rankings.length === 0 ? (
              <div className="text-center py-20 text-white/40">
                <p className="font-display font-black text-2xl uppercase italic">No legends found yet.</p>
                <p className="font-body font-bold mt-2 uppercase">Be the first to claim the throne!</p>
              </div>
            ) : (
              rankings.map((entry, index) => (
                <div
                  key={entry.address}
                  className={cn(
                    "grid grid-cols-4 gap-4 items-center p-5 border-b-2 border-white/5 transition-all group",
                    index % 2 === 0 ? "bg-white/5" : "bg-transparent",
                    "hover:bg-white hover:text-black"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "w-12 h-12 flex items-center justify-center text-xl font-display font-black neo-brutalism-sm transition-transform group-hover:rotate-6",
                      index === 0 ? "bg-brand-yellow text-black" :
                        index === 1 ? "bg-brand-skyblue text-black" :
                          index === 2 ? "bg-brand-coral text-black" :
                            "bg-black text-white group-hover:bg-brand-lime group-hover:text-black"
                    )}>
                      #{index + 1}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="font-display font-black text-lg uppercase tracking-tight">
                      {formatAddress(entry.address)}
                    </div>
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-black text-brand-lime text-[10px] font-black uppercase tracking-widest neo-brutalism-xs group-hover:bg-white/20">
                      {entry.correctGuesses}/{entry.totalGuesses} HITS
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-black text-2xl italic tracking-tighter group-hover:text-black">
                      {entry.totalPoints.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-black uppercase opacity-50 tracking-widest">POINTS</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Table Footer */}
          <div className="p-6 bg-brand-yellow border-t-4 border-black text-black">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 animate-pulse" />
                <p className="font-display font-black uppercase text-sm tracking-tight italic">
                  MON Rewards are distributed every 24 hours based on top rankings.
                </p>
              </div>
              <div className="px-4 py-2 bg-black text-white font-display font-black text-xs uppercase neo-brutalism-sm animate-pulse">
                Season 1 Active
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

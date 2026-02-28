"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Wallet, Receipt, RefreshCw, ShieldCheck } from "lucide-react";

type Payment = {
  game: string;
  amount: number;
  currency: string;
  status: "success" | "pending" | "failed";
};

type AgentStats = {
  balance: number;
  todaysSpend: number;
  dailyLimit: number;
  currency: string;
  payments: Payment[];
  updatedAt?: number;
};

async function fetchAgentStats(): Promise<AgentStats> {
  const res = await fetch("/api/agent/stats", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch agent stats: ${res.status}`);
  return res.json();
}

export default function AgentDashboardPage() {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastUpdatedLabel = useMemo(() => {
    if (!stats?.updatedAt) return null;
    const d = new Date(stats.updatedAt);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [stats?.updatedAt]);

  const loadStats = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const data = await fetchAgentStats();
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load agent stats");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadStats();
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const formatAmount = (value: number, currency: string) =>
    `${value.toFixed(2)} ${currency}`;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pt-24 pb-12 px-4 overflow-x-hidden relative font-body">
      {/* Background Graphic Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-brand-lime/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-coral/10 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="animate-fadeIn">
            <h1 className="text-6xl md:text-7xl font-display font-black mb-4 uppercase italic tracking-tighter italic">
              AGENT <span className="text-brand-coral">CONTROL</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-1 w-12 bg-brand-lime neo-brutalism-sm"></div>
              <p className="text-xl font-display font-black uppercase italic tracking-tight text-white/70">
                Gasless monitoring / Real-time automation
              </p>
              <div className="px-4 py-1 bg-brand-lime text-black font-display font-black text-xs uppercase neo-brutalism-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                AUTO-PAY ACTIVE
              </div>
            </div>
            {error && (
              <p className="mt-4 text-brand-coral font-display font-black uppercase italic animate-pulse">
                CRITICAL ERROR: {error}
              </p>
            )}
            {lastUpdatedLabel && !error && (
              <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                SYSTEM LAST SYNCED: <span className="text-brand-yellow">{lastUpdatedLabel}</span>
              </p>
            )}
          </div>

          <button
            onClick={loadStats}
            className={cn(
              "p-5 bg-white text-black font-display font-black uppercase text-xl neo-brutalism hover:bg-brand-lime transition-all active:translate-y-1 flex items-center gap-3",
              isRefreshing && "opacity-70 cursor-wait bg-brand-yellow"
            )}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-6 w-6", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? "SYNCING..." : "RELOAD ENGINE"}</span>
          </button>
        </div>

        {/* Status Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-brand-purple p-8 neo-brutalism rotate-[-1deg] text-black group hover:bg-white transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-black text-white neo-brutalism-sm">
                <Wallet className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">BALANCE</span>
            </div>
            <div className="text-4xl font-display font-black mb-2 uppercase italic tracking-tighter">
              {stats ? formatAmount(stats.balance, stats.currency) : (isLoading ? "LOADING..." : "--")}
            </div>
            <p className="text-xs font-bold uppercase tracking-tight leading-tight opacity-70">
              AVAILABLE GAS SPONSORSHIP FUNDS
            </p>
          </div>

          <div className="bg-brand-yellow p-8 neo-brutalism rotate-[1deg] text-black group hover:bg-white transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-black text-white neo-brutalism-sm">
                <Receipt className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">SPEND (24H)</span>
            </div>
            <div className="text-4xl font-display font-black mb-2 uppercase italic tracking-tighter">
              {stats ? formatAmount(stats.todaysSpend, stats.currency) : (isLoading ? "LOADING..." : "--")}
            </div>
            <p className="text-xs font-bold uppercase tracking-tight leading-tight opacity-70">
              TOTAL SPONSORED GAS TRANSACTIONS
            </p>
          </div>

          <div className="bg-brand-lime p-8 neo-brutalism rotate-[-1deg] text-black group hover:bg-white transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-black text-white neo-brutalism-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">DAILY CEILING</span>
            </div>
            <div className="text-4xl font-display font-black mb-2 uppercase italic tracking-tighter">
              {stats ? formatAmount(stats.dailyLimit, stats.currency) : (isLoading ? "LOADING..." : "--")}
            </div>
            <p className="text-xs font-bold uppercase tracking-tight leading-tight opacity-70">
              MAXIMUM AUTOMATED DAILY ALLOWANCE
            </p>
          </div>
        </div>

        {/* History Table - Neo Brutalist List */}
        <div className="bg-black p-0 neo-brutalism overflow-hidden border-4 border-black mb-16 shadow-[20px_20px_0_0_rgba(255,255,255,0.05)]">
          <div className="bg-white p-6 border-b-4 border-black flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-display font-black text-black uppercase italic tracking-tighter">
                PAYMENT <span className="text-brand-coral">LOGS</span>
              </h2>
              <p className="text-xs font-black uppercase tracking-widest text-black/50 mt-1">Real-time settlement data</p>
            </div>
            <div className="px-4 py-2 bg-black text-brand-lime font-display font-black text-xs uppercase neo-brutalism-xs">
              LIVE STREAM
            </div>
          </div>

          <div className="bg-[#121214] p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
            {isLoading && !stats ? (
              <div className="flex flex-col items-center py-20 gap-4">
                <RefreshCw className="w-12 h-12 animate-spin text-brand-lime" />
                <span className="font-display font-black uppercase tracking-widest text-white/40">Initializing Records...</span>
              </div>
            ) : !stats || stats.payments.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-display font-black text-2xl uppercase italic text-white/60">NO TRANSACTIONS DETECTED</p>
                <p className="font-body font-bold text-white/30 uppercase mt-2">Waiting for player activity...</p>
              </div>
            ) : (
              stats.payments.map((payment, idx) => (
                <div
                  key={`${payment.game}-${idx}`}
                  className="flex items-center justify-between p-4 border-2 border-white/5 bg-white/5 hover:bg-brand-coral hover:text-black transition-all group neo-brutalism-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black flex items-center justify-center neo-brutalism-sm-black transition-transform group-hover:rotate-6">
                      <span className="font-display font-black text-brand-yellow text-xl">
                        {payment.game[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-display font-black text-lg uppercase tracking-tight group-hover:text-black">
                        {payment.game}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-50 group-hover:opacity-100 italic">
                        SETTLED: {formatAmount(payment.amount, payment.currency)}
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 neo-brutalism-sm font-display font-black text-xs uppercase transition-colors",
                    payment.status === "success" ? "bg-brand-lime text-black" :
                      payment.status === "pending" ? "bg-brand-yellow text-black" :
                        "bg-brand-coral text-white"
                  )}>
                    {payment.status === "success" ? "VERIFIED" :
                      payment.status === "pending" ? "PROCESSING" : "FAILED"}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-brand-coral p-4 border-t-4 border-black text-black text-center">
            <p className="font-display font-black uppercase italic tracking-tight text-sm">
              🛡️ All transactions are audited by the Sentinad AI Node for security and compliance.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
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

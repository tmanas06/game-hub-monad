'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowUp, ArrowDown, Loader2, RotateCcw, TrendingUp, TrendingDown, Zap, AlertCircle, Sparkles, Trophy } from 'lucide-react'
import { getSigner } from '@/lib/viem'
import { loadKey } from '@/lib/keyCache'

interface CryptoPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap_change_percentage_24h: number
}

interface GuessResult {
  isCorrect: boolean
  startPrice: number
  endPrice: number
  userGuess: string
  actualDirection: string
  pointsEarned: number
}

export default function GuessTheMarket() {
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([])
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoPrice | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [userGuess, setUserGuess] = useState<'up' | 'down' | null>(null)
  const [isGuessing, setIsGuessing] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [result, setResult] = useState<GuessResult | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)
  const [userAddress, setUserAddress] = useState<`0x${string}` | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guessHistory, setGuessHistory] = useState<GuessResult[]>([])

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001'))
  const countdownInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const initializeGame = async () => {
      try {
        const cachedKey = loadKey()
        if (cachedKey) {
          const signer = getSigner()
          if (signer?.account?.address) setUserAddress(signer.account.address)
        }
        const response = await fetch(`${API_URL}/api/market/cryptos`)
        const data = await response.json()
        if (data.success && data.cryptos) {
          setCryptos(data.cryptos)
          if (data.cryptos.length > 0) {
            setSelectedCrypto(data.cryptos[0]);
            setCurrentPrice(data.cryptos[0].current_price);
          }
        }
      } catch (err) {
        setError('Failed to load game data')
      } finally { setIsIdle(false); setIsLoading(false); }
    }
    initializeGame()
  }, [])

  const [isIdle, setIsIdle] = useState(true);

  const handleSelectCrypto = async (crypto: CryptoPrice) => {
    setSelectedCrypto(crypto)
    setCurrentPrice(crypto.current_price)
    setUserGuess(null)
    setResult(null)
    try {
      const response = await fetch(`${API_URL}/api/market/price/${crypto.id}`)
      const data = await response.json()
      if (data.success) {
        setCurrentPrice(data.current_price)
        setSelectedCrypto({ ...crypto, current_price: data.current_price })
      }
    } catch (err) { }
  }

  const handleSubmitGuess = async (guess: 'up' | 'down') => {
    if (!selectedCrypto || !currentPrice || !userAddress) return
    try {
      setIsGuessing(true)
      setUserGuess(guess)
      setCountdown(10)
      setError(null)
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => prev > 0 ? prev - 1 : 0)
      }, 1000)

      const response = await fetch(`${API_URL}/api/market/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress, crypto: selectedCrypto.id, startPrice: currentPrice, guess, duration: 10 }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Failed to submit guess')

      setTimeout(async () => {
        try {
          const pr = await fetch(`${API_URL}/api/market/price/${selectedCrypto.id}`)
          const pd = await pr.json()
          if (pd.success) {
            const ep = pd.current_price
            const ad = ep > currentPrice ? 'up' : ep < currentPrice ? 'down' : 'same'
            const correct = (guess === 'up' && ad === 'up') || (guess === 'down' && ad === 'down')
            const pts = correct ? 10 : -10
            const res: GuessResult = { isCorrect: correct, startPrice: currentPrice, endPrice: ep, userGuess: guess, actualDirection: ad, pointsEarned: pts }
            setResult(res); setTotalPoints(p => p + pts); setGuessHistory(h => [res, ...h]);
            if (countdownInterval.current) clearInterval(countdownInterval.current)
            setCountdown(0);
          }
        } catch (err) { } finally { setIsGuessing(false); }
      }, 10000)
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); setIsGuessing(false); }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCrypto || isGuessing || result || !userAddress) return;

      const key = e.key.toUpperCase();
      const guessKeys = ['W', 'S', 'ARROWUP', 'ARROWDOWN'];

      if (guessKeys.includes(key)) {
        e.preventDefault();
        if (key === 'W' || key === 'ARROWUP') handleSubmitGuess('up');
        if (key === 'S' || key === 'ARROWDOWN') handleSubmitGuess('down');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCrypto, isGuessing, result, userAddress, currentPrice]);

  if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-12 h-12 animate-spin text-brand-lime" /></div>

  return (
    <div className="w-full max-w-6xl mx-auto font-display overflow-x-hidden">
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 animate-fadeIn">
        <div className="text-left w-full md:w-auto">
          <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter italic">GUESS <span className="text-brand-coral">MARKET</span></h1>
          <p className="text-white/60 font-black uppercase tracking-widest text-xs mt-2 italic px-1">PREDICT THE NEXT BULL/BEAR CANDLE</p>
        </div>
        <div className="bg-brand-lime border-4 border-black px-8 py-3 neo-brutalism font-black text-black text-3xl italic tracking-tighter shadow-[8px_8px_0_0_#000]">
          POOL: {totalPoints} PTS
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 mb-16">
        {/* Market Selection Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border-4 border-black neo-brutalism-sm p-4 rotate-[-1deg]">
            <h3 className="font-black text-black uppercase text-xl mb-4 italic flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> MARKETS
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {cryptos.map((crypto) => (
                <button
                  key={crypto.id}
                  onClick={() => handleSelectCrypto(crypto)}
                  className={`w-full p-4 border-4 border-black flex items-center justify-between transition-all active:translate-y-1 ${selectedCrypto?.id === crypto.id ? 'bg-brand-purple text-white' : 'bg-white text-black hover:bg-brand-yellow'
                    }`}
                >
                  <div className="text-left">
                    <div className="font-black uppercase italic tracking-tighter">{crypto.symbol}</div>
                    <div className="text-[10px] font-bold opacity-70">${crypto.current_price.toFixed(2)}</div>
                  </div>
                  <div className={`font-black text-xs ${crypto.market_cap_change_percentage_24h >= 0 ? 'text-brand-lime' : 'text-brand-coral'}`}>
                    {crypto.market_cap_change_percentage_24h > 0 ? '+' : ''}{crypto.market_cap_change_percentage_24h.toFixed(1)}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prediction Engine Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-black border-4 border-black neo-brutalism p-8 relative overflow-hidden shadow-[16px_16px_0_0_rgba(255,255,255,0.05)]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="h-40 w-40 text-white" />
            </div>

            {isGuessing ? (
              <div className="text-center py-10 animate-pulse">
                <div className="text-8xl font-black text-brand-yellow italic tracking-tighter mb-4">{countdown}S</div>
                <p className="text-white font-black uppercase text-2xl mb-8 tracking-tighter italic">WAITING FOR PRICE SETTLEMENT...</p>
                <div className="bg-white/10 p-6 border-4 border-white/20 neo-brutalism-sm">
                  <p className="text-white/50 text-xs font-black uppercase mb-2">TARGET ASSET: {selectedCrypto?.name}</p>
                  <div className="text-4xl font-black text-white italic tracking-tighter">${currentPrice?.toFixed(2)}</div>
                </div>
              </div>
            ) : result ? (
              <div className="text-center">
                <div className={`px-6 py-2 border-4 border-black mb-6 inline-block neo-brutalism rotate-[-2deg] ${result.isCorrect ? 'bg-brand-lime text-black' : 'bg-brand-coral text-white'}`}>
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">{result.isCorrect ? 'PROPHET DETECTED' : 'LIQUIDATED'}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white p-4 border-4 border-black neo-brutalism-sm text-black">
                    <p className="text-[10px] font-black opacity-50 uppercase">START</p>
                    <p className="text-2xl font-black italic tracking-tighter">${result.startPrice.toFixed(2)}</p>
                  </div>
                  <div className="bg-black p-4 border-4 border-white neo-brutalism-sm text-white">
                    <p className="text-[10px] font-black opacity-50 uppercase">END</p>
                    <p className="text-2xl font-black italic tracking-tighter">${result.endPrice.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 mb-8 bg-brand-yellow/10 p-4 border-4 border-brand-yellow/30">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase mb-1">YOUR GUESS</span>
                    <div className={`p-4 border-4 border-black ${result.userGuess === 'up' ? 'bg-brand-lime' : 'bg-brand-coral'}`}>
                      {result.userGuess === 'up' ? <ArrowUp className="w-8 h-8 text-black" /> : <ArrowDown className="w-8 h-8 text-black" />}
                    </div>
                  </div>
                  <div className="font-black text-2xl text-white italic tracking-tighter">VS</div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase mb-1">MARKET</span>
                    <div className={`p-4 border-4 border-black ${result.actualDirection === 'up' ? 'bg-brand-lime' : 'bg-brand-coral'}`}>
                      {result.actualDirection === 'up' ? <ArrowUp className="w-8 h-8 text-black" /> : <ArrowDown className="w-8 h-8 text-black" />}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setResult(null)} className="flex-1 py-5 bg-brand-purple text-white font-black uppercase text-2xl neo-brutalism hover:bg-white hover:text-black transition-all">TRY AGAIN</button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-8">
                  <p className="text-white/40 font-black uppercase text-xs mb-2 tracking-widest">SELECTED INSTRUMENT</p>
                  <h2 className="text-7xl font-black text-white italic uppercase tracking-tighter mb-2">{selectedCrypto?.name}</h2>
                  <div className="text-3xl font-black text-brand-lime italic tracking-tighter">${currentPrice?.toFixed(2)}</div>
                </div>

                <div className="bg-brand-yellow p-6 border-4 border-black neo-brutalism rotate-[1deg] mb-10 text-black">
                  <p className="font-black uppercase text-xl italic tracking-tighter leading-tight">
                    PREDICT {selectedCrypto?.symbol} DIRECTION OVER THE NEXT 10 SECONDS
                  </p>
                  <p className="text-[10px] font-bold uppercase mt-2 opacity-70 italic">+10 PTS FOR CORRECT • -10 PTS FOR WRONG</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => handleSubmitGuess('up')}
                    className="p-8 bg-brand-lime border-4 border-black neo-brutalism hover:-translate-y-2 transition-transform flex flex-col items-center gap-3 active:translate-y-0"
                  >
                    <ArrowUp className="h-12 w-12 text-black" />
                    <span className="font-black text-black text-2xl italic tracking-tighter">PUMP</span>
                  </button>
                  <button
                    onClick={() => handleSubmitGuess('down')}
                    className="p-8 bg-brand-coral border-4 border-black neo-brutalism hover:-translate-y-2 transition-transform flex flex-col items-center gap-3 active:translate-y-0"
                  >
                    <ArrowDown className="h-12 w-12 text-black" />
                    <span className="font-black text-black text-2xl italic tracking-tighter">DUMP</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History / Recent Activity */}
          <div className="bg-brand-skyblue p-6 border-4 border-black neo-brutalism-sm rotate-[-0.5deg]">
            <h3 className="font-black text-black uppercase text-xl mb-4 italic flex items-center gap-2">
              <Trophy className="h-5 w-5" /> RECENT SIGNALS
            </h3>
            <div className="space-y-2">
              {guessHistory.length === 0 ? (
                <div className="text-black/40 font-black uppercase text-xs italic py-4 text-center">NO DATA DETECTED IN FEED</div>
              ) : (
                guessHistory.slice(0, 3).map((h, i) => (
                  <div key={i} className="bg-white/50 border-2 border-black p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`p-1 border-2 border-black ${h.isCorrect ? 'bg-brand-lime' : 'bg-brand-coral'}`}>
                        {h.userGuess === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      </div>
                      <span className="font-black uppercase text-xs italic tracking-tighter">PREDICTION {h.isCorrect ? 'VERIFIED' : 'FAILED'}</span>
                    </div>
                    <span className={`font-black italic ${h.pointsEarned > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {h.pointsEarned > 0 ? '+' : ''}{h.pointsEarned}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; border: 2px solid white; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
      `}</style>
    </div>
  )
}

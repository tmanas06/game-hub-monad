"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Play, Pause, RotateCcw, Zap, Target, Clock, Coins, Wallet, Loader2, ShieldCheck, Trophy } from "lucide-react"
import { getSigner, publicClient, CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/viem"
import { loadKey } from "@/lib/keyCache"

const BUBBLE_COLORS = ["#A1FF00", "#FF6B6B", "#4ECDC4", "#FFD700", "#DDA0DD", "#00FFFF"];
const GAME_DURATION = 60; // seconds for time attack

interface Bubble {
  id: string
  x: number
  y: number
  size: number
  color: string
  speed: number
  type: "normal" | "bonus" | "bomb" | "powerup"
  powerUpType?: "freeze"
  points: number
}

interface GameState {
  bubbles: Bubble[]
  score: number
  lives: number
  timeLeft: number
  isPlaying: boolean
  isPaused: boolean
  gameMode: "classic" | "timeAttack" | "survival"
  level: number
  hasStarted?: boolean
  hasClaimedReward?: boolean
}

export default function MonadGamingDApp() {
  const [currentView, setCurrentView] = useState<"menu" | "game">("menu")
  const [gameState, setGameState] = useState<GameState>({
    bubbles: [],
    score: 0,
    lives: 3,
    timeLeft: GAME_DURATION,
    isPlaying: false,
    isPaused: false,
    gameMode: "classic",
    level: 1,
    hasClaimedReward: false
  })

  const [rewardAmount, setRewardAmount] = useState<number | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [freePlaysRemaining, setFreePlaysRemaining] = useState<number | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [userAddress, setUserAddress] = useState<`0x${string}` | null>(null)
  const [initialGameMode, setInitialGameMode] = useState<GameState["gameMode"] | null>(null)
  const [initialLives, setInitialLives] = useState<number>(3)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null)

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:5001'
      : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001'))

  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const bubbleSpawnRef = useRef<NodeJS.Timeout | null>(null)
  const gameIdRef = useRef<string>('')
  const comboRef = useRef({ lastTap: 0, streak: 0 })
  const paymentPollRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize User
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const cachedKey = loadKey();
        if (cachedKey) {
          const signer = getSigner();
          if (signer?.account?.address) {
            setUserAddress(signer.account.address);
            try {
              const hasClaimed = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'hasClaimed',
                args: [signer.account.address]
              });
              setGameState(prev => ({ ...prev, hasClaimedReward: hasClaimed as boolean }))
            } catch (error) {
              console.error('Error checking claim status:', error)
            }
          }
        }
      } catch (error) { }
    }
    initializeUser()
  }, [])

  // Payment check logic
  const checkPaymentStatus = useCallback(async (address: string) => {
    try {
      const response = await fetch(`${API_URL}/api/play?address=${encodeURIComponent(address)}`)
      if (response.status === 402) {
        const data = await response.json()
        return { allowed: false, requiresPayment: true, invoice: data.invoice }
      }
      if (!response.ok) throw new Error("Server error")
      const data = await response.json()
      return { allowed: data.allowed, isPremium: data.isPremium, freePlayRemaining: data.freePlayRemaining }
    } catch (error) {
      return { allowed: true, isPremium: false, freePlayRemaining: 3 }
    }
  }, [API_URL])

  const cleanupIntervals = useCallback(() => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    if (bubbleSpawnRef.current) clearInterval(bubbleSpawnRef.current)
    if (paymentPollRef.current) clearInterval(paymentPollRef.current)
    gameLoopRef.current = null
    bubbleSpawnRef.current = null
    paymentPollRef.current = null
  }, [])

  const startGameInternal = useCallback((mode: GameState["gameMode"]) => {
    cleanupIntervals()
    gameIdRef.current = crypto.randomUUID()
    const livesCount = mode === "classic" ? 3 : mode === "survival" ? 3 : 999
    setInitialGameMode(mode)
    setInitialLives(livesCount)
    setGameState({
      bubbles: [],
      score: 0,
      lives: livesCount,
      timeLeft: mode === "timeAttack" ? GAME_DURATION : 999,
      isPlaying: true,
      isPaused: false,
      gameMode: mode,
      level: 1,
      hasStarted: false,
      hasClaimedReward: false
    })
    setCurrentView("game")
  }, [cleanupIntervals])

  const startGame = useCallback(async (mode: GameState["gameMode"]) => {
    if (mode !== "classic") {
      startGameInternal(mode)
      return
    }
    if (!userAddress) {
      setPaymentError("CONNECT WALLET TO PLAY NORMAL MODE")
      return
    }
    setIsCheckingPayment(true)
    const status = await checkPaymentStatus(userAddress)
    setIsCheckingPayment(false)
    if (status.allowed) {
      setIsPremium(!!status.isPremium)
      setFreePlaysRemaining(status.freePlayRemaining ?? null)
      startGameInternal(mode)
    } else if (status.requiresPayment) {
      setPaymentInvoice(status.invoice)
      setShowPaymentModal(true)
    }
  }, [userAddress, checkPaymentStatus, startGameInternal])

  const createBubble = useCallback((): Bubble => {
    const rect = gameAreaRef.current?.getBoundingClientRect()
    if (!rect) return { id: Math.random().toString(), x: 0, y: 0, size: 30, color: "#FFF", speed: 1, type: "normal", points: 1 }

    const size = Math.max(30, 60 - Math.floor(gameState.score / 50) * 4)
    const x = Math.random() * (rect.width - size)
    const y = rect.height
    const rand = Math.random()
    let type: Bubble["type"] = "normal"
    let color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
    let points = 10

    if (rand < 0.1) { type = "bomb"; color = "#000"; points = -20 }
    else if (rand < 0.2) { type = "bonus"; color = "#FFD700"; points = 50 }

    return {
      id: Math.random().toString(36).substr(2, 9),
      x, y, size, color, type, points,
      speed: 2 + Math.random() * 2 + (gameState.score / 200)
    }
  }, [gameState.score])

  const popBubble = useCallback((id: string) => {
    setGameState(prev => {
      const bubble = prev.bubbles.find(b => b.id === id)
      if (!bubble) return prev
      const isBomb = bubble.type === "bomb"
      const newLives = isBomb ? prev.lives - 1 : prev.lives
      if (newLives <= 0) {
        setTimeout(() => cleanupIntervals(), 0)
        return { ...prev, isPlaying: false, lives: 0 }
      }
      return {
        ...prev,
        bubbles: prev.bubbles.filter(b => b.id !== id),
        score: Math.max(0, prev.score + bubble.points),
        lives: newLives
      }
    })
  }, [cleanupIntervals])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT'].includes(e.key.toUpperCase())) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return
    gameLoopRef.current = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        bubbles: prev.bubbles
          .map(b => ({ ...b, y: b.y - b.speed }))
          .filter(b => {
            if (b.y + b.size < 0) {
              if (prev.gameMode === "survival" && b.type !== "bomb") {
                // Missed a bubble in survival
              }
              return false
            }
            return true
          })
      }))
    }, 30)
    bubbleSpawnRef.current = setInterval(() => {
      setGameState(prev => ({ ...prev, bubbles: [...prev.bubbles, createBubble()] }))
    }, Math.max(400, 1000 - (gameState.score / 2)))
    return () => cleanupIntervals()
  }, [gameState.isPlaying, gameState.isPaused, createBubble, cleanupIntervals, gameState.score])

  return (
    <div className="w-full max-w-5xl mx-auto font-body">
      {currentView === "menu" ? (
        <div className="animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Classic Mode Card */}
            <div className="bg-brand-purple p-6 neo-brutalism rotate-[-1deg] hover:rotate-0 transition-transform group">
              <div className="p-3 bg-black text-white neo-brutalism-sm w-fit mb-4">
                <Trophy className="h-8 w-8 text-brand-lime" />
              </div>
              <h3 className="text-2xl font-display font-black text-black uppercase mb-2">NORMAL MODE</h3>
              <p className="text-black font-bold text-sm uppercase mb-6 opacity-70">
                3 LIVES • REWARDS ENABLED<br />100 PTS = 1 MON
              </p>
              <button
                onClick={() => startGame("classic")}
                disabled={isCheckingPayment}
                className="w-full py-4 bg-black text-white font-display font-black uppercase text-xl neo-brutalism-sm hover:bg-white hover:text-black transition-colors"
              >
                {isCheckingPayment ? "SYNCING..." : "DEPLOY"}
              </button>
            </div>

            {/* Time Attack Card */}
            <div className="bg-brand-yellow p-6 neo-brutalism rotate-[1deg] hover:rotate-0 transition-transform group">
              <div className="p-3 bg-black text-white neo-brutalism-sm w-fit mb-4">
                <Clock className="h-8 w-8 text-brand-coral" />
              </div>
              <h3 className="text-2xl font-display font-black text-black uppercase mb-2">TIME ATTACK</h3>
              <p className="text-black font-bold text-sm uppercase mb-6 opacity-70">
                60 SECONDS • NO LIVES<br />PURE SPEED TEST
              </p>
              <button
                onClick={() => startGame("timeAttack")}
                className="w-full py-4 bg-black text-white font-display font-black uppercase text-xl neo-brutalism-sm hover:bg-white hover:text-black transition-colors"
              >
                START RACE
              </button>
            </div>

            {/* Survival Card */}
            <div className="bg-brand-lime p-6 neo-brutalism rotate-[-2deg] hover:rotate-0 transition-transform group">
              <div className="p-3 bg-black text-white neo-brutalism-sm w-fit mb-4">
                <ShieldCheck className="h-8 w-8 text-brand-purple" />
              </div>
              <h3 className="text-2xl font-display font-black text-black uppercase mb-2">SURVIVAL</h3>
              <p className="text-black font-bold text-sm uppercase mb-6 opacity-70">
                ENDLESS BOMBS • 3 LIVES<br />DON'T EXPLODE
              </p>
              <button
                onClick={() => startGame("survival")}
                className="w-full py-4 bg-black text-white font-display font-black uppercase text-xl neo-brutalism-sm hover:bg-white hover:text-black transition-colors"
              >
                SURVIVE
              </button>
            </div>
          </div>

          {paymentError && (
            <div className="mt-8 p-4 bg-brand-coral text-white font-display font-black uppercase text-center neo-brutalism animate-pulse">
              {paymentError}
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Game Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-brand-lime px-6 py-2 neo-brutalism border-4 border-black text-black font-display font-black text-2xl italic tracking-tighter">
                SCORE: {gameState.score}
              </div>
              {gameState.gameMode !== "timeAttack" && (
                <div className="bg-brand-coral px-6 py-2 neo-brutalism border-4 border-black text-white font-display font-black text-2xl italic tracking-tighter">
                  LIVES: {gameState.lives}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
                className="p-3 bg-white text-black neo-brutalism-sm hover:bg-brand-yellow transition-colors"
              >
                {gameState.isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
              </button>
              <button
                onClick={startGameInternal.bind(null, gameState.gameMode)}
                className="p-3 bg-white text-black neo-brutalism-sm hover:bg-brand-coral transition-colors"
              >
                <RotateCcw className="h-6 w-6" />
              </button>
              <button
                onClick={() => setCurrentView("menu")}
                className="px-6 py-2 bg-black text-white font-display font-black uppercase text-sm neo-brutalism-sm hover:bg-white hover:text-black transition-colors"
              >
                EXIT
              </button>
            </div>
          </div>

          {/* Game Area */}
          <div
            ref={gameAreaRef}
            className="relative w-full h-[500px] bg-[#0A0A0B] border-8 border-black overflow-hidden neo-brutalism shadow-[20px_20px_0_0_rgba(255,255,255,0.05)] cursor-crosshair"
          >
            {gameState.bubbles.map(bubble => (
              <button
                key={bubble.id}
                onClick={() => popBubble(bubble.id)}
                className="absolute flex items-center justify-center transition-transform active:scale-90"
                style={{
                  left: bubble.x,
                  top: bubble.y,
                  width: bubble.size,
                  height: bubble.size,
                  backgroundColor: bubble.color,
                  border: '4px solid black',
                  borderRadius: bubble.type === "bomb" ? '4px' : '9999px',
                  boxShadow: '4px 4px 0 0 rgba(0,0,0,1)',
                  zIndex: 10
                }}
              >
                {bubble.type === "bomb" && <Zap className="h-6 w-6 text-white" />}
                {bubble.type === "bonus" && <Target className="h-6 w-6 text-black" />}
              </button>
            ))}

            {(!gameState.isPlaying || gameState.isPaused) && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                <div className="bg-white p-8 neo-brutalism max-w-md w-full text-center border-8 border-black rotate-[-1deg]">
                  {!gameState.isPlaying ? (
                    <>
                      <h2 className="text-5xl font-display font-black text-black uppercase mb-2 italic tracking-tighter">GAME OVER</h2>
                      <div className="text-6xl font-display font-black text-brand-purple mb-8 italic tracking-tighter">
                        {gameState.score} PTS
                      </div>
                      <div className="space-y-4">
                        <button
                          onClick={() => startGameInternal(gameState.gameMode)}
                          className="w-full py-4 bg-brand-lime text-black font-display font-black uppercase text-xl neo-brutalism hover:bg-black hover:text-white transition-all transform hover:-translate-y-1"
                        >
                          RETRY MISSION
                        </button>
                        <button
                          onClick={() => setCurrentView("menu")}
                          className="w-full py-4 bg-white text-black font-display font-black uppercase text-xl neo-brutalism hover:bg-black hover:text-white transition-all border-4 border-black"
                        >
                          BACK TO MENU
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-5xl font-display font-black text-black uppercase mb-8 italic tracking-tighter">PAUSED</h2>
                      <button
                        onClick={() => setGameState(prev => ({ ...prev, isPaused: false }))}
                        className="w-full py-4 bg-brand-yellow text-black font-display font-black uppercase text-xl neo-brutalism hover:bg-black hover:text-white transition-all transform hover:-translate-y-1"
                      >
                        RESUME ACTION
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}

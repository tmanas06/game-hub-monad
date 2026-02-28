'use client'

import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { getSigner } from '@/lib/viem'
import { ArrowLeft, ArrowRight, RotateCcw, Play, Pause, Wallet, Coins, Loader2, Zap, ShieldCheck, Heart } from 'lucide-react'
import { loadKey } from '@/lib/keyCache'
import { v4 as uuidv4 } from 'uuid'

type ObjectType = 'coin' | 'bomb' | 'freeze'

interface FallingObject {
  id: string
  x: number
  y: number
  speed: number
  type: ObjectType
}

interface GameState {
  score: number
  lives: number
  isPlaying: boolean
  isPaused: boolean
  hasStarted: boolean
  objects: FallingObject[]
  freezeActive: boolean
  gameOver: boolean
  gameWon: boolean
  level: number
}

const CryptoDodger = () => {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    score: 0,
    lives: 3,
    level: 1,
    objects: [],
    freezeActive: false,
    gameOver: false,
    gameWon: false,
    hasStarted: false
  })

  const [playerX, setPlayerX] = useState(150)
  const [userAddress, setUserAddress] = useState<`0x${string}` | null>(null)
  const [rewardAmount, setRewardAmount] = useState<number | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [hasClaimedReward, setHasClaimedReward] = useState(false)
  const [rewardError, setRewardError] = useState<string | null>(null)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameIdRef = useRef<string>('')
  const playerSize = 50
  const [gameWidth, setGameWidth] = useState(400)
  const [gameHeight, setGameHeight] = useState(500)
  const moveStep = 30

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001'))

  const animationRef = useRef<number>()
  const lastObjectTimeRef = useRef<number>(0)

  useEffect(() => {
    gameIdRef.current = crypto.randomUUID()
    const cachedKey = loadKey();
    if (cachedKey) {
      const signer = getSigner();
      if (signer?.account?.address) setUserAddress(signer.account.address);
    }
  }, []);

  const spawnObject = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused) return
    const type: ObjectType = Math.random() < 0.1 ? 'freeze' : Math.random() < 0.7 ? 'coin' : 'bomb'
    const obj: FallingObject = {
      id: uuidv4(),
      x: Math.random() * (gameWidth - 40),
      y: -50,
      speed: type === 'freeze' ? 2 : 4 + Math.random() * 3 + (gameState.score / 200),
      type,
    }
    setGameState(prev => ({ ...prev, objects: [...prev.objects, obj] }))
  }, [gameState.isPlaying, gameState.isPaused, gameWidth, gameState.score])

  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused) return
    const now = Date.now()
    if (now - lastObjectTimeRef.current > 800) {
      spawnObject();
      lastObjectTimeRef.current = now;
    }

    setGameState(prev => {
      const newObjects = prev.objects
        .map(obj => ({ ...obj, y: obj.y + (prev.freezeActive ? obj.speed * 0.4 : obj.speed) }))
        .filter(obj => obj.y < gameHeight)

      let score = prev.score
      let lives = prev.lives
      let freezeActive = prev.freezeActive
      const playerRect = { x: playerX, y: gameHeight - playerSize - 20, width: playerSize, height: playerSize }

      const filteredObjects = newObjects.filter(obj => {
        const objRect = { x: obj.x, y: obj.y, width: 40, height: 40 }
        if (playerRect.x < objRect.x + objRect.width && playerRect.x + playerRect.width > objRect.x &&
          playerRect.y < objRect.y + objRect.height && playerRect.y + playerRect.height > objRect.y) {
          if (obj.type === 'coin') score += 10
          else if (obj.type === 'bomb') lives--
          else if (obj.type === 'freeze') {
            freezeActive = true
            setTimeout(() => setGameState(cs => ({ ...cs, freezeActive: false })), 5000)
          }
          return false
        }
        return true
      })

      if (lives <= 0) return { ...prev, isPlaying: false, lives: 0, score, objects: [], gameOver: true }
      return { ...prev, objects: filteredObjects, score, lives, freezeActive }
    })
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState.isPlaying, gameState.isPaused, playerX, spawnObject, gameHeight])

  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) gameLoop()
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [gameState.isPlaying, gameState.isPaused, gameLoop])

  const startGame = useCallback(() => {
    setGameState({ score: 0, lives: 3, isPlaying: true, isPaused: false, hasStarted: true, objects: [], freezeActive: false, gameOver: false, gameWon: false, level: 1 })
    setPlayerX(gameWidth / 2 - playerSize / 2)
    lastObjectTimeRef.current = Date.now()
    setHasClaimedReward(false)
  }, [gameWidth])

  const claimReward = async () => {
    if (!userAddress || gameState.score < 100) return;
    try {
      setIsClaiming(true);
      await fetch(`${API_URL}/api/claim-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress, score: gameState.score, gameMode: 'crypto' })
      });
      setHasClaimedReward(true);
    } catch (e) { setRewardError("CLAIM FAILED"); } finally { setIsClaiming(false); }
  };

  return (
    <div className="w-full flex flex-col items-center font-display">
      {/* Stats Bar */}
      <div className="w-full max-w-lg flex justify-between gap-4 mb-6">
        <div className="bg-brand-purple text-black border-4 border-black px-6 py-2 neo-brutalism font-black italic text-2xl tracking-tighter shadow-[8px_8px_0_0_#000]">
          COINS: {gameState.score}
        </div>
        <div className="bg-brand-coral text-white border-4 border-black px-6 py-2 neo-brutalism font-black italic text-2xl tracking-tighter shadow-[8px_8px_0_0_#000] flex items-center gap-2">
          {gameState.lives} <Heart className="h-6 w-6 fill-white" />
        </div>
      </div>

      <div ref={gameAreaRef} className="relative w-full max-w-[400px] h-[550px] border-8 border-black bg-[#0A0A0B] neo-brutalism overflow-hidden shadow-[20px_20px_0_0_rgba(255,255,255,0.05)]">
        {/* Playable Area Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Player - Neo Brutalist Character */}
        <div
          className="absolute bg-brand-lime border-4 border-black transition-all duration-100 flex items-center justify-center z-10 shadow-[4px_4px_0_0_#000]"
          style={{ width: playerSize, height: playerSize, bottom: 20, left: playerX }}
        >
          <Zap className="h-8 w-8 text-black" />
        </div>

        {/* Falling Objects */}
        {gameState.objects.map(obj => (
          <div
            key={obj.id}
            className="absolute border-4 border-black flex items-center justify-center font-black text-xl shadow-[4px_4px_0_0_#000] z-20"
            style={{
              width: 40, height: 40, left: obj.x, top: obj.y,
              backgroundColor: obj.type === 'coin' ? '#FFD700' : obj.type === 'bomb' ? '#000' : '#00FFFF',
              color: obj.type === 'bomb' ? '#FFF' : '#000',
              borderRadius: obj.type === 'freeze' ? '999px' : '4px'
            }}
          >
            {obj.type === 'coin' && '$'}
            {obj.type === 'bomb' && '×'}
            {obj.type === 'freeze' && '❄'}
          </div>
        ))}

        {(!gameState.isPlaying || gameState.gameOver) && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white border-8 border-black p-8 neo-brutalism rotate-[1deg] text-center w-full shadow-[12px_12px_0_0_#000]">
              {gameState.gameOver ? (
                <>
                  <h2 className="text-5xl font-black text-black uppercase mb-2 italic tracking-tighter">REKT</h2>
                  <p className="text-3xl font-black text-brand-purple mb-8 italic tracking-tighter">{gameState.score} COINS</p>

                  {gameState.score >= 100 && (
                    <div className="bg-brand-yellow p-4 border-4 border-black mb-6 rotate-[-2deg] neo-brutalism-sm">
                      <p className="text-black font-black uppercase text-xl italic tracking-tighter">CLAIM {Math.floor(gameState.score / 100)} MON</p>
                      <button
                        onClick={claimReward}
                        disabled={isClaiming || hasClaimedReward}
                        className="w-full mt-2 py-3 bg-black text-white font-black uppercase neo-brutalism-sm hover:bg-brand-lime hover:text-black transition-colors"
                      >
                        {isClaiming ? "SYNCING..." : hasClaimedReward ? "CLAIMED ✓" : "TRANSFER NOW"}
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    <button onClick={startGame} className="w-full py-4 bg-brand-lime text-black font-black uppercase text-2xl neo-brutalism hover:bg-black hover:text-white transition-all transform hover:-translate-y-1">RESPAWN</button>
                    <button onClick={() => window.location.href = '/game'} className="w-full py-4 bg-white text-black font-black uppercase text-xl border-4 border-black neo-brutalism">ABORT</button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-5xl font-black text-black uppercase mb-4 italic tracking-tighter">CRYPTO DODGER</h2>
                  <p className="text-black font-bold uppercase text-xs mb-8 tracking-widest opacity-60 italic">DODGE THE BEARS • COLLECT THE BULLS</p>
                  <button onClick={startGame} className="w-full py-6 bg-brand-skyblue text-black font-black uppercase text-2xl neo-brutalism hover:bg-black hover:text-white transition-all transform hover:-translate-y-1">START ENGINE</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      {gameState.isPlaying && !gameState.isPaused && (
        <div className="mt-8 flex gap-6 w-full max-w-[320px]">
          <button
            onMouseDown={() => setPlayerX(prev => Math.max(0, prev - moveStep))}
            className="flex-1 p-8 bg-brand-lime border-4 border-black neo-brutalism-sm active:translate-y-1"
          >
            <ArrowLeft className="w-10 h-10 text-black mx-auto" />
          </button>
          <button
            onMouseDown={() => setPlayerX(prev => Math.min(gameWidth - playerSize, prev + moveStep))}
            className="flex-1 p-8 bg-brand-skyblue border-4 border-black neo-brutalism-sm active:translate-y-1"
          >
            <ArrowRight className="w-10 h-10 text-black mx-auto" />
          </button>
        </div>
      )}

      {/* Manual status pill */}
      {gameState.freezeActive && (
        <div className="mt-4 px-8 py-2 bg-[#00FFFF] text-black border-4 border-black neo-brutalism font-black uppercase italic animate-pulse">
          FREEZE PROTOCOL ACTIVE
        </div>
      )}
    </div>
  )
}

export default CryptoDodger

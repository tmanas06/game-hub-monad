'use client';

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, RotateCcw, Smartphone, Wallet, Coins, Loader2, Trophy, Zap } from 'lucide-react';
import { loadKey } from '@/lib/keyCache';
import { getSigner } from '@/lib/viem';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const GAME_SPEED = 100;
const MIN_CELL_SIZE = 15;
const MAX_GAME_SIZE = 500;

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [cellSize, setCellSize] = useState(25);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [userAddress, setUserAddress] = useState<`0x${string}` | null>(null);
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimedReward, setHasClaimedReward] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001'));

  const snakeRef = useRef<Position[]>([]);
  const foodRef = useRef<Position>({ x: 0, y: 0 });
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');

  const generateFood = useCallback(() => {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (snakeRef.current.some(segment => segment.x === x && segment.y === y)) {
      generateFood();
      return;
    }
    foodRef.current = { x, y };
  }, []);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background - Neo Brutalist Dark
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid - Sharp
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, GRID_SIZE * cellSize); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize); ctx.lineTo(GRID_SIZE * cellSize, i * cellSize); ctx.stroke();
    }

    // Draw snake - Bold Lime
    snakeRef.current.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#A1FF00' : '#8ACE00';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.fillRect(segment.x * cellSize + 2, segment.y * cellSize + 2, cellSize - 4, cellSize - 4);
      ctx.strokeRect(segment.x * cellSize + 2, segment.y * cellSize + 2, cellSize - 4, cellSize - 4);
    });

    // Draw food - Coral Block
    ctx.fillStyle = '#FF6B6B';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillRect(foodRef.current.x * cellSize + 2, foodRef.current.y * cellSize + 2, cellSize - 4, cellSize - 4);
    ctx.strokeRect(foodRef.current.x * cellSize + 2, foodRef.current.y * cellSize + 2, cellSize - 4, cellSize - 4);
  }, [cellSize]);

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = GRID_SIZE * cellSize;
    canvas.height = GRID_SIZE * cellSize;
    const startX = Math.floor(GRID_SIZE / 2);
    const startY = Math.floor(GRID_SIZE / 2);
    snakeRef.current = [{ x: startX, y: startY }, { x: startX - 1, y: startY }, { x: startX - 2, y: startY }];
    generateFood();
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    setScore(0);
    setGameOver(false);
    drawGame();
  }, [cellSize, drawGame, generateFood]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const interval = setInterval(() => {
      directionRef.current = nextDirectionRef.current;
      const head = { ...snakeRef.current[0] };
      switch (directionRef.current) {
        case 'UP': head.y--; break;
        case 'DOWN': head.y++; break;
        case 'LEFT': head.x--; break;
        case 'RIGHT': head.x++; break;
      }
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE || snakeRef.current.some(s => s.x === head.x && s.y === head.y)) {
        setGameOver(true); setIsPlaying(false); return;
      }
      const newSnake = [head, ...snakeRef.current];
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore(prev => prev + 10); generateFood();
      } else { newSnake.pop(); }
      snakeRef.current = newSnake;
      drawGame();
    }, GAME_SPEED);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, generateFood, drawGame]);

  useLayoutEffect(() => {
    const updateSize = () => {
      if (!gameAreaRef.current) return;
      const w = Math.min(gameAreaRef.current.clientWidth - 40, MAX_GAME_SIZE);
      setCellSize(Math.floor(w / GRID_SIZE));
      setShowMobileControls(window.innerWidth <= 768);
    };
    updateSize(); window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const startGame = useCallback(() => {
    initGame();
    setIsPlaying(true);
  }, [initGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;

      const key = e.key.toUpperCase();
      const controlKeys = ['W', 'A', 'S', 'D', 'ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', ' '];

      if (controlKeys.includes(key)) {
        e.preventDefault();
      }

      if ((key === 'W' || key === 'ARROWUP') && directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP';
      if ((key === 'S' || key === 'ARROWDOWN') && directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN';
      if ((key === 'A' || key === 'ARROWLEFT') && directionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
      if ((key === 'D' || key === 'ARROWRIGHT') && directionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT';

      if (e.key === ' ') {
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver]);

  const claimReward = async () => {
    if (!userAddress || score < 100) return;
    try {
      setIsClaiming(true);
      await fetch(`${API_URL}/api/claim-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress, score, gameMode: 'snake' })
      });
      setHasClaimedReward(true);
    } catch (e) { setRewardError("CLAIM FAILED"); } finally { setIsClaiming(false); }
  };

  return (
    <div className="w-full flex flex-col items-center font-display">
      {/* Stats Bar */}
      <div className="w-full max-w-lg flex justify-between gap-4 mb-6">
        <div className="bg-brand-lime text-black border-4 border-black px-6 py-2 neo-brutalism font-black italic text-2xl tracking-tighter shadow-[8px_8px_0_0_#000]">
          SCORE: {score}
        </div>
        <div className="bg-brand-coral text-white border-4 border-black px-6 py-2 neo-brutalism font-black italic text-2xl tracking-tighter shadow-[8px_8px_0_0_#000]">
          BEST: {highScore}
        </div>
      </div>

      <div ref={gameAreaRef} className="relative w-full max-w-[500px] border-8 border-black bg-black neo-brutalism overflow-hidden">
        <canvas ref={canvasRef} className="block mx-auto" />

        {(!isPlaying || gameOver) && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white border-8 border-black p-8 neo-brutalism rotate-[-1deg] text-center w-full max-w-sm">
              {gameOver ? (
                <>
                  <h2 className="text-5xl font-black text-black uppercase mb-2 italic tracking-tighter">GAME OVER</h2>
                  <p className="text-3xl font-black text-brand-purple mb-8 italic tracking-tighter">{score} POINTS</p>

                  {score >= 100 && (
                    <div className="bg-brand-yellow p-4 border-4 border-black mb-6 rotate-[2deg] neo-brutalism-sm">
                      <p className="text-black font-black uppercase text-xl italic tracking-tighter">CLAIM {Math.floor(score / 100)} MON</p>
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
                    <button onClick={startGame} className="w-full py-4 bg-brand-lime text-black font-black uppercase text-2xl neo-brutalism hover:bg-black hover:text-white transition-all transform hover:-translate-y-1">RETRY</button>
                    <button onClick={() => window.location.href = '/game'} className="w-full py-4 bg-white text-black font-black uppercase text-xl border-4 border-black neo-brutalism">EXIT ENGINE</button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-5xl font-black text-black uppercase mb-8 italic tracking-tighter">SNAKE ENGINE</h2>
                  <button onClick={startGame} className="w-full py-6 bg-brand-skyblue text-black font-black uppercase text-2xl neo-brutalism hover:bg-black hover:text-white transition-all transform hover:-translate-y-1">BOOT CORE</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls Overlay for Mobile */}
      {showMobileControls && isPlaying && (
        <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-[280px]">
          <div />
          <button onTouchStart={() => handleDirectionClick('UP')} className="p-6 bg-brand-yellow border-4 border-black neo-brutalism-sm active:translate-y-1"><ArrowUp className="w-8 h-8 text-black" /></button>
          <div />
          <button onTouchStart={() => handleDirectionClick('LEFT')} className="p-6 bg-brand-skyblue border-4 border-black neo-brutalism-sm active:translate-y-1"><ArrowLeft className="w-8 h-8 text-black" /></button>
          <button onTouchStart={() => handleDirectionClick('DOWN')} className="p-6 bg-brand-coral border-4 border-black neo-brutalism-sm active:translate-y-1"><ArrowDown className="w-8 h-8 text-black" /></button>
          <button onTouchStart={() => handleDirectionClick('RIGHT')} className="p-6 bg-brand-lime border-4 border-black neo-brutalism-sm active:translate-y-1"><ArrowRight className="w-8 h-8 text-black" /></button>
        </div>
      )}

      {!showMobileControls && (
        <div className="mt-8 px-6 py-3 bg-white border-4 border-black neo-brutalism-sm font-black text-black uppercase text-sm italic tracking-widest rotate-[1deg]">
          CONTROLS: WASD OR ARROW KEYS • SPACE TO PAUSE
        </div>
      )}
    </div>
  );

  function handleDirectionClick(dir: Direction) {
    if (dir === 'UP' && directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP';
    if (dir === 'DOWN' && directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN';
    if (dir === 'LEFT' && directionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
    if (dir === 'RIGHT' && directionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
  }
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Home, Gamepad2, Trophy, Settings, User, Bot, Wallet, LogOut, Copy, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cacheKey, loadKey, clearKey } from '@/lib/keyCache';
import { getSigner as getSignerFactory, publicClient } from '@/lib/viem';
import { generatePrivateKey } from 'viem/accounts';
import { formatEther } from 'viem';

export default function MainNavbar() {
  const pathname = usePathname();
  const { ready, authenticated, user, login, logout } = usePrivy();

  const [signer, setSigner] = useState(() => {
    const pk = loadKey();
    return pk ? getSignerFactory() : null;
  });
  const [balance, setBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const address = user?.wallet?.address || signer?.account.address;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  // Handle ephemeral signer generation
  useEffect(() => {
    if (authenticated && !signer) {
      const pk = generatePrivateKey();
      cacheKey(pk);
      setSigner(getSignerFactory());
    }
  }, [authenticated, signer]);

  // Handle logout
  const handleLogout = useCallback(() => {
    clearKey();
    setSigner(null);
    logout();
  }, [logout]);

  // Fetch balance
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

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Play', href: '/game', icon: Gamepad2 },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'AI Chat', href: '/ai-chat', icon: Bot },
    { name: 'Agent', href: '/agent', icon: Settings },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B] border-b-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Row 1: Logo and Main Nav */}
        <div className="flex justify-between h-20 items-center">
          {/* Logo Section */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="relative p-1 bg-brand-lime neo-brutalism rotate-[-2deg] group-hover:rotate-0 transition-transform">
                <Image
                  src="/x402-logo.png"
                  alt="Game Hub Monad"
                  width={34}
                  height={34}
                  className="rounded-sm"
                  priority
                />
              </div>
              <span className="text-2xl font-display font-black text-white tracking-tighter italic">
                GAME HUB <span className="text-brand-lime">MONAD</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navItems.map((item, idx) => {
                const isActive = pathname === item.href || (item.href === '/game' && pathname.startsWith('/game'));
                const colors = ['text-brand-lime', 'text-brand-coral', 'text-brand-skyblue', 'text-brand-purple', 'text-brand-yellow', 'text-brand-lime'];
                const colorClass = colors[idx % colors.length];

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'px-4 py-1.5 rounded-sm text-sm font-display font-bold uppercase transition-all border-2 border-transparent hover:border-black hover:bg-white hover:text-black neo-brutalism-sm whitespace-nowrap',
                      isActive
                        ? 'bg-white text-black border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]'
                        : 'text-white hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]'
                    )}
                  >
                    <span className={cn(isActive ? 'text-black' : colorClass)}>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Wallet Section (Hidden on screens smaller than 2xl to prevent overlap) */}
          <div className="hidden 2xl:flex items-center gap-4">
            {!ready ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-brand-purple neo-brutalism">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span className="text-xs font-display font-black text-white">LOADING</span>
              </div>
            ) : authenticated && address ? (
              <div className="flex items-center gap-3">
                {/* Balance Display */}
                {balance !== null && (
                  <div className="flex items-center px-3 py-1.5 bg-brand-yellow neo-brutalism">
                    <span className="text-xs font-display font-black text-black">
                      {Number(balance).toFixed(3)} MON
                    </span>
                  </div>
                )}

                {/* Address Pill */}
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 px-3 py-1.5 bg-brand-skyblue neo-brutalism group"
                >
                  <span className="text-xs font-display font-black text-black">
                    {shortAddress}
                  </span>
                  {copied ? (
                    <Check className="h-3 w-3 text-black" />
                  ) : (
                    <Copy className="h-3 w-3 text-black opacity-50 group-hover:opacity-100" />
                  )}
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 bg-brand-coral border-2 border-black neo-brutalism hover:bg-red-500 transition-colors"
                  title="Exit"
                >
                  <LogOut className="h-5 w-5 text-black" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="px-6 py-2 bg-brand-lime text-black font-display font-black text-sm neo-brutalism uppercase hover:bg-white transition-all transform hover:-translate-y-1 hover:-translate-x-1"
              >
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Status Bar (Visible on all screens smaller than 2xl) */}
        <div className="2xl:hidden border-t-2 border-black/20 pt-2 pb-4">
          <div className="flex justify-between items-center px-2">
            <div className="text-[10px] font-display font-bold text-white/40 uppercase tracking-widest">
              MONAD TESTNET CORE
            </div>

            <div className="flex items-center gap-3">
              {ready && authenticated && address ? (
                <>
                  {balance !== null && (
                    <div className="flex items-center px-3 py-1 bg-brand-yellow border-2 border-black neo-brutalism-sm">
                      <span className="text-[10px] font-black text-black">
                        {Number(balance).toFixed(3)} MON
                      </span>
                    </div>
                  )}
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-2 px-3 py-1 bg-brand-skyblue border-2 border-black neo-brutalism-sm group"
                  >
                    <span className="text-[10px] font-black text-black">
                      {shortAddress}
                    </span>
                    {copied ? (
                      <Check className="h-3 w-3 text-black" />
                    ) : (
                      <Copy className="h-3 w-3 text-black opacity-50 h-3 w-3" />
                    )}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-1 px-2 bg-brand-coral border-2 border-black neo-brutalism-sm hover:bg-red-500 transition-colors"
                  >
                    <LogOut className="h-3 w-3 text-black" />
                  </button>
                </>
              ) : ready && !authenticated ? (
                <button
                  onClick={login}
                  className="px-4 py-1.5 bg-brand-lime text-black font-black text-[10px] border-2 border-black neo-brutalism-sm uppercase hover:bg-white transition-all"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-brand-purple border-2 border-black neo-brutalism-sm">
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                  <span className="text-[10px] font-black text-white">SYNCING</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-[#0A0A0B] border-t-4 border-black py-2 z-50">
        <div className="flex justify-around items-center px-2">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href || (item.href === '/game' && pathname.startsWith('/game'));
            const colors = ['bg-brand-lime', 'bg-brand-coral', 'bg-brand-skyblue', 'bg-brand-purple', 'bg-brand-yellow', 'bg-brand-lime'];
            const colorClass = colors[idx % colors.length];

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 transition-all',
                  isActive ? 'scale-110' : 'opacity-70'
                )}
              >
                <div className={cn(
                  'p-2 border-2 border-black',
                  isActive ? colorClass + ' shadow-[3px_3px_0_0_rgba(0,0,0,1)]' : 'bg-white'
                )}>
                  <item.icon className={cn('h-5 w-5', isActive ? 'text-black' : 'text-black')} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { useReadContract, useChainId, useAccount, useConnect } from 'wagmi';
import { CONTRACTS, VIBEBADGE_ABI, DEV_ADDRESS } from '@/lib/contracts';
import { formatEther } from 'viem';
import { useMiniAppContext } from '@/hooks/useMiniAppContext';
import { FarcasterProfile } from '@/components/FarcasterProfile';
import { useState, useEffect } from 'react';
// Leaderboard and Supabase removed

export default function StatsPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { isMiniApp } = useMiniAppContext();
  const chainId = useChainId();
  const contractAddress = CONTRACTS[8453]?.address;
  const networkName = 'Base Mainnet';
  const [shareSuccess, setShareSuccess] = useState(false);
  // Leaderboard removed - keeping stats only

  const { data: nextTokenId } = useReadContract({
    address: contractAddress,
    abi: VIBEBADGE_ABI,
    functionName: 'getNextTokenId',
  });

  // User-specific stats
  const { data: userBalance, refetch: refetchUserBalance } = useReadContract({
    address: contractAddress,
    abi: VIBEBADGE_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Auto refetch every 5 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  });

  const { data: checkInStats, refetch: refetchCheckInStats } = useReadContract({
    address: contractAddress,
    abi: VIBEBADGE_ABI,
    functionName: 'getCheckInStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Auto refetch every 5 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  });

  const totalMinted = nextTokenId ? Number(nextTokenId) - 1 : 0;
  const userMints = userBalance ? Number(userBalance) : 0;
  const checkInStreak = checkInStats?.[1] ? Number(checkInStats[1]) : 0;
  const totalCheckIns = checkInStats?.[2] ? Number(checkInStats[2]) : 0;

  // Calculate total activity for display
  // Each mint = 60% activity, each check-in = 40% activity
  const mintActivity = userMints * 0.6;
  const checkInActivity = totalCheckIns * 0.4;
  const totalActivity = Math.floor(mintActivity + checkInActivity);

  // Leaderboard removed - no network calls here

  const handleShare = () => {
    const text = `🎫 My VibeBadge Stats!\n\n📊 Total Activity: ${totalActivity}\n🎨 Badges Minted: ${userMints}\n🔥 Check-in Streak: ${checkInStreak} days\n✅ Total Check-ins: ${totalCheckIns}\n\nJoin me on VibeBadge! 🚀`;
    const url = 'https://app.vibepas.xyz';
    
    // Check if Farcaster context is available
    if (typeof window !== 'undefined' && (window as any).farcaster) {
      (window as any).farcaster.share({
        text,
        embeds: [url],
      });
    } else {
      // Fallback to Warpcast intent
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`;
      window.open(warpcastUrl, '_blank');
    }
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  const handleManualRefresh = () => {
    refetchUserBalance();
    refetchCheckInStats();
  };

  return (
    <div className="min-h-screen bg-black pb-20 sm:pb-0">
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="mobile-container">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                🎫 VibeBadge
              </Link>
              <div className="hidden sm:flex space-x-4">
                <Link href="/mint" className="text-gray-300 hover:text-purple-400 transition text-sm">
                  Mint
                </Link>
                <Link href="/badges" className="text-gray-300 hover:text-purple-400 transition text-sm">
                  Badges
                </Link>
                <Link href="/stats" className="text-purple-400 font-semibold text-sm">
                  Stats
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FarcasterProfile />
              {!isMiniApp && (
                <button
                  onClick={() => connectors.length > 0 && connect({ connector: connectors[0] })}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition active:scale-95"
                >
                  {isConnected ? '🟢 Connected' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="mobile-container py-8 sm:py-12 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-purple-400">📊 My Activity Stats</h1>
          {isConnected && (
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-purple-300 rounded-lg border border-gray-700 transition text-sm"
            >
              <span className="text-lg">🔄</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>

        {!isConnected ? (
          <div className="mobile-card p-8 text-center mb-8">
            <div className="text-6xl mb-4">🔌</div>
            <h2 className="text-xl font-bold mb-2 text-gray-300">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect to view your activity stats and level</p>
            <button
              onClick={() => connectors.length > 0 && connect({ connector: connectors[0] })}
              className="mobile-button-primary"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Achievements Section */}
            <div className="mobile-card p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-purple-400 flex items-center gap-2">
                <span>🏆</span>
                <span>My Achievements</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Achievement: First Mint */}
                <div className={`p-4 rounded-lg border-2 text-center transition ${userMints >= 1 ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-900/20 opacity-50'}`}>
                  <div className="text-3xl mb-2">🎨</div>
                  <div className="text-xs font-semibold text-gray-300">Pioneer</div>
                  <div className="text-xs text-gray-500 mt-1">First mint</div>
                </div>

                {/* Achievement: 5 Mints */}
                <div className={`p-4 rounded-lg border-2 text-center transition ${userMints >= 5 ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-900/20 opacity-50'}`}>
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="text-xs font-semibold text-gray-300">Collector</div>
                  <div className="text-xs text-gray-500 mt-1">5 badges</div>
                </div>

                {/* Achievement: 7-day Streak */}
                <div className={`p-4 rounded-lg border-2 text-center transition ${checkInStreak >= 7 ? 'border-orange-500 bg-orange-900/20' : 'border-gray-700 bg-gray-900/20 opacity-50'}`}>
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="text-xs font-semibold text-gray-300">Dedicated</div>
                  <div className="text-xs text-gray-500 mt-1">7-day streak</div>
                </div>

                {/* Achievement: 10 Mints */}
                <div className={`p-4 rounded-lg border-2 text-center transition ${userMints >= 10 ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-700 bg-gray-900/20 opacity-50'}`}>
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="text-xs font-semibold text-gray-300">Enthusiast</div>
                  <div className="text-xs text-gray-500 mt-1">10 badges</div>
                </div>

                {/* Achievement: 30-day Streak */}
                <div className={`p-4 rounded-lg border-2 text-center transition ${checkInStreak >= 30 ? 'border-pink-500 bg-pink-900/20' : 'border-gray-700 bg-gray-900/20 opacity-50'}`}>
                  <div className="text-3xl mb-2">👑</div>
                  <div className="text-xs font-semibold text-gray-300">Legend</div>
                  <div className="text-xs text-gray-500 mt-1">30-day streak</div>
                </div>

                {/* Achievement: 25 Mints */}
                <div className={`p-4 rounded-lg border-2 text-center transition ${userMints >= 25 ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-700 bg-gray-900/20 opacity-50'}`}>
                  <div className="text-3xl mb-2">💎</div>
                  <div className="text-xs font-semibold text-gray-300">Master</div>
                  <div className="text-xs text-gray-500 mt-1">25 badges</div>
                </div>
              </div>
            </div>

            {/* Leaderboard removed */}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full mb-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="text-xl">🔗</span>
              <span>{shareSuccess ? 'Shared!' : 'Share My Achievements'}</span>
            </button>

            {/* Activity Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="mobile-card p-4 text-center">
                <div className="text-3xl mb-2">🎨</div>
                <div className="text-2xl font-bold text-purple-400">{userMints}</div>
                <div className="text-xs text-gray-500 mt-1">Badges Minted</div>
                <div className="text-xs text-purple-400 mt-1">+{Math.floor(userMints * 60)}% Activity</div>
              </div>

              <div className="mobile-card p-4 text-center">
                <div className="text-3xl mb-2">🔥</div>
                <div className="text-2xl font-bold text-orange-400">{checkInStreak}</div>
                <div className="text-xs text-gray-500 mt-1">Day Streak</div>
              </div>

              <div className="mobile-card p-4 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-2xl font-bold text-green-400">{totalCheckIns}</div>
                <div className="text-xs text-gray-500 mt-1">Total Check-ins</div>
                <div className="text-xs text-green-400 mt-1">+{Math.floor(totalCheckIns * 40)}% Activity</div>
              </div>

              <div className="mobile-card p-4 text-center">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-2xl font-bold text-blue-400">{totalActivity}</div>
                <div className="text-xs text-gray-500 mt-1">Total Activity</div>
              </div>
            </div>

            {/* My Onchain Activity */}
            <div className="mobile-card p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-purple-400 flex items-center gap-2">
                <span>⛓️</span>
                <span>My Onchain Activity</span>
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">💰</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-300">Transaction Volume</div>
                      <div className="text-xs text-gray-500">Total value transacted</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-400">
                      {(userMints * 0.0001).toFixed(4)} ETH
                    </div>
                    <div className="text-xs text-gray-500">≈ ${(userMints * 0.0001 * 2800).toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📝</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-300">Total Transactions</div>
                      <div className="text-xs text-gray-500">Onchain interactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400">{userMints + totalCheckIns}</div>
                    <div className="text-xs text-gray-500">txs</div>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🎨</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-300">NFT Mints</div>
                      <div className="text-xs text-gray-500">Badge minting activity</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-400">{userMints}</div>
                    <div className="text-xs text-gray-500">mints</div>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">✅</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-300">Check-in Transactions</div>
                      <div className="text-xs text-gray-500">Daily activity tracking</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">{totalCheckIns}</div>
                    <div className="text-xs text-gray-500">check-ins</div>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">⚡</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-300">Gas Spent</div>
                      <div className="text-xs text-gray-500">Total network fees paid</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-400">
                      ~{((userMints + totalCheckIns) * 0.00002).toFixed(5)} ETH
                    </div>
                    <div className="text-xs text-gray-500">≈ ${((userMints + totalCheckIns) * 0.00002 * 2800).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Wallet Link */}
              {address && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <a
                    href={`https://basescan.org/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gray-800 hover:bg-gray-700 text-purple-300 rounded-lg transition text-sm font-semibold"
                  >
                    <span>🔍</span>
                    <span>View Full History on BaseScan</span>
                  </a>
                </div>
              )}
            </div> </>
        )}

        {/* Global Stats */}
        <div className="mobile-card p-6 mb-6">
          <h3 className="text-xl font-bold mb-4 text-purple-400">🌐 Global Statistics</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">{totalMinted}</div>
              <div className="text-sm text-gray-500 mt-1">Total Badges Minted</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/mint" className="mobile-button-primary inline-block text-lg">
            ✨ Mint a Badge
          </Link>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Link href="/mint" className="flex flex-col items-center py-3 text-gray-400 hover:text-purple-400 transition">
            <span className="text-2xl mb-1">🎨</span>
            <span className="text-xs">Mint</span>
          </Link>
          <Link href="/badges" className="flex flex-col items-center py-3 text-gray-400 hover:text-purple-400 transition">
            <span className="text-2xl mb-1">🎫</span>
            <span className="text-xs">Badges</span>
          </Link>
          <Link href="/checkin" className="flex flex-col items-center py-3 text-gray-400 hover:text-purple-400 transition">
            <span className="text-2xl mb-1">📅</span>
            <span className="text-xs">Check-In</span>
          </Link>
          <Link href="/stats" className="flex flex-col items-center py-3 text-purple-400 font-medium">
            <span className="text-2xl mb-1">📊</span>
            <span className="text-xs">Stats</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

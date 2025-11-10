'use client';

import Link from 'next/link';
import { useReadContract, useChainId, useAccount, useConnect } from 'wagmi';
import { CONTRACTS, VIBEBADGE_ABI, DEV_ADDRESS } from '@/lib/contracts';
import { formatEther } from 'viem';
import { useMiniAppContext } from '@/hooks/useMiniAppContext';
import { useState } from 'react';

export default function StatsPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { isMiniApp } = useMiniAppContext();
  const chainId = useChainId();
  const contractAddress = CONTRACTS[8453]?.address;
  const explorerUrl = CONTRACTS[8453]?.explorer;
  const networkName = 'Base Mainnet';
  const [shareSuccess, setShareSuccess] = useState(false);

  const { data: mintPrice } = useReadContract({
    address: contractAddress,
    abi: VIBEBADGE_ABI,
    functionName: 'mintPrice',
  });

  const { data: totalCost } = useReadContract({
    address: contractAddress,
    abi: VIBEBADGE_ABI,
    functionName: 'getTotalMintCost',
  });

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
      refetchInterval: 5000, // Auto refetch every 5 seconds
    }
  });

  const { data: checkInStats, refetch: refetchCheckInStats } = useReadContract({
    address: contractAddress,
    abi: VIBEBADGE_ABI,
    functionName: 'getCheckInStats',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 5000, // Auto refetch every 5 seconds
    }
  });

  const totalMinted = nextTokenId ? Number(nextTokenId) - 1 : 0;
  const userMints = userBalance ? Number(userBalance) : 0;
  const checkInStreak = checkInStats?.[1] ? Number(checkInStats[1]) : 0;
  const totalCheckIns = checkInStats?.[2] ? Number(checkInStats[2]) : 0;

  // Calculate user level and rank
  const totalActivity = userMints + totalCheckIns;
  const getUserLevel = () => {
    if (totalActivity >= 100) return { level: 10, name: '🏆 Legend', color: 'from-yellow-400 to-orange-500' };
    if (totalActivity >= 50) return { level: 9, name: '💎 Diamond', color: 'from-blue-400 to-cyan-500' };
    if (totalActivity >= 30) return { level: 8, name: '👑 Platinum', color: 'from-purple-400 to-pink-500' };
    if (totalActivity >= 20) return { level: 7, name: '🥇 Gold', color: 'from-yellow-400 to-yellow-600' };
    if (totalActivity >= 15) return { level: 6, name: '🥈 Silver', color: 'from-gray-300 to-gray-500' };
    if (totalActivity >= 10) return { level: 5, name: '🥉 Bronze', color: 'from-orange-400 to-orange-600' };
    if (totalActivity >= 7) return { level: 4, name: '⭐ Rising Star', color: 'from-green-400 to-emerald-500' };
    if (totalActivity >= 5) return { level: 3, name: '🌟 Active', color: 'from-blue-400 to-blue-600' };
    if (totalActivity >= 3) return { level: 2, name: '🔰 Beginner', color: 'from-purple-400 to-purple-600' };
    if (totalActivity >= 1) return { level: 1, name: '🆕 Newbie', color: 'from-gray-400 to-gray-600' };
    return { level: 0, name: '👤 Guest', color: 'from-gray-500 to-gray-700' };
  };

  const userLevel = getUserLevel();
  const nextLevelActivity = [1, 3, 5, 7, 10, 15, 20, 30, 50, 100][userLevel.level] || 100;
  const progressToNextLevel = userLevel.level >= 10 ? 100 : ((totalActivity % nextLevelActivity) / nextLevelActivity) * 100;

  const handleShare = () => {
    const text = `🎫 My VibeBadge Stats!\n\n${userLevel.name} (Level ${userLevel.level})\n📊 Total Activity: ${totalActivity}\n🎨 Badges Minted: ${userMints}\n🔥 Check-in Streak: ${checkInStreak} days\n✅ Total Check-ins: ${totalCheckIns}\n\nJoin me on VibeBadge! 🚀`;
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
            {/* User Level Card */}
            <div className="mobile-card p-6 sm:p-8 mb-6 relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${userLevel.color} opacity-10`}></div>
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="text-6xl sm:text-7xl mb-4">{userLevel.name.split(' ')[0]}</div>
                  <h2 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${userLevel.color} bg-clip-text text-transparent mb-2`}>
                    {userLevel.name}
                  </h2>
                  <div className="text-4xl sm:text-5xl font-bold text-purple-400">Level {userLevel.level}</div>
                </div>

                {/* Progress Bar */}
                {userLevel.level < 10 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Progress to Level {userLevel.level + 1}</span>
                      <span>{Math.floor(progressToNextLevel)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${userLevel.color} transition-all duration-500`}
                        style={{ width: `${progressToNextLevel}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      {totalActivity} / {nextLevelActivity} activities
                    </div>
                  </div>
                )}

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🔗</span>
                  <span>{shareSuccess ? 'Shared!' : 'Share My Stats'}</span>
                </button>
              </div>
            </div>

            {/* Activity Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="mobile-card p-4 text-center">
                <div className="text-3xl mb-2">🎨</div>
                <div className="text-2xl font-bold text-purple-400">{userMints}</div>
                <div className="text-xs text-gray-500 mt-1">Badges Minted</div>
              </div>

              <div className="mobile-card p-4 text-center">
                <div className="text-3xl mb-2">�</div>
                <div className="text-2xl font-bold text-orange-400">{checkInStreak}</div>
                <div className="text-xs text-gray-500 mt-1">Day Streak</div>
              </div>

              <div className="mobile-card p-4 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-2xl font-bold text-green-400">{totalCheckIns}</div>
                <div className="text-xs text-gray-500 mt-1">Total Check-ins</div>
              </div>

              <div className="mobile-card p-4 text-center">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-2xl font-bold text-blue-400">{totalActivity}</div>
                <div className="text-xs text-gray-500 mt-1">Total Activity</div>
              </div>
            </div>

            {/* Level System Info */}
            <div className="mobile-card p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-purple-400">🏆 Level System</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">👤 Guest</span>
                  <span className="text-gray-500">Level 0 (0 activities)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">🆕 Newbie</span>
                  <span className="text-gray-500">Level 1 (1+ activities)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">� Beginner</span>
                  <span className="text-gray-500">Level 2 (3+ activities)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">🌟 Active</span>
                  <span className="text-gray-500">Level 3 (5+ activities)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">⭐ Rising Star</span>
                  <span className="text-gray-500">Level 4 (7+ activities)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">🥉 Bronze</span>
                  <span className="text-gray-500">Level 5 (10+ activities)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">🥈 Silver</span>
                  <span className="text-gray-500">Level 6 (15+ activities)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">🥇 Gold</span>
                  <span className="text-gray-500">Level 7 (20+ activities)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">👑 Platinum</span>
                  <span className="text-gray-500">Level 8 (30+ activities)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">💎 Diamond</span>
                  <span className="text-gray-500">Level 9 (50+ activities)</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">🏆 Legend</span>
                  <span className="text-gray-500">Level 10 (100+ activities)</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Global Stats */}
        <div className="mobile-card p-6 mb-6">
          <h3 className="text-xl font-bold mb-4 text-purple-400">🌐 Global Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{totalMinted}</div>
              <div className="text-xs text-gray-500 mt-1">Total Badges</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{mintPrice ? formatEther(mintPrice) : '0.001'}</div>
              <div className="text-xs text-gray-500 mt-1">Mint Price (ETH)</div>
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

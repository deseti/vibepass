'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, VIBEBADGE_ABI } from '@/lib/contracts';
import { useMiniAppContext } from '@/hooks/useMiniAppContext';

export default function CheckInPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { isMiniApp } = useMiniAppContext();
  
  const contractAddress = CONTRACTS[8453]?.address;

  // Read check-in stats
  const { data: stats, refetch: refetchStats } = useReadContract({
    address: contractAddress,
    abi: VIBEBADGE_ABI,
    functionName: 'getCheckInStats',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 3000, // Auto refetch every 3 seconds
    }
  });

  const { data: canCheckIn, refetch: refetchCanCheckIn } = useReadContract({
    address: contractAddress,
    abi: VIBEBADGE_ABI,
    functionName: 'canCheckInToday',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 3000, // Auto refetch every 3 seconds
    }
  });

  // Write check-in
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [shareSuccess, setShareSuccess] = useState(false);

  const lastCheckInTime = stats?.[0] ? Number(stats[0]) : 0;
  const streak = stats?.[1] ? Number(stats[1]) : 0;
  const totalCheckIns = stats?.[2] ? Number(stats[2]) : 0;

  // Aggressive refetch after success
  useEffect(() => {
    if (isSuccess) {
      const refetchAll = () => {
        refetchStats();
        refetchCanCheckIn();
      };
      // Immediate refetch
      refetchAll();
      // Refetch every second for 10 seconds
      const interval = setInterval(refetchAll, 1000);
      setTimeout(() => clearInterval(interval), 10000);
    }
  }, [isSuccess, refetchStats, refetchCanCheckIn]);

  const handleCheckIn = () => {
    if (!contractAddress) return;
    writeContract({
      address: contractAddress,
      abi: VIBEBADGE_ABI,
      functionName: 'checkIn',
    });
  };

  const handleShare = () => {
    const text = `🎉 Just checked in on VibeBadge!\n\n🔥 Current Streak: ${streak} days\n✅ Total Check-ins: ${totalCheckIns}\n\nKeep your streak alive! 🚀`;
    const url = 'https://app.vibepas.xyz/checkin';
    
    if (typeof window !== 'undefined' && (window as any).farcaster) {
      (window as any).farcaster.share({
        text,
        embeds: [url],
      });
    } else {
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`;
      window.open(warpcastUrl, '_blank');
    }
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  const handleManualRefresh = () => {
    refetchStats();
    refetchCanCheckIn();
  };

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                <Link href="/checkin" className="text-purple-400 font-semibold text-sm">
                  Check-In
                </Link>
                <Link href="/stats" className="text-gray-300 hover:text-purple-400 transition text-sm">
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

      <div className="mobile-container py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-purple-400">📅 Daily Check-In</h1>

        {!isConnected ? (
          <div className="mobile-card max-w-md mx-auto text-center p-8 sm:p-12 animate-fade-in">
            <div className="text-6xl mb-6">🔌</div>
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Connect Wallet</h2>
            <p className="text-gray-400 mb-8 text-sm">
              Connect your wallet to check in daily
            </p>
            {!isMiniApp && (
              <button
                onClick={() => connectors.length > 0 && connect({ connector: connectors[0] })}
                className="mobile-button-primary w-full"
              >
                Connect Wallet
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto animate-fade-in">
            {/* Manual Refresh Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleManualRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-purple-300 rounded-lg border border-gray-700 transition text-sm"
              >
                <span className="text-lg">🔄</span>
                <span>Refresh Data</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="mobile-card text-center p-6">
                <div className="text-4xl mb-2">🔥</div>
                <div className="text-xs text-gray-500 mb-2">Current Streak</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  {streak}
                </div>
                <div className="text-xs text-gray-500 mt-1">days</div>
              </div>

              <div className="mobile-card text-center p-6">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-xs text-gray-500 mb-2">Total Check-Ins</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  {totalCheckIns}
                </div>
                <div className="text-xs text-gray-500 mt-1">times</div>
              </div>

              <div className="mobile-card text-center p-6">
                <div className="text-4xl mb-2">📅</div>
                <div className="text-xs text-gray-500 mb-2">Last Check-In</div>
                <div className="text-sm font-bold text-purple-400 mt-2">
                  {lastCheckInTime === 0 ? 'Never' : formatDate(lastCheckInTime).split(',')[0]}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {lastCheckInTime === 0 ? 'Start today!' : formatDate(lastCheckInTime).split(',')[1]}
                </div>
              </div>
            </div>

            {/* Check-In Button */}
            <div className="mobile-card p-8 text-center mb-6">
              {isSuccess ? (
                <div className="animate-fade-in">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold mb-2 text-purple-400">Checked In!</h2>
                  <p className="text-gray-400 mb-4">
                    Come back tomorrow to continue your streak!
                  </p>
                  <div className="text-lg mb-6">
                    Current Streak: <span className="text-purple-400 font-bold text-2xl">{streak} 🔥</span>
                  </div>
                  <button
                    onClick={handleShare}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">🔗</span>
                    <span>{shareSuccess ? 'Shared!' : 'Share My Check-In'}</span>
                  </button>
                </div>
              ) : canCheckIn ? (
                <div>
                  <div className="text-6xl mb-4">✨</div>
                  <h2 className="text-2xl font-bold mb-2 text-purple-400">Ready to Check In!</h2>
                  <p className="text-gray-400 mb-6">
                    Check in daily to build your streak
                  </p>
                  
                  {error && (
                    <div className="bg-red-900/20 border-2 border-red-800 rounded-xl p-4 mb-4">
                      <p className="text-red-400 text-sm">❌ {error.message}</p>
                    </div>
                  )}

                  {(isPending || isConfirming) && (
                    <div className="bg-blue-900/20 border-2 border-blue-800 rounded-xl p-4 mb-4">
                      <div className="animate-spin inline-block w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full mb-2"></div>
                      <p className="text-blue-400 text-sm">
                        {isPending ? '⏳ Confirming...' : '⏳ Processing...'}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleCheckIn}
                    disabled={isPending || isConfirming}
                    className="mobile-button-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending || isConfirming ? '⏳ Checking In...' : '✅ Check In Now'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">⏰</div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-400">Already Checked In</h2>
                  <p className="text-gray-500 mb-4">
                    You've already checked in today!
                  </p>
                  <div className="text-sm text-gray-500">
                    Come back tomorrow to continue your streak
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="mobile-card p-6">
              <h3 className="font-bold mb-4 text-purple-400">💡 How It Works</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Check in once per day to build your streak</li>
                <li>• Consecutive daily check-ins increase your streak</li>
                <li>• Missing a day resets your streak to 1</li>
                <li>• Total check-ins are tracked forever</li>
                <li>• Free to use - no gas fees needed!</li>
              </ul>
            </div>
          </div>
        )}
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
          <Link href="/checkin" className="flex flex-col items-center py-3 text-purple-400 font-medium">
            <span className="text-2xl mb-1">📅</span>
            <span className="text-xs">Check-In</span>
          </Link>
          <Link href="/stats" className="flex flex-col items-center py-3 text-gray-400 hover:text-purple-400 transition">
            <span className="text-2xl mb-1">📊</span>
            <span className="text-xs">Stats</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

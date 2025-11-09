'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract, useChainId, useConnect } from 'wagmi';
import { CONTRACTS, VIBEBADGE_ABI } from '@/lib/contracts';
import { useMiniAppContext } from '@/hooks/useMiniAppContext';

export default function BadgesPage() {
  const [tokenURIs, setTokenURIs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { isMiniApp } = useMiniAppContext();
  const chainId = useChainId();
  const contractAddress = CONTRACTS[8453]?.address;
  const explorerUrl = CONTRACTS[8453]?.explorer;

  const { data: balance } = useReadContract({
    address: contractAddress,
    abi: VIBEBADGE_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const badgeCount = balance ? Number(balance) : 0;

  // Note: This is a simplified implementation
  // In production, you'd need to implement tokenOfOwnerByIndex or enumerate all tokens
  useEffect(() => {
    if (badgeCount > 0) {
      // Placeholder: In real implementation, fetch actual token IDs owned by user
      setTokenURIs(Array(badgeCount).fill('Badge metadata would be loaded here'));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [badgeCount]);

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
                <Link href="/badges" className="text-purple-400 font-semibold text-sm">
                  Badges
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
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-purple-400">🎫 My Badges</h1>

        {!isConnected ? (
          <div className="mobile-card max-w-md mx-auto text-center p-8 sm:p-12 animate-fade-in">
            <div className="text-6xl mb-6">🔌</div>
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Connect Wallet</h2>
            <p className="text-gray-400 mb-8 text-sm">
              {isMiniApp ? 'Connecting to your wallet...' : 'Connect your wallet to view your badges'}
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
        ) : loading ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="animate-spin inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-400">Loading badges...</p>
          </div>
        ) : badgeCount === 0 ? (
          <div className="mobile-card max-w-md mx-auto text-center p-8 sm:p-12 animate-fade-in">
            <div className="text-6xl mb-6">📭</div>
            <h2 className="text-2xl font-bold mb-4 text-purple-400">No Badges Yet</h2>
            <p className="text-gray-400 mb-8 text-sm">
              You haven't minted any badges yet. Create your first one now!
            </p>
            <Link href="/mint" className="mobile-button-primary inline-block">
              🎨 Mint Your First Badge
            </Link>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="mobile-card mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-2">Wallet Address</div>
                  <code className="text-xs sm:text-sm bg-gray-800 px-2 py-1 rounded block overflow-x-auto text-purple-400">
                    {address?.slice(0, 10)}...{address?.slice(-8)}
                  </code>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-2">Total Badges</div>
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    {badgeCount}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-2">Network</div>
                  <div className="text-base sm:text-lg font-semibold text-gray-300">Base Mainnet</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: badgeCount }).map((_, index) => (
                <div 
                  key={index} 
                  className="mobile-card hover:border-purple-700 transition-all duration-300 overflow-hidden group"
                >
                  <div className="h-40 sm:h-48 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-700 flex items-center justify-center relative overflow-hidden">
                    <div className="text-6xl sm:text-7xl group-hover:scale-110 transition-transform duration-300">🎫</div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h3 className="font-bold text-lg sm:text-xl mb-2 text-purple-400">Badge #{index + 1}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm mb-4">
                      Event participation NFT on Base L2
                    </p>
                    <a
                      href={`${explorerUrl}/token/${contractAddress}?a=${index + 1}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition active:scale-95"
                    >
                      📜 View on BaseScan
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/mint" className="mobile-button-secondary inline-block">
                ✨ Mint Another Badge
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-50">
        <div className="grid grid-cols-3 gap-1 p-2">
          <Link href="/mint" className="flex flex-col items-center py-3 text-gray-400 hover:text-purple-400 transition">
            <span className="text-2xl mb-1">🎨</span>
            <span className="text-xs">Mint</span>
          </Link>
          <Link href="/badges" className="flex flex-col items-center py-3 text-purple-400 font-medium">
            <span className="text-2xl mb-1">🎫</span>
            <span className="text-xs">Badges</span>
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

'use client';

import Link from 'next/link';
import { useReadContract, useChainId, useAccount, useConnect } from 'wagmi';
import { CONTRACTS, VIBEBADGE_ABI, DEV_ADDRESS } from '@/lib/contracts';
import { formatEther } from 'viem';
import { useMiniAppContext } from '@/hooks/useMiniAppContext';

export default function StatsPage() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { isMiniApp } = useMiniAppContext();
  const chainId = useChainId();
  const contractAddress = CONTRACTS[8453]?.address;
  const explorerUrl = CONTRACTS[8453]?.explorer;
  const networkName = 'Base Mainnet';

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

  const totalMinted = nextTokenId ? Number(nextTokenId) - 1 : 0;
  const totalFeesCollected = mintPrice && nextTokenId 
    ? (BigInt(mintPrice) * 3n / 100n) * BigInt(Math.max(0, Number(nextTokenId) - 1))
    : 0n;
  const totalRevenue = totalCost && nextTokenId
    ? BigInt(totalCost) * BigInt(Math.max(0, Number(nextTokenId) - 1))
    : 0n;

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
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-purple-400">📊 Contract Statistics</h1>

        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="mobile-card text-center p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-500 mb-2">Total Badges</div>
            <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              {totalMinted}
            </div>
          </div>
          
          <div className="mobile-card text-center p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-500 mb-2">Mint Price</div>
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              {mintPrice ? formatEther(mintPrice) : '0.001'}
            </div>
            <div className="text-xs text-gray-500 mt-1">ETH</div>
          </div>
          
          <div className="mobile-card text-center p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-500 mb-2">Total Cost</div>
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-purple-600 bg-clip-text text-transparent">
              {totalCost ? formatEther(totalCost) : '0.00103'}
            </div>
            <div className="text-xs text-gray-500 mt-1">ETH</div>
          </div>
          
          <div className="mobile-card text-center p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-500 mb-2">System Fee</div>
            <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 to-purple-600 bg-clip-text text-transparent">
              3%
            </div>
            <div className="text-xs text-gray-500 mt-1">per mint</div>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="mobile-card p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-500 mb-2">💰 Total Revenue</div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-400">
              {formatEther(totalRevenue)} ETH
            </div>
            <div className="text-xs text-gray-500 mt-2">
              All payments to dev
            </div>
          </div>
          
          <div className="mobile-card p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-500 mb-2">💸 Total Fees</div>
            <div className="text-2xl sm:text-3xl font-bold text-green-400">
              {formatEther(totalFeesCollected)} ETH
            </div>
            <div className="text-xs text-gray-500 mt-2">
              3% × {totalMinted} mints
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="mobile-card mb-6 sm:mb-8 p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-purple-400">🌐 Network Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <div className="text-xs text-gray-500 mb-2">Current Network</div>
              <div className="text-base sm:text-lg font-semibold text-gray-300">{networkName}</div>
              <div className="text-xs text-gray-500 mt-1">Chain ID: {chainId}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2">Contract Address</div>
              <code className="text-xs bg-gray-800 px-2 py-1 rounded block overflow-x-auto text-purple-400">
                {contractAddress}
              </code>
              <a
                href={`${explorerUrl}/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-block transition"
              >
                View on BaseScan →
              </a>
            </div>
          </div>
        </div>

        {/* Dev Address */}
        <div className="mobile-card mb-6 sm:mb-8 p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-purple-400">💳 Payment Destination</h2>
          <div>
            <div className="text-xs text-gray-500 mb-2">Dev Address (receives 100%)</div>
            <code className="text-xs bg-gray-800 px-2 py-1 rounded block overflow-x-auto mb-3 text-purple-400">
              {DEV_ADDRESS}
            </code>
            <p className="text-xs sm:text-sm text-gray-400 mb-3">
              All mint payments (base + 3% fee) go directly to this address. No funds held by contract.
            </p>
            <a
              href={`${explorerUrl}/address/${DEV_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 transition inline-block"
            >
              View Dev Address →
            </a>
          </div>
        </div>

        {/* Rarity Distribution */}
        <div className="mobile-card p-4 sm:p-6 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-purple-400">🎲 Rarity Distribution</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl p-4 sm:p-6 text-center border-2 border-blue-700/50 hover:border-blue-600 transition-all">
              <div className="text-3xl sm:text-4xl mb-2">💎</div>
              <div className="font-bold text-base sm:text-xl text-blue-400">Diamond</div>
              <div className="text-xs text-gray-400 mt-2">Legendary Rarity</div>
              <div className="text-xl sm:text-2xl font-bold mt-2 text-blue-400">10%</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 rounded-xl p-4 sm:p-6 text-center border-2 border-yellow-700/50 hover:border-yellow-600 transition-all">
              <div className="text-3xl sm:text-4xl mb-2">🥇</div>
              <div className="font-bold text-base sm:text-xl text-yellow-400">Gold</div>
              <div className="text-xs text-gray-400 mt-2">Rare</div>
              <div className="text-xl sm:text-2xl font-bold mt-2 text-yellow-400">30%</div>
            </div>
            <div className="bg-gradient-to-br from-gray-800/30 to-gray-700/30 rounded-xl p-4 sm:p-6 text-center border-2 border-gray-600/50 hover:border-gray-500 transition-all">
              <div className="text-3xl sm:text-4xl mb-2">🥈</div>
              <div className="font-bold text-base sm:text-xl text-gray-400">Silver</div>
              <div className="text-xs text-gray-400 mt-2">Common</div>
              <div className="text-xl sm:text-2xl font-bold mt-2 text-gray-400">60%</div>
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

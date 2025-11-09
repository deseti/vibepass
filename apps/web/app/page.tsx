'use client';

import Link from 'next/link';
import { useAccount, useReadContract, useChainId, useConnect } from 'wagmi';
import { CONTRACTS, VIBEBADGE_ABI } from '@/lib/contracts';
import { formatEther } from 'viem';
import { useMiniAppContext } from '@/hooks/useMiniAppContext';

export default function HomePage() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { isMiniApp } = useMiniAppContext();
  const chainId = useChainId();
  const contractAddress = CONTRACTS[chainId as keyof typeof CONTRACTS]?.address;

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

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="mobile-container">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                🎫 VibeBadge
              </Link>
              <div className="hidden sm:flex space-x-4">
                <Link href="/mint" className="text-gray-300 hover:text-purple-400 transition text-sm font-medium">
                  Mint
                </Link>
                <Link href="/badges" className="text-gray-300 hover:text-purple-400 transition text-sm font-medium">
                  Badges
                </Link>
                <Link href="/stats" className="text-gray-300 hover:text-purple-400 transition text-sm font-medium">
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

      {/* Hero Section */}
      <div className="mobile-container py-12 sm:py-20">
        <div className="text-center animate-fade-in">
          <div className="text-6xl sm:text-7xl mb-6">🎫</div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              Event NFT Badges
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto px-4">
            Mint and collect NFT badges for events. Built on Base L2 ⚡
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 px-4">
            <Link
              href="/mint"
              className="mobile-button-primary text-lg"
            >
              🎨 Mint Badge Now
            </Link>
            <a
              href={`${CONTRACTS[chainId as keyof typeof CONTRACTS]?.explorer}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-button-secondary text-lg"
            >
              📜 View Contract
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto px-4">
            <div className="mobile-card text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
                {totalMinted}
              </div>
              <div className="text-gray-400 text-sm">
                Badges Minted
              </div>
            </div>
            
            <div className="mobile-card text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
                {totalCost ? formatEther(totalCost) : '0.00103'}
              </div>
              <div className="text-gray-400 text-sm">
                ETH to Mint
              </div>
            </div>
            
            <div className="mobile-card text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-400 to-purple-600 bg-clip-text text-transparent mb-2">
                3%
              </div>
              <div className="text-gray-400 text-sm">
                System Fee
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          <div className="mobile-card hover:border-purple-700 transition-all duration-300">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-purple-400 mb-3">Fast & Cheap</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Built on Base L2 for lightning-fast transactions with minimal gas fees.
            </p>
          </div>
          
          <div className="mobile-card hover:border-purple-700 transition-all duration-300">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-purple-400 mb-3">Secure</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Smart contract verified on BaseScan. Your badges are truly yours, forever.
            </p>
          </div>
          
          <div className="mobile-card hover:border-purple-700 transition-all duration-300">
            <div className="text-5xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-purple-400 mb-3">Collectible</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Each badge is a unique NFT you can view, trade, or display in your wallet.
            </p>
          </div>
        </div>

        {/* Contract Info */}
        <div className="mt-16 sm:mt-20 mobile-card px-4 sm:px-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-purple-400">Contract Information</h2>
          <div className="text-center">
            <div className="font-semibold text-gray-500 mb-3 text-sm">Base Mainnet Contract</div>
            <div className="bg-gray-800 px-4 py-3 rounded-lg inline-block overflow-x-auto max-w-full">
              <code className="text-purple-400 text-xs sm:text-sm font-mono">
                {CONTRACTS[8453].address}
              </code>
            </div>
            <div className="mt-4">
              <a
                href={`${CONTRACTS[8453].explorer}/address/${CONTRACTS[8453].address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition text-sm font-medium"
              >
                View on BaseScan →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar (Bottom) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-50">
        <div className="grid grid-cols-3 gap-1 p-2">
          <Link href="/mint" className="flex flex-col items-center py-3 text-purple-400 font-medium">
            <span className="text-2xl mb-1">🎨</span>
            <span className="text-xs">Mint</span>
          </Link>
          <Link href="/badges" className="flex flex-col items-center py-3 text-gray-400 hover:text-purple-400 transition">
            <span className="text-2xl mb-1">🎫</span>
            <span className="text-xs">Badges</span>
          </Link>
          <Link href="/stats" className="flex flex-col items-center py-3 text-gray-400 hover:text-purple-400 transition">
            <span className="text-2xl mb-1">📊</span>
            <span className="text-xs">Stats</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 mt-20 mb-16 sm:mb-0">
        <div className="mobile-container py-8 text-center text-gray-500 text-sm">
          <p>© 2025 VibeBadge. Built with 💜 on Base.</p>
        </div>
      </footer>
    </div>
  );
}

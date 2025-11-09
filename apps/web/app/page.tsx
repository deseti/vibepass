'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { CONTRACTS, VIBEBADGE_ABI } from '@/lib/contracts';
import { formatEther } from 'viem';

export default function HomePage() {
  const { isConnected } = useAccount();
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navbar */}
      <nav className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                VibeBadge
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link href="/mint" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 transition">
                  Mint
                </Link>
                <Link href="/badges" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 transition">
                  My Badges
                </Link>
                <Link href="/stats" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 transition">
                  Stats
                </Link>
              </div>
            </div>
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Event NFT Badges
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Mint and collect NFT badges for events you attend. Powered by Base L2 for low fees and fast transactions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/mint"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition transform hover:scale-105"
            >
              Mint Badge
            </Link>
            <a
              href={`${CONTRACTS[chainId as keyof typeof CONTRACTS]?.explorer}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold text-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
            >
              View Contract
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {totalMinted}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Badges Minted
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {totalCost ? formatEther(totalCost) : '0.00103'} ETH
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Mint Cost (with fee)
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                3%
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                System Fee
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-3">Fast & Cheap</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Built on Base L2 for lightning-fast transactions with minimal gas fees.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-3">Secure</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Smart contract verified on BaseScan. Your badges are truly yours, forever.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-3">Collectible</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Each badge is a unique NFT you can view, trade, or display in your wallet.
            </p>
          </div>
        </div>

        {/* Contract Info */}
        <div className="mt-20 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Contract Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-semibold text-gray-500 dark:text-gray-400 mb-2">Mainnet Contract</div>
              <code className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded block overflow-x-auto">
                {CONTRACTS[8453].address}
              </code>
            </div>
            <div>
              <div className="font-semibold text-gray-500 dark:text-gray-400 mb-2">Testnet Contract</div>
              <code className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded block overflow-x-auto">
                {CONTRACTS[84532].address}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>© 2025 VibeBadge. Built with ❤️ on Base.</p>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { CONTRACTS, VIBEBADGE_ABI } from '@/lib/contracts';

export default function BadgesPage() {
  const [tokenURIs, setTokenURIs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { address, isConnected } = useAccount();
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
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
                <Link href="/badges" className="text-purple-600 font-semibold">
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

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">My Badges</h1>

        {!isConnected ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-lg text-center">
            <div className="text-6xl mb-6">🔌</div>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Please connect your wallet to view your badges.
            </p>
            <ConnectButton />
          </div>
        ) : loading ? (
          <div className="text-center py-20">
            <div className="animate-spin inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading badges...</p>
          </div>
        ) : badgeCount === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-lg text-center">
            <div className="text-6xl mb-6">📭</div>
            <h2 className="text-2xl font-bold mb-4">No Badges Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              You haven't minted any badges yet. Mint your first one now!
            </p>
            <Link
              href="/mint"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-xl transition"
            >
              Mint Your First Badge
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Wallet Address</div>
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {address?.slice(0, 10)}...{address?.slice(-8)}
                  </code>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Badges</div>
                  <div className="text-2xl font-bold text-purple-600">{badgeCount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Network</div>
                  <div className="text-lg font-semibold">Base Mainnet</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: badgeCount }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition">
                  <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                    <div className="text-6xl">🎫</div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-2">Badge #{index + 1}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      This badge represents your participation in an event.
                    </p>
                    <div className="flex gap-2">
                      <a
                        href={`${explorerUrl}/token/${contractAddress}?a=${index + 1}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition"
                      >
                        View on BaseScan
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/mint"
                className="inline-block px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
              >
                Mint Another Badge
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

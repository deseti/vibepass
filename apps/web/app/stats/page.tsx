'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useReadContract, useChainId } from 'wagmi';
import { CONTRACTS, VIBEBADGE_ABI, DEV_ADDRESS } from '@/lib/contracts';
import { formatEther } from 'viem';

export default function StatsPage() {
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
                <Link href="/badges" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 transition">
                  My Badges
                </Link>
                <Link href="/stats" className="text-purple-600 font-semibold">
                  Stats
                </Link>
              </div>
            </div>
            <ConnectButton />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Contract Statistics</h1>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Badges Minted</div>
            <div className="text-4xl font-bold text-purple-600">{totalMinted}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Mint Price</div>
            <div className="text-4xl font-bold text-blue-600">
              {mintPrice ? formatEther(mintPrice) : '0.001'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">ETH</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Cost</div>
            <div className="text-4xl font-bold text-green-600">
              {totalCost ? formatEther(totalCost) : '0.00103'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">ETH (with 3% fee)</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">System Fee</div>
            <div className="text-4xl font-bold text-orange-600">3%</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">per mint</div>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-purple-600">
              {formatEther(totalRevenue)} ETH
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              All payments to dev
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Fees Collected</div>
            <div className="text-3xl font-bold text-green-600">
              {formatEther(totalFeesCollected)} ETH
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              3% of base price × {totalMinted} mints
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-6">Network Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Current Network</div>
              <div className="text-lg font-semibold">{networkName}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chain ID: {chainId}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Contract Address</div>
              <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block overflow-x-auto">
                {contractAddress}
              </code>
              <a
                href={`${explorerUrl}/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-600 hover:underline mt-2 inline-block"
              >
                View on BaseScan →
              </a>
            </div>
          </div>
        </div>

        {/* Dev Address */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-6">Payment Destination</h2>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Dev Address (receives 100% of payments)</div>
            <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block overflow-x-auto mb-2">
              {DEV_ADDRESS}
            </code>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All mint payments (base price + 3% fee) go directly to this address. The contract never holds funds.
            </p>
            <a
              href={`${explorerUrl}/address/${DEV_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:underline mt-2 inline-block"
            >
              View Dev Address on BaseScan →
            </a>
          </div>
        </div>

        {/* Rarity Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Badge Rarity Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 text-center border-2 border-blue-200 dark:border-blue-700">
              <div className="text-4xl mb-2">💎</div>
              <div className="font-bold text-xl text-blue-600 dark:text-blue-400">Diamond</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Legendary Rarity</div>
              <div className="text-2xl font-bold mt-2">10%</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-6 text-center border-2 border-yellow-200 dark:border-yellow-700">
              <div className="text-4xl mb-2">🥇</div>
              <div className="font-bold text-xl text-yellow-600 dark:text-yellow-400">Gold</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Rare</div>
              <div className="text-2xl font-bold mt-2">30%</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-600/20 rounded-lg p-6 text-center border-2 border-gray-200 dark:border-gray-600">
              <div className="text-4xl mb-2">🥈</div>
              <div className="font-bold text-xl text-gray-600 dark:text-gray-400">Silver</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Common</div>
              <div className="text-2xl font-bold mt-2">60%</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/mint"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition"
          >
            Mint a Badge
          </Link>
        </div>
      </div>
    </div>
  );
}

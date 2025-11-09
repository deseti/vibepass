'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId, useSwitchChain } from 'wagmi';
import { CONTRACTS, VIBEBADGE_ABI, DEV_ADDRESS } from '@/lib/contracts';
import { formatEther } from 'viem';
import { generateBadgeSVG, generateBadgeMetadata, type BadgeLevel } from '@/lib/badgeGenerator';
import { uploadSVGToPinata, uploadToPinata } from '@/lib/pinata';

export default function MintPage() {
  const [eventName, setEventName] = useState('');
  const [badgeLevel, setBadgeLevel] = useState<BadgeLevel>('SILVER');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  
  const contractAddress = CONTRACTS[chainId as keyof typeof CONTRACTS]?.address;
  const isValidChain = chainId === 8453 || chainId === 84532;

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

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMint = async () => {
    if (!address || !contractAddress || !totalCost || !eventName.trim()) return;
    
    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Generate SVG badge
      const svg = generateBadgeSVG(eventName, badgeLevel);
      
      // 2. Upload SVG to Pinata
      const imageIpfsUrl = await uploadSVGToPinata(svg, `${eventName}-${badgeLevel}-badge.svg`);
      
      // 3. Generate metadata
      const metadata = generateBadgeMetadata(
        eventName,
        badgeLevel,
        imageIpfsUrl,
        `${badgeLevel} tier badge for ${eventName} event`
      );
      
      // 4. Upload metadata to Pinata
      const metadataIpfsUrl = await uploadToPinata(metadata, `${eventName}-${badgeLevel}-metadata.json`);
      
      // 5. Mint NFT with metadata URI
      writeContract({
        address: contractAddress,
        abi: VIBEBADGE_ABI,
        functionName: 'mintBadge',
        args: [address, metadataIpfsUrl],
        value: totalCost,
      });
    } catch (err: any) {
      console.error('Upload/Mint error:', err);
      setUploadError(err.message || 'Failed to upload badge to IPFS');
      setIsUploading(false);
    }
  };

  if (isSuccess) {
    const explorerUrl = `${CONTRACTS[chainId as keyof typeof CONTRACTS]?.explorer}/tx/${hash}`;
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <nav className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                VibeBadge
              </Link>
              <ConnectButton />
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold mb-4">Badge Minted Successfully!</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Your badge has been minted and is now in your wallet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-xl transition"
            >
              View on BaseScan
            </a>
            <Link
              href="/badges"
              className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
            >
              View My Badges
            </Link>
            <button
              onClick={() => {
                setEventName('');
                setBadgeLevel('SILVER');
                setUploadError(null);
                window.location.reload();
              }}
              className="px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Mint Another
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                <Link href="/mint" className="text-purple-600 font-semibold">
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

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Mint Your Badge</h1>

        {!isConnected ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-lg text-center">
            <div className="text-6xl mb-6">🔌</div>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Please connect your wallet to mint a badge.
            </p>
            <ConnectButton />
          </div>
        ) : !isValidChain ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-lg text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">Wrong Network</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Please switch to Base Mainnet or Base Sepolia Testnet.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => switchChain?.({ chainId: 8453 })}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-xl transition"
              >
                Switch to Mainnet
              </button>
              <button
                onClick={() => switchChain?.({ chainId: 84532 })}
                className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
              >
                Switch to Testnet
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Event Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Web3 Summit 2025"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Badge Level
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setBadgeLevel('SILVER')}
                  className={`p-4 rounded-lg border-2 transition ${
                    badgeLevel === 'SILVER'
                      ? 'border-gray-400 bg-gray-50 dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">🥈</div>
                  <div className="font-bold text-gray-700 dark:text-gray-300">SILVER</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Standard</div>
                </button>
                
                <button
                  onClick={() => setBadgeLevel('GOLD')}
                  className={`p-4 rounded-lg border-2 transition ${
                    badgeLevel === 'GOLD'
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-yellow-300'
                  }`}
                >
                  <div className="text-3xl mb-2">🥇</div>
                  <div className="font-bold text-yellow-600 dark:text-yellow-400">GOLD</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Premium</div>
                </button>
                
                <button
                  onClick={() => setBadgeLevel('DIAMOND')}
                  className={`p-4 rounded-lg border-2 transition ${
                    badgeLevel === 'DIAMOND'
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl mb-2">💎</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400">DIAMOND</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Elite</div>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-4">Cost Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Base Price:</span>
                  <span className="font-mono">{mintPrice ? formatEther(mintPrice) : '0.001'} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">System Fee (3%):</span>
                  <span className="font-mono">
                    {mintPrice ? formatEther(BigInt(mintPrice) * 3n / 100n) : '0.00003'} ETH
                  </span>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2 flex justify-between font-bold">
                  <span>Total Cost:</span>
                  <span className="font-mono text-purple-600">{totalCost ? formatEther(totalCost) : '0.00103'} ETH</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Badge will be auto-generated and uploaded to IPFS via Pinata
              </p>
            </div>

            {uploadError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  Error: {uploadError}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  Error: {error.message}
                </p>
              </div>
            )}

            {(isConfirming || isUploading) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  {isUploading ? 'Uploading badge to IPFS...' : 'Confirming transaction...'}
                </p>
              </div>
            )}

            <button
              onClick={handleMint}
              disabled={!eventName.trim() || isPending || isConfirming || isUploading}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : isPending || isConfirming ? 'Minting...' : 'Generate & Mint Badge'}
            </button>

            <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
              Your badge will be automatically generated with {badgeLevel} design and uploaded to IPFS
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

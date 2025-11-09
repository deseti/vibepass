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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mintedBadgeUrl, setMintedBadgeUrl] = useState<string>('');
  const [mintedLevel, setMintedLevel] = useState<BadgeLevel | null>(null);
  
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  
  const contractAddress = CONTRACTS[8453]?.address;
  const isValidChain = chainId === 8453;

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
      // 1. Get random badge level
      const { getRandomBadgeLevel } = await import('@/lib/badgeGenerator');
      const randomLevel = getRandomBadgeLevel();
      setMintedLevel(randomLevel);
      
      // 2. Generate SVG badge
      const svg = generateBadgeSVG(eventName, randomLevel);
      
      // 3. Upload SVG to Pinata
      const imageIpfsUrl = await uploadSVGToPinata(svg, `${eventName}-${randomLevel}-badge.svg`);
      setMintedBadgeUrl(imageIpfsUrl);
      
      // 4. Generate metadata
      const metadata = generateBadgeMetadata(
        eventName,
        randomLevel,
        imageIpfsUrl,
        `${randomLevel} tier badge for ${eventName} event`
      );
      
      // 5. Upload metadata to Pinata
      const metadataIpfsUrl = await uploadToPinata(metadata, `${eventName}-${randomLevel}-metadata.json`);
      
      // 6. Mint NFT with metadata URI
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
    const explorerUrl = `${CONTRACTS[8453]?.explorer}/tx/${hash}`;
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
          
          {mintedLevel && (
            <div className="mb-6">
              <div className={`inline-block px-6 py-3 rounded-full font-bold text-2xl ${
                mintedLevel === 'DIAMOND' ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white' :
                mintedLevel === 'GOLD' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
              }`}>
                {mintedLevel === 'DIAMOND' ? '💎 DIAMOND' : mintedLevel === 'GOLD' ? '🥇 GOLD' : '🥈 SILVER'}
              </div>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                {mintedLevel === 'DIAMOND' ? 'Legendary! (10% chance)' : 
                 mintedLevel === 'GOLD' ? 'Rare! (30% chance)' : 
                 'Common (60% chance)'}
              </p>
            </div>
          )}
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Your badge has been minted and is now in your wallet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {mintedBadgeUrl && (
              <a
                href={mintedBadgeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                🖼️ View Badge Image
              </a>
            )}
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
                setMintedBadgeUrl('');
                setMintedLevel(null);
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
              Please switch to Base Mainnet.
            </p>
            <button
              onClick={() => switchChain?.({ chainId: 8453 })}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-xl transition"
            >
              Switch to Base Mainnet
            </button>
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
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Badge level will be randomly assigned: Diamond (10%), Gold (30%), Silver (60%)
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border-2 border-purple-200 dark:border-purple-800">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🎲</div>
                <h3 className="font-bold text-lg">Random Badge Rarity</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Your badge will be automatically generated with a random rarity level!
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">💎</div>
                  <div className="font-bold text-blue-400">Diamond</div>
                  <div className="text-xs text-gray-500">10% chance</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🥇</div>
                  <div className="font-bold text-yellow-500">Gold</div>
                  <div className="text-xs text-gray-500">30% chance</div>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🥈</div>
                  <div className="font-bold text-gray-400">Silver</div>
                  <div className="text-xs text-gray-500">60% chance</div>
                </div>
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
              Your badge will be randomly generated and uploaded to IPFS
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { CONTRACTS, VIBEBADGE_ABI, DEV_ADDRESS } from '@/lib/contracts';
import { formatEther } from 'viem';
import { generateBadgeSVG, generateBadgeMetadata, type BadgeLevel } from '@/lib/badgeGenerator';
import { uploadSVGToPinata, uploadToPinata, ipfsToHttps } from '@/lib/pinata';
import { useMiniAppContext } from '@/hooks/useMiniAppContext';
import { FarcasterProfile } from '@/components/FarcasterProfile';

export default function MintPage() {
  const [eventName, setEventName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mintedBadgeUrl, setMintedBadgeUrl] = useState<string>('');
  const [mintedLevel, setMintedLevel] = useState<BadgeLevel | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [mintMode, setMintMode] = useState<'auto' | 'manual'>('auto');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { isMiniApp, isLoading: miniAppLoading, context } = useMiniAppContext();
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

  // Auto-connect di mini app environment - tunggu sampai detection selesai
  useEffect(() => {
    // Jangan auto-connect kalau masih loading detection atau sudah connected
    if (miniAppLoading || isConnected) return;

    // Hanya auto-connect kalau benar-benar di mini app environment
    if (isMiniApp && connectors.length > 0) {
      console.log('🔌 Mini App detected, auto-connecting Farcaster wallet...');
      const farcasterConnector = connectors.find(c => c.name === 'Farcaster');
      if (farcasterConnector) {
        try {
          connect({ connector: farcasterConnector });
          console.log('✅ Farcaster wallet connecting...');
        } catch (err) {
          console.error('❌ Auto-connect failed:', err);
        }
      }
    }
  }, [isMiniApp, miniAppLoading, isConnected, connectors, connect]);

  // Track mint activity when transaction succeeds
  useEffect(() => {
    console.log('🔍 Track activity effect triggered:', { isSuccess, address, hash });
    
    if (isSuccess && address) {
      console.log('✅ Conditions met: isSuccess=true, address exists');
      const trackMint = async () => {
        try {
          console.log('📊 START: Tracking mint for address:', address);
          const response = await fetch('/api/track-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: address,
              actionType: 'mint',
            }),
          });
          const data = await response.json();
          console.log('📊 API Response status:', response.status);
          console.log('📊 API Response data:', data);
          if (response.ok) {
            console.log('✅ Mint activity tracked successfully:', data);
          } else {
            console.error('❌ Track mint failed:', response.status, data);
          }
        } catch (error) {
          console.error('❌ Track mint error:', error);
        }
      };
      trackMint();
    } else {
      console.log('⚠️ Conditions not met for tracking:', { isSuccess, hasAddress: !!address });
    }
  }, [isSuccess, address, hash]);

  const handleShare = () => {
    const levelEmoji = mintedLevel === 'DIAMOND' ? '💎' : mintedLevel === 'GOLD' ? '🥇' : '🥈';
    const rarity = mintedLevel === 'DIAMOND' ? 'Legendary' : mintedLevel === 'GOLD' ? 'Rare' : 'Common';
    const text = `🎉 Just minted a ${levelEmoji} ${mintedLevel} badge on VibeBadge!\n\n✨ Rarity: ${rarity}\n🎫 Event: ${eventName}\n\nMint your own badge now! 🚀`;
    const url = 'https://app.vibepas.xyz/mint';
    
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (PNG, JPG, GIF, WebP, or SVG)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleManualMint = async () => {
    if (!address || !contractAddress || totalCost === undefined || !eventName.trim() || !selectedFile) return;
    
    setIsUploading(true);
    setUploadError(null);

    try {
      console.log('📤 Starting manual mint with file:', { 
        name: selectedFile.name, 
        size: selectedFile.size, 
        type: selectedFile.type 
      });

      // 1. Upload user's image to Pinata
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      console.log('📤 Uploading to /api/upload-file...');
      const uploadRes = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Upload response status:', uploadRes.status);

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        console.error('❌ Upload failed:', errorData);
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const { ipfsUrl: imageIpfsUrl } = await uploadRes.json();
      console.log('✅ Image uploaded to IPFS:', imageIpfsUrl);
      setMintedBadgeUrl(imageIpfsUrl);
      
      // 2. Generate metadata for custom badge
      const metadata = {
        name: eventName,
        description: description || `Custom badge for ${eventName}. Official VibeBadge NFT minted on Base.`,
        image: imageIpfsUrl,
        external_url: 'https://app.vibepas.xyz',
        attributes: [
          { trait_type: 'Type', value: 'Custom' },
          { trait_type: 'Creator', value: address },
          { trait_type: 'Event', value: eventName },
          { trait_type: 'Mint Date', value: new Date().toISOString() },
          { trait_type: 'Contract', value: 'VibeBadge Official' },
          { trait_type: 'Network', value: 'Base' },
        ],
      };
      
      console.log('📤 Uploading metadata to IPFS...');
      // 3. Upload metadata to Pinata
      const metadataIpfsUrl = await uploadToPinata(metadata, `${eventName}-custom-metadata.json`);
      console.log('✅ Metadata uploaded to IPFS:', metadataIpfsUrl);
      
      // 4. Mint NFT with metadata URI
      console.log('🎨 Minting NFT...');
      writeContract({
        address: contractAddress,
        abi: VIBEBADGE_ABI,
        functionName: 'mintBadge',
        args: [address, metadataIpfsUrl],
        value: totalCost,
      });
    } catch (err: any) {
      console.error('❌ Upload/Mint error:', err);
      setUploadError(err.message || 'Failed to upload badge to IPFS');
      setIsUploading(false);
    }
  };

  const handleMint = async () => {
    if (!address || !contractAddress || totalCost === undefined || !eventName.trim()) {
      console.error('❌ Mint failed: missing required fields', { 
        address, 
        contractAddress, 
        totalCost, 
        eventName 
      });
      return;
    }
    
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
      console.error('❌ Mint error:', err);
      setUploadError(err.message || 'Failed to upload badge to IPFS');
      setIsUploading(false);
    }
  };

  if (isSuccess) {
    const explorerUrl = `${CONTRACTS[8453]?.explorer}/tx/${hash}`;
    return (
      <div className="min-h-screen bg-black">
        <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-lg sticky top-0 z-50">
          <div className="mobile-container">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                🎫 VibeBadge
              </Link>
              <div className="flex items-center gap-3 ml-auto">
                <FarcasterProfile />
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
          </div>
        </nav>

        <div className="mobile-container py-12 text-center animate-fade-in">
          <div className="text-6xl sm:text-7xl mb-6">🎉</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-purple-400">Minting Successful!</h1>
          
          {mintedLevel && (
            <div className="mb-8">
              <div className={`inline-block px-8 py-4 rounded-2xl font-bold text-2xl sm:text-3xl shadow-2xl ${
                mintedLevel === 'DIAMOND' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white animate-pulse' :
                mintedLevel === 'GOLD' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse' :
                'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
              }`}>
                {mintedLevel === 'DIAMOND' ? '💎 DIAMOND' : mintedLevel === 'GOLD' ? '🥇 GOLD' : '🥈 SILVER'}
              </div>
              <p className="mt-4 text-gray-400 text-sm">
                {mintedLevel === 'DIAMOND' ? '🔥 Legendary! (10% chance)' : 
                 mintedLevel === 'GOLD' ? '✨ Rare! (30% chance)' : 
                 'Common (60% chance)'}
              </p>
            </div>
          )}
          
          <p className="text-gray-400 mb-8 px-4">
            Your badge is now in your wallet! 🎊
          </p>
          
          <div className="flex flex-col gap-3 max-w-md mx-auto px-4">
            <button
              onClick={handleShare}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="text-xl">🔗</span>
              <span>{shareSuccess ? 'Shared!' : 'Share My Badge'}</span>
            </button>
            {mintedBadgeUrl && (
              <a
                href={ipfsToHttps(mintedBadgeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-button-primary"
              >
                🖼️ View Badge Image
              </a>
            )}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-button-primary"
            >
              📜 View on BaseScan
            </a>
            <Link href="/badges" className="mobile-button-secondary">
              🎫 View My Badges
            </Link>
            <button
              onClick={() => {
                setEventName('');
                setMintedBadgeUrl('');
                setMintedLevel(null);
                setUploadError(null);
                setShareSuccess(false);
                window.location.reload();
              }}
              className="mobile-button bg-gray-800 text-gray-300 border-2 border-gray-700 hover:bg-gray-700"
            >
              ✨ Mint Another
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
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
      </div>
    );
  }

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
                <Link href="/mint" className="text-purple-400 font-semibold text-sm">
                  Mint
                </Link>
                <Link href="/badges" className="text-gray-300 hover:text-purple-400 transition text-sm">
                  Badges
                </Link>
                <Link href="/stats" className="text-gray-300 hover:text-purple-400 transition text-sm">
                  Stats
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FarcasterProfile />
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
        </div>
      </nav>

      <div className="mobile-container py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-purple-400">🎨 Mint Your Badge</h1>

        {!isConnected ? (
          <div className="mobile-card max-w-md mx-auto text-center p-8 sm:p-12 animate-fade-in">
            <div className="text-6xl mb-6">🔌</div>
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Connect Wallet</h2>
            <p className="text-gray-400 mb-8 text-sm">
              {isMiniApp ? 'Connecting to your wallet...' : 'Connect your wallet to mint a badge'}
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
        ) : !isValidChain ? (
          <div className="mobile-card max-w-md mx-auto text-center p-8 sm:p-12 animate-fade-in">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Wrong Network</h2>
            <p className="text-gray-400 mb-8 text-sm">
              Please switch to Base Mainnet
            </p>
            <button
              onClick={() => switchChain?.({ chainId: 8453 })}
              className="mobile-button-primary w-full"
            >
              Switch to Base
            </button>
          </div>
        ) : (
          <div className="mobile-card max-w-2xl mx-auto animate-fade-in">
            {/* Mode Selector Tabs */}
            <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setMintMode('auto')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  mintMode === 'auto'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="text-xl mr-2">🎲</span>
                Auto Generate
              </button>
              <button
                onClick={() => setMintMode('manual')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  mintMode === 'manual'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="text-xl mr-2">📤</span>
                Upload Custom
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-purple-400 mb-3">
                {mintMode === 'auto' ? 'Event Name' : 'Badge Name'}
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder={mintMode === 'auto' ? 'e.g., Web3 Summit 2025' : 'e.g., My Custom Badge'}
                className="w-full px-4 py-3 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-gray-800 text-white placeholder-gray-500 transition"
              />
            </div>

            {mintMode === 'manual' && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-purple-400 mb-3">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your badge..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-gray-800 text-white placeholder-gray-500 transition resize-none"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-purple-400 mb-3">
                    Upload Image
                  </label>
                  <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 hover:border-purple-500 transition">
                    {!filePreview ? (
                      <label className="cursor-pointer block text-center">
                        <div className="text-6xl mb-4">🖼️</div>
                        <p className="text-gray-400 mb-2">Click to upload image</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP or SVG (Max 10MB)</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="relative">
                        <img 
                          src={filePreview} 
                          alt="Preview" 
                          className="w-full h-64 object-contain rounded-lg mb-4"
                        />
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setFilePreview(null);
                          }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-semibold transition"
                        >
                          Remove
                        </button>
                        <p className="text-sm text-gray-400 text-center">
                          {selectedFile?.name} ({(selectedFile!.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {mintMode === 'auto' && (
              <>
                <p className="mt-3 text-xs text-gray-500 mb-6">
                  🎲 Badge rarity assigned randomly: Diamond (10%), Gold (30%), Silver (60%)
                </p>

                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 mb-6 border-2 border-purple-700/50">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎲</div>
                    <h3 className="font-bold text-lg text-purple-400">Random Rarity</h3>
                    <p className="text-sm text-gray-400 mt-2">
                      Your badge will be auto-generated with random rarity!
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                      <div className="text-2xl mb-1">💎</div>
                      <div className="font-bold text-blue-400 text-sm">Diamond</div>
                      <div className="text-xs text-gray-500">10%</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                      <div className="text-2xl mb-1">🥇</div>
                      <div className="font-bold text-yellow-500 text-sm">Gold</div>
                      <div className="text-xs text-gray-500">30%</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                      <div className="text-2xl mb-1">🥈</div>
                      <div className="font-bold text-gray-400 text-sm">Silver</div>
                      <div className="text-xs text-gray-500">60%</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {uploadError && (
              <div className="bg-red-900/20 border-2 border-red-800 rounded-xl p-4 mb-6 animate-fade-in">
                <p className="text-red-400 text-sm">
                  ❌ {uploadError}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border-2 border-red-800 rounded-xl p-4 mb-6 animate-fade-in">
                <p className="text-red-400 text-sm">
                  ❌ {error.message}
                </p>
              </div>
            )}

            {(isConfirming || isUploading) && (
              <div className="bg-blue-900/20 border-2 border-blue-800 rounded-xl p-6 mb-6 text-center animate-fade-in">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mb-3"></div>
                <p className="text-blue-400 text-sm font-medium">
                  {isUploading ? '📤 Uploading to IPFS...' : '⏳ Confirming transaction...'}
                </p>
              </div>
            )}

            {/* Security Info Box */}
            <div className="bg-purple-900/10 border border-purple-800/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">🛡️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-400 text-sm mb-1">
                    Safe Transaction
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Your wallet may show a warning about this transaction. This is normal for NFT minting. 
                    VibeBadge uses a verified smart contract on Base Network.{' '}
                    <a 
                      href={`${CONTRACTS[8453]?.explorer}/address/${contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      View Contract
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={mintMode === 'auto' ? handleMint : handleManualMint}
              disabled={
                !eventName.trim() || 
                isPending || 
                isConfirming || 
                isUploading ||
                (mintMode === 'manual' && !selectedFile)
              }
              className="mobile-button-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? '📤 Uploading...' : 
               isPending || isConfirming ? '⏳ Minting...' : 
               mintMode === 'auto' ? '✨ Generate & Mint Badge' : '🚀 Upload & Mint Badge'}
            </button>

            <p className="mt-4 text-xs text-center text-gray-500">
              {mintMode === 'auto' 
                ? '🎨 Your badge will be randomly generated and uploaded to IPFS' 
                : '📤 Upload your own artwork to mint as an NFT badge'}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Link href="/mint" className="flex flex-col items-center py-3 text-purple-400 font-medium">
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
          <Link href="/stats" className="flex flex-col items-center py-3 text-gray-400 hover:text-purple-400 transition">
            <span className="text-2xl mb-1">📊</span>
            <span className="text-xs">Stats</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

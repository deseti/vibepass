'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, VIBEBADGE_ABI, DEV_ADDRESS } from '@/lib/contracts';
import { formatEther } from 'viem';
import { useMiniAppContext } from '@/hooks/useMiniAppContext';

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isMiniApp } = useMiniAppContext();
  const [showConnectors, setShowConnectors] = useState(false);
  
  const contractAddress = CONTRACTS[8453]?.address;
  const isOwner = address?.toLowerCase() === DEV_ADDRESS.toLowerCase();

  // Read contract balance
  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    address: contractAddress,
    abi: VIBEBADGE_ABI,
    functionName: 'getContractBalance',
  });

  // Read owner
  const { data: ownerAddress } = useReadContract({
    address: contractAddress,
    abi: VIBEBADGE_ABI,
    functionName: 'owner',
  });

  // Withdraw function
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      // Refetch balance after successful withdrawal
      setTimeout(() => {
        refetchBalance();
      }, 2000);
    }
  }, [isSuccess, refetchBalance]);

  const handleWithdraw = () => {
    if (!contractAddress) return;
    writeContract({
      address: contractAddress,
      abi: VIBEBADGE_ABI,
      functionName: 'withdraw',
    });
  };

  const balanceInEth = contractBalance ? formatEther(contractBalance) : '0';

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
                <Link href="/checkin" className="text-gray-300 hover:text-purple-400 transition text-sm">
                  Check-In
                </Link>
                <Link href="/stats" className="text-gray-300 hover:text-purple-400 transition text-sm">
                  Stats
                </Link>
                {isOwner && (
                  <Link href="/admin" className="text-purple-400 font-semibold text-sm">
                    Admin
                  </Link>
                )}
              </div>
            </div>
            {!isMiniApp && (
              <div className="relative">
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:block text-xs text-gray-400">
                      {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                    </div>
                    <button
                      onClick={() => disconnect()}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition active:scale-95"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowConnectors(!showConnectors)}
                      className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition active:scale-95"
                    >
                      Connect Wallet
                    </button>
                    
                    {showConnectors && (
                      <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 p-2">
                        <div className="text-xs text-gray-400 px-3 py-2 font-semibold">Select Wallet</div>
                        {connectors.map((connector) => (
                          <button
                            key={connector.id}
                            onClick={() => {
                              connect({ connector });
                              setShowConnectors(false);
                            }}
                            className="w-full text-left px-3 py-3 hover:bg-gray-700 rounded-lg transition flex items-center gap-3"
                          >
                            <span className="text-2xl">
                              {connector.name.toLowerCase().includes('coinbase') ? '🔵' : 
                               connector.name.toLowerCase().includes('farcaster') ? '💜' : '🦊'}
                            </span>
                            <div>
                              <div className="text-white text-sm font-medium">{connector.name}</div>
                              <div className="text-gray-400 text-xs">{connector.id}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="mobile-container py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-purple-400">👑 Admin Panel</h1>

        {!isConnected ? (
          <div className="mobile-card max-w-md mx-auto text-center p-8 sm:p-12 animate-fade-in">
            <div className="text-6xl mb-6">🔌</div>
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Connect Wallet</h2>
            <p className="text-gray-400 mb-8 text-sm">
              Connect your dev wallet to access admin panel
            </p>
            {!isMiniApp && (
              <div className="space-y-3">
                <div className="text-xs text-gray-500 mb-4">Choose your wallet:</div>
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => connect({ connector })}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition active:scale-95 flex items-center justify-center gap-3"
                  >
                    <span className="text-2xl">
                      {connector.name.toLowerCase().includes('coinbase') ? '🔵' : 
                       connector.name.toLowerCase().includes('farcaster') ? '💜' : '🦊'}
                    </span>
                    <span>{connector.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : !isOwner ? (
          <div className="mobile-card max-w-md mx-auto text-center p-8 sm:p-12 animate-fade-in">
            <div className="text-6xl mb-6">🚫</div>
            <h2 className="text-2xl font-bold mb-4 text-red-400">Access Denied</h2>
            <p className="text-gray-400 mb-4 text-sm">
              You are not authorized to access this page
            </p>
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="text-xs text-gray-500 mb-2">Your Address:</div>
              <code className="text-xs text-purple-400 break-all">{address}</code>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="text-xs text-gray-500 mb-2">Owner Address:</div>
              <code className="text-xs text-green-400 break-all">{ownerAddress as string}</code>
            </div>
            <Link href="/" className="mobile-button-secondary inline-block">
              ← Back to Home
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto animate-fade-in">
            {/* Contract Balance Card */}
            <div className="mobile-card p-8 text-center mb-6">
              <div className="text-6xl mb-4">💰</div>
              <h2 className="text-xl font-bold mb-2 text-purple-400">Contract Balance</h2>
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
                {balanceInEth}
              </div>
              <div className="text-sm text-gray-500">ETH</div>
              <div className="text-xs text-gray-500 mt-2">
                Available to withdraw
              </div>
            </div>

            {/* Withdraw Section */}
            <div className="mobile-card p-8 mb-6">
              {isSuccess ? (
                <div className="text-center animate-fade-in">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold mb-2 text-green-400">Withdrawal Successful!</h2>
                  <p className="text-gray-400 mb-4">
                    Funds have been transferred to your wallet
                  </p>
                  <a
                    href={`${CONTRACTS[8453].explorer}/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    View Transaction →
                  </a>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold mb-4 text-purple-400 text-center">💸 Withdraw Funds</h3>
                  <p className="text-gray-400 text-sm mb-6 text-center">
                    Transfer all contract balance to your dev wallet
                  </p>

                  {error && (
                    <div className="bg-red-900/20 border-2 border-red-800 rounded-xl p-4 mb-4">
                      <p className="text-red-400 text-sm">❌ {error.message}</p>
                    </div>
                  )}

                  {(isPending || isConfirming) && (
                    <div className="bg-blue-900/20 border-2 border-blue-800 rounded-xl p-6 mb-4 text-center">
                      <div className="animate-spin inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mb-3"></div>
                      <p className="text-blue-400 text-sm font-medium">
                        {isPending ? '⏳ Confirming transaction...' : '⏳ Processing withdrawal...'}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleWithdraw}
                    disabled={isPending || isConfirming || Number(balanceInEth) === 0}
                    className="mobile-button-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending || isConfirming ? '⏳ Processing...' : `💸 Withdraw ${balanceInEth} ETH`}
                  </button>

                  {Number(balanceInEth) === 0 && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                      No funds available to withdraw
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="mobile-card p-6">
                <h4 className="font-bold mb-3 text-purple-400 text-sm">� Connected Wallet</h4>
                <code className="text-xs bg-gray-800 px-2 py-1 rounded block overflow-x-auto text-blue-400 mb-2">
                  {address}
                </code>
                <div className="text-xs text-green-400 mt-2">✅ Owner Verified</div>
              </div>

              <div className="mobile-card p-6">
                <h4 className="font-bold mb-3 text-purple-400 text-sm">👤 Contract Owner</h4>
                <code className="text-xs bg-gray-800 px-2 py-1 rounded block overflow-x-auto text-green-400">
                  {ownerAddress as string}
                </code>
              </div>

              <div className="mobile-card p-6">
                <h4 className="font-bold mb-3 text-purple-400 text-sm">📜 Contract Address</h4>
                <code className="text-xs bg-gray-800 px-2 py-1 rounded block overflow-x-auto text-purple-400">
                  {contractAddress}
                </code>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mobile-card p-6 mb-6">
              <h4 className="font-bold mb-4 text-purple-400 text-sm">🔗 Quick Links</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`${CONTRACTS[8453].explorer}/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition flex items-center justify-between group"
                >
                  <span className="text-sm text-white">View Contract on BaseScan</span>
                  <span className="text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
                </a>
                <a
                  href={`${CONTRACTS[8453].explorer}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition flex items-center justify-between group"
                >
                  <span className="text-sm text-white">View Your Wallet on BaseScan</span>
                  <span className="text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>

            {/* Warning */}
            <div className="mobile-card p-6 mt-6 border-2 border-yellow-700/50">
              <h4 className="font-bold mb-3 text-yellow-400 text-sm flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                Important Notes
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>• Only contract owner can withdraw funds</li>
                <li>• All mint payments accumulate in the contract</li>
                <li>• Withdrawal transfers entire balance to dev address</li>
                <li>• Transaction requires gas fees (paid by you)</li>
                <li>• Always verify transaction details before confirming</li>
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

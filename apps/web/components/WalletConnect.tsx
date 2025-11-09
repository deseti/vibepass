import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { SiweMessage } from 'siwe';

/**
 * WalletConnect Component
 * 
 * Handles wallet connection and SIWE (Sign-In with Ethereum) authentication flow:
 * 1. Connect to MetaMask/Coinbase Wallet
 * 2. Fetch nonce from backend
 * 3. Create and sign SIWE message
 * 4. Verify signature on backend
 * 5. Establish authenticated session
 * 
 * Supports Base network (Chain ID: 8453 mainnet, 84532 testnet)
 */

interface WalletConnectProps {
  onConnect: (address: string) => void;
  className?: string;
}

export default function WalletConnect({
  onConnect,
  className = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors',
}: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  // Base network configuration
  const BASE_CHAIN_ID = 8453; // Mainnet
  // const BASE_CHAIN_ID = 84532; // Testnet (Sepolia)

  const BASE_MAINNET_CONFIG = {
    chainId: '0x2105', // 8453 in hex
    chainName: 'Base',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
  };

  /**
   * Check if wallet is already connected on mount
   */
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setAddress(userAddress);
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  /**
   * Connect wallet and perform SIWE authentication
   */
  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if MetaMask/Coinbase Wallet is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error(
          'No wallet detected. Please install MetaMask or Coinbase Wallet.'
        );
      }

      // Request account access
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);

      // Get network
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      // Switch to Base if on wrong network
      if (currentChainId !== BASE_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_MAINNET_CONFIG.chainId }],
          });
        } catch (switchError: any) {
          // Chain not added to wallet, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [BASE_MAINNET_CONFIG],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Get signer and address
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      setAddress(userAddress);

      // Perform SIWE authentication
      await performSIWE(userAddress, provider);

      // Notify parent component
      onConnect(userAddress);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Perform Sign-In with Ethereum (SIWE) flow
   */
  const performSIWE = async (userAddress: string, provider: BrowserProvider) => {
    try {
      // Step 1: Get nonce from backend
      const nonceResponse = await fetch('/api/siwe/nonce');
      if (!nonceResponse.ok) {
        throw new Error('Failed to fetch nonce');
      }
      const { nonce } = await nonceResponse.json();

      // Step 2: Create SIWE message
      const domain = window.location.host;
      const origin = window.location.origin;

      const siweMessage = new SiweMessage({
        domain,
        address: userAddress,
        statement: 'Sign in to VibePass to manage your event badges.',
        uri: origin,
        version: '1',
        chainId: BASE_CHAIN_ID,
        nonce,
      });

      const messageToSign = siweMessage.prepareMessage();

      // Step 3: Request signature from wallet
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(messageToSign);

      // Step 4: Verify signature on backend
      const verifyResponse = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSign,
          signature,
        }),
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(error.error || 'Verification failed');
      }

      const { success } = await verifyResponse.json();
      if (!success) {
        throw new Error('Authentication failed');
      }

      console.log('✅ SIWE authentication successful');
    } catch (err: any) {
      console.error('SIWE error:', err);
      throw new Error(`Authentication failed: ${err.message}`);
    }
  };

  /**
   * Disconnect wallet
   */
  const disconnect = () => {
    setAddress(null);
    setError(null);
    // Note: MetaMask doesn't have a disconnect method
    // User needs to disconnect from wallet extension
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {!address ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className={className}
          aria-label="Connect Wallet"
        >
          {isConnecting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Connecting...
            </span>
          ) : (
            'Connect Wallet'
          )}
        </button>
      ) : (
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          aria-label="Disconnect Wallet"
        >
          Disconnect
        </button>
      )}

      {error && (
        <div
          className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * TypeScript augmentation for window.ethereum
 */
declare global {
  interface Window {
    ethereum?: any;
  }
}

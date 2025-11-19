'use client';

import { WagmiProvider, createConfig, http, useConnect, useAccount } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { coinbaseWallet } from 'wagmi/connectors';
import { useState, useEffect } from 'react';
import { useMiniAppContext } from '../hooks/useMiniAppContext';

// Create connectors separately to handle potential incompatibilities
const farcasterConnector = farcasterMiniApp();
const coinbaseConnector = coinbaseWallet({
  appName: 'VibeBadge',
  appLogoUrl: 'https://app.vibepas.xyz/icon.png',
});

const config = createConfig({
  chains: [base],
  connectors: [
    farcasterConnector,
    coinbaseConnector,
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  ssr: false,
});

// Auto-connect component untuk Farcaster Mini App
function AutoConnectFarcaster() {
  const { isMiniApp, isLoading, context } = useMiniAppContext();
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    // Coba connect ke Farcaster jika di mini app, belum connected, dan belum pernah coba
    if (isMiniApp && !isLoading && context && !isConnected && !hasAttempted) {
      // Find Farcaster connector by checking both id dan name
      const farcasterConnector = connectors.find(
        (c) => 
          c.id === 'farcaster' || 
          c.id === 'farcasterMiniApp' ||
          c.name?.toLowerCase?.().includes('farcaster')
      );

      if (farcasterConnector) {
        try {
          console.log('🔌 Attempting to connect Farcaster wallet...');
          connect({ connector: farcasterConnector });
          setHasAttempted(true);
        } catch (error) {
          console.error('❌ Farcaster connect error:', error);
          setHasAttempted(true);
          // Try Coinbase as fallback
          const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWallet');
          if (coinbaseConnector) {
            console.log('📱 Fallback: Trying Coinbase Wallet...');
            try {
              connect({ connector: coinbaseConnector });
            } catch (cbError) {
              console.error('❌ Coinbase fallback failed:', cbError);
            }
          }
        }
      } else {
        console.warn('⚠️ Farcaster connector not found in:', connectors.map(c => ({ id: c.id, name: c.name })));
        setHasAttempted(true);
      }
    }
  }, [isMiniApp, isLoading, isConnected, hasAttempted, connect, connectors, context]);

  return null;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Buat QueryClient baru setiap render untuk avoid stale data
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Disable caching untuk avoid data nyangkut antar user
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
      },
    },
  }));

  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <AutoConnectFarcaster />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

'use client';

import { WagmiProvider, createConfig, http, useConnect, useAccount } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { coinbaseWallet } from 'wagmi/connectors';
import { useState, useEffect } from 'react';
import { useMiniAppContext } from '../hooks/useMiniAppContext';

const config = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp(),
    coinbaseWallet({
      appName: 'VibeBadge',
      appLogoUrl: 'https://app.vibepas.xyz/icon.png',
    }),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  // Enable SSR mode dan fresh state setiap load
  ssr: false,
});

// Auto-connect component untuk Farcaster Mini App
function AutoConnectFarcaster() {
  const { isMiniApp, isLoading } = useMiniAppContext();
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    // Jika di Mini App, tidak loading, belum connected, dan belum pernah attempt
    if (isMiniApp && !isLoading && !isConnected && !hasAttempted) {
      console.log('🔌 Auto-connecting Farcaster wallet...');
      
      // Cari Farcaster connector
      const farcasterConnector = connectors.find(
        (c) => c.id === 'farcaster' || c.name.toLowerCase().includes('farcaster')
      );

      if (farcasterConnector) {
        try {
          connect({ connector: farcasterConnector });
          setHasAttempted(true);
          console.log('✅ Auto-connect initiated');
        } catch (error) {
          console.error('❌ Auto-connect failed:', error);
          setHasAttempted(true);
        }
      } else {
        console.warn('⚠️ Farcaster connector not found');
      }
    }
  }, [isMiniApp, isLoading, isConnected, hasAttempted, connect, connectors]);

  return null; // This component doesn't render anything
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
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <AutoConnectFarcaster />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

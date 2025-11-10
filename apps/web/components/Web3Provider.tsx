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
  const { isMiniApp, isLoading, context } = useMiniAppContext();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    console.log('🔍 AutoConnect State:', {
      isMiniApp,
      isLoading,
      isConnected,
      hasAddress: !!address,
      address: address?.substring(0, 10) + '...',
      hasAttempted,
      connectorsCount: connectors.length,
      contextLoaded: !!context
    });

    // Jika di Mini App, tidak loading, context sudah ada, belum connected, dan belum pernah attempt
    if (isMiniApp && !isLoading && context && !isConnected && !hasAttempted) {
      console.log('🔌 Auto-connecting Farcaster wallet...');
      
      // Tunggu sebentar untuk memastikan SDK benar-benar siap
      setTimeout(() => {
        // Cari Farcaster connector
        const farcasterConnector = connectors.find(
          (c) => c.id === 'farcaster' || c.name.toLowerCase().includes('farcaster')
        );

        console.log('🔍 Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })));

        if (farcasterConnector) {
          try {
            console.log('✅ Found Farcaster connector, attempting connect...');
            connect({ connector: farcasterConnector });
            setHasAttempted(true);
          } catch (error) {
            console.error('❌ Auto-connect failed:', error);
            setHasAttempted(true);
          }
        } else {
          console.warn('⚠️ Farcaster connector not found in connectors list');
          setHasAttempted(true);
        }
      }, 500); // Delay 500ms untuk memastikan SDK siap
    }

    // Log jika sudah connected
    if (isConnected && address) {
      console.log('✅ Wallet Connected:', {
        address: address.substring(0, 10) + '...',
        isMiniApp
      });
    }
  }, [isMiniApp, isLoading, isConnected, address, hasAttempted, connect, connectors, context]);

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

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
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    // Berdasarkan dokumentasi: "If a user already has a connected wallet the connector will automatically connect to it"
    // Jadi kita hanya perlu trigger connect jika belum connected
    if (isMiniApp && !isLoading && context && !isConnected && !hasAttempted) {
      // Cari Farcaster connector
      const farcasterConnector = connectors.find(
        (c) => c.id === 'farcaster' || c.name.toLowerCase().includes('farcaster')
      );

      if (farcasterConnector) {
        // Trigger connect - akan otomatis connect ke wallet yang sudah connected
        try {
          connect({ connector: farcasterConnector });
          setHasAttempted(true);
          console.log('✅ Farcaster wallet connected');
        } catch (error) {
          console.error('❌ Farcaster connect failed:', error);
          setHasAttempted(true);
        }
      } else {
        console.warn('⚠️ Farcaster connector not found');
        setHasAttempted(true);
      }
    }
  }, [isMiniApp, isLoading, isConnected, address, hasAttempted, connect, connectors, context, connector]);

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

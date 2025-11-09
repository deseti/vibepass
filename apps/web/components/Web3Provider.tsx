'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { coinbaseWallet } from 'wagmi/connectors';
import { useState } from 'react';

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
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

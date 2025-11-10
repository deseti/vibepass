'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function useMiniAppContext() {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ethProvider, setEthProvider] = useState<any>(null);

  useEffect(() => {
    const checkMiniApp = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp();
        setIsMiniApp(isInMiniApp);

        if (isInMiniApp) {
          const miniAppContext = await sdk.context;
          setContext(miniAppContext);
          
          // Get Ethereum Provider dari SDK
          const provider = sdk.wallet.ethProvider;
          setEthProvider(provider);

          console.log('🎫 Farcaster Mini App Context:', {
            fid: miniAppContext?.user?.fid,
            username: miniAppContext?.user?.username,
            displayName: miniAppContext?.user?.displayName,
            platformType: miniAppContext?.client?.platformType,
            clientFid: miniAppContext?.client?.clientFid,
          });

          // Simpan FID saat ini untuk detect user change
          const currentFid = miniAppContext?.user?.fid;
          if (currentFid) {
            const storedFid = localStorage.getItem('farcaster_fid');
            
            // Kalau FID berbeda, clear state dan force disconnect
            if (storedFid && storedFid !== currentFid.toString()) {
              console.log('🔄 User changed, clearing old session...');
              
              // Clear localStorage wagmi state
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('wagmi.') || key.startsWith('wc@2')) {
                  localStorage.removeItem(key);
                }
              });
              
              // Reload page untuk fresh state
              window.location.reload();
            }
            
            // Update stored FID
            localStorage.setItem('farcaster_fid', currentFid.toString());
          }
        }
      } catch (error) {
        console.error('Error checking mini app context:', error);
        setIsMiniApp(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkMiniApp();
  }, []);

  return { isMiniApp, context, isLoading, ethProvider };
}

// Helper untuk get user info dari context
export function useUserFromContext() {
  const { context, isMiniApp } = useMiniAppContext();

  return {
    fid: context?.user?.fid,
    username: context?.user?.username,
    displayName: context?.user?.displayName,
    pfpUrl: context?.user?.pfpUrl,
    bio: context?.user?.bio,
    location: context?.user?.location,
    isMiniApp,
  };
}

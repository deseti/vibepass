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
        console.log('🔍 Checking if running in Mini App...');
        const isInMiniApp = await sdk.isInMiniApp();
        console.log('📱 Is Mini App:', isInMiniApp);
        setIsMiniApp(isInMiniApp);

        if (isInMiniApp) {
          console.log('📡 Fetching Mini App context...');
          const miniAppContext = await sdk.context;
          setContext(miniAppContext);
          
          // Get Ethereum Provider dari SDK
          const provider = sdk.wallet.ethProvider;
          setEthProvider(provider);

          console.log('🎫 Farcaster Mini App Context:', {
            fid: miniAppContext?.user?.fid,
            username: miniAppContext?.user?.username,
            displayName: miniAppContext?.user?.displayName,
            pfpUrl: miniAppContext?.user?.pfpUrl,
            platformType: miniAppContext?.client?.platformType,
            clientFid: miniAppContext?.client?.clientFid,
            hasEthProvider: !!provider
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
            console.log('✅ FID saved:', currentFid);
          } else {
            console.warn('⚠️ No FID found in context');
          }
        } else {
          console.log('🌐 Running in regular web browser (not Mini App)');
        }
      } catch (error) {
        console.error('❌ Error checking mini app context:', error);
        setIsMiniApp(false);
      } finally {
        setIsLoading(false);
        console.log('✅ Mini App context check complete');
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

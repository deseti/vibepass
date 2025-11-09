'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function useMiniAppContext() {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMiniApp = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp();
        setIsMiniApp(isInMiniApp);

        if (isInMiniApp) {
          const miniAppContext = await sdk.context;
          setContext(miniAppContext);
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

  return { isMiniApp, context, isLoading };
}

// Helper untuk get user info dari context
export function useUserFromContext() {
  const { context, isMiniApp } = useMiniAppContext();

  return {
    fid: context?.user?.fid,
    username: context?.user?.username,
    displayName: context?.user?.displayName,
    pfpUrl: context?.user?.pfpUrl,
    isMiniApp,
  };
}

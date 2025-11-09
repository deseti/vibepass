'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function MiniAppInit() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initMiniApp = async () => {
      try {
        // Check if we're in a mini app environment
        const isMiniApp = await sdk.isInMiniApp();
        
        if (isMiniApp) {
          // Hide splash screen once app is loaded
          await sdk.actions.ready();
          console.log('✅ Mini App initialized and ready');
        }
        
        setIsReady(true);
      } catch (error) {
        console.error('❌ Mini App init error:', error);
        setIsReady(true); // Continue anyway for web fallback
      }
    };

    initMiniApp();
  }, []);

  // Don't render anything, this is just for initialization
  return null;
}

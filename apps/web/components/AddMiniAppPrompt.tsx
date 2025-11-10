'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useMiniAppContext } from '@/hooks/useMiniAppContext';

export default function AddMiniAppPrompt() {
  const { isMiniApp, context } = useMiniAppContext();
  const [isAdded, setIsAdded] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // Check if app is already added to user's account
    if (isMiniApp && context) {
      const checkIfAdded = async () => {
        try {
          // Check localStorage to see if we've shown this before
          const hasSeenPrompt = localStorage.getItem('vibepass_add_miniapp_seen');
          
          // If context.client exists and has addedBy property, the app is already added
          // Otherwise, we should prompt the user
          const isAppAdded = context.client?.addedBy !== undefined;
          
          setIsAdded(isAppAdded);
          
          // Show prompt if app is not added and user hasn't dismissed it before
          if (!isAppAdded && !hasSeenPrompt) {
            setShowPrompt(true);
            // Add padding to body when prompt is shown
            document.body.style.paddingTop = '80px';
          }
        } catch (error) {
          console.error('Error checking if app is added:', error);
        }
      };

      checkIfAdded();
    }

    // Cleanup function
    return () => {
      if (showPrompt) {
        document.body.style.paddingTop = '0px';
      }
    };
  }, [isMiniApp, context]);

  const handleAddMiniApp = async () => {
    try {
      setIsAdding(true);
      await sdk.actions.addMiniApp();
      console.log('✅ Mini app added successfully');
      setIsAdded(true);
      setShowPrompt(false);
      document.body.style.paddingTop = '0px';
      localStorage.setItem('vibepass_add_miniapp_seen', 'true');
    } catch (error: any) {
      console.error('❌ Failed to add mini app:', error);
      
      if (error.message?.includes('RejectedByUser')) {
        console.log('User rejected adding the mini app');
        // User rejected, hide prompt for this session
        setShowPrompt(false);
        document.body.style.paddingTop = '0px';
        localStorage.setItem('vibepass_add_miniapp_seen', 'true');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    document.body.style.paddingTop = '0px';
    // Remember that user has seen and dismissed the prompt
    localStorage.setItem('vibepass_add_miniapp_seen', 'true');
  };

  // Don't render if not in miniapp, app is already added, or prompt is hidden
  if (!isMiniApp || isAdded || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] p-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-xl animate-slide-down">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm sm:text-base">
              Add VibePass to Your Apps
            </p>
            <p className="text-xs sm:text-sm text-white/90 mt-0.5">
              Quick access to mint badges, check-in, and track your stats
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleAddMiniApp}
            disabled={isAdding}
            className="px-4 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
          >
            {isAdding ? 'Adding...' : 'Add App'}
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

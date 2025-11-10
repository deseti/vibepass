'use client';

import { useAccount, useConnect } from 'wagmi';
import { useMiniAppContext, useUserFromContext } from '../hooks/useMiniAppContext';
import { useState } from 'react';

export function DebugInfo() {
  const [isVisible, setIsVisible] = useState(false);
  const { address, isConnected, connector } = useAccount();
  const { connectors } = useConnect();
  const { isMiniApp, isLoading, context } = useMiniAppContext();
  const userContext = useUserFromContext();

  // Only show in dev mode or mini app
  if (!isMiniApp && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-mono shadow-lg hover:bg-purple-700 transition"
      >
        🐛 Debug
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-gray-900 border border-purple-500 rounded-lg p-4 shadow-2xl w-80 max-h-96 overflow-y-auto text-xs font-mono">
          <div className="space-y-2">
            <div className="text-purple-400 font-bold mb-2">🔍 Connection State</div>
            
            <div>
              <span className="text-gray-400">Mini App:</span>
              <span className={`ml-2 ${isMiniApp ? 'text-green-400' : 'text-red-400'}`}>
                {isMiniApp ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Loading:</span>
              <span className={`ml-2 ${isLoading ? 'text-yellow-400' : 'text-green-400'}`}>
                {isLoading ? '⏳ Yes' : '✅ No'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Connected:</span>
              <span className={`ml-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Address:</span>
              <span className="ml-2 text-blue-400 break-all">
                {address ? address.substring(0, 10) + '...' + address.substring(address.length - 8) : '❌ null'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Connector:</span>
              <span className="ml-2 text-purple-400">
                {connector?.name || '❌ none'}
              </span>
            </div>
            
            <div className="text-purple-400 font-bold mt-3 mb-2">👤 Farcaster Context</div>
            
            <div>
              <span className="text-gray-400">FID:</span>
              <span className="ml-2 text-green-400">
                {userContext.fid || '❌ null'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Username:</span>
              <span className="ml-2 text-blue-400">
                {userContext.username || '❌ null'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Display Name:</span>
              <span className="ml-2 text-purple-400">
                {userContext.displayName || '❌ null'}
              </span>
            </div>
            
            <div className="text-purple-400 font-bold mt-3 mb-2">🔌 Available Connectors</div>
            
            {connectors.map((c, i) => (
              <div key={i} className="ml-2">
                <span className="text-gray-400">{i + 1}.</span>
                <span className="ml-2 text-yellow-400">{c.name}</span>
                <span className="ml-2 text-gray-500 text-xs">({c.id})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

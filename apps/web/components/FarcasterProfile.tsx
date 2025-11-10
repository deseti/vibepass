'use client';

import { useUserFromContext } from '../hooks/useMiniAppContext';
import { useAccount } from 'wagmi';

export function FarcasterProfile() {
  const { fid, username, displayName, pfpUrl, isMiniApp } = useUserFromContext();
  const { isConnected } = useAccount();

  // Only show if in mini app and connected
  if (!isMiniApp || !isConnected || !fid) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
      {pfpUrl && (
        <img
          src={pfpUrl}
          alt={displayName || username || 'Profile'}
          className="w-8 h-8 rounded-full border-2 border-purple-500/50"
        />
      )}
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white">
          {displayName || username || `User ${fid}`}
        </span>
        <span className="text-xs text-gray-400">
          @{username || 'unknown'} · FID: {fid}
        </span>
      </div>
    </div>
  );
}

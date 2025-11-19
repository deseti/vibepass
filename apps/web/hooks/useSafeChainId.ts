'use client';

import { useChainId, useAccount } from 'wagmi';
import { base } from 'wagmi/chains';

/**
 * Safe wrapper around useChainId that handles Farcaster connector compatibility
 * Falls back to Base (8453) if chainId is undefined or connector doesn't support getChainId
 */
export function useSafeChainId(): number {
  const { connector } = useAccount();
  const chainId = useChainId();
  
  // If chainId is undefined or 0, default to Base Mainnet
  if (!chainId || chainId === 0) {
    console.warn('⚠️ ChainId undefined, defaulting to Base Mainnet (8453)');
    return base.id; // 8453
  }
  
  // Check if connector properly supports getChainId
  if (connector && typeof connector.getChainId !== 'function') {
    console.warn('⚠️ Connector does not implement getChainId, using default Base (8453)');
    return base.id; // 8453
  }
  
  return chainId;
}

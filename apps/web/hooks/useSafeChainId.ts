'use client';

import { useChainId as useWagmiChainId } from 'wagmi';

/**
 * Wrapper around useChainId that defaults to Base (8453) if the connector doesn't properly implement getChainId
 * This is needed for Farcaster Mini App connector compatibility
 */
export function useSafeChainId(): number {
  try {
    const chainId = useWagmiChainId();
    return chainId || 8453;
  } catch (error) {
    // Farcaster connector may not properly implement getChainId
    console.warn('⚠️ Failed to get chainId, defaulting to Base Mainnet (8453)');
    return 8453;
  }
}

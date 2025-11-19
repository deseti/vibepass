'use client';

import { useAccount } from 'wagmi';
import { base } from 'wagmi/chains';

/**
 * Safe chainId getter that works with Farcaster Mini App connector
 * 
 * Problem: Farcaster connector's getChainId() is not a function or throws errors
 * Solution: Get chainId directly from account.chain, default to Base (8453)
 * 
 * This avoids calling connector.getChainId() which is buggy in Farcaster connector
 */
export function useSafeChainId(): number {
  const { chain, connector } = useAccount();
  
  // Priority 1: Get from connected chain (most reliable)
  if (chain?.id) {
    return chain.id;
  }
  
  // Priority 2: Check if connector name suggests Farcaster
  if (connector?.name?.toLowerCase().includes('farcaster')) {
    // Farcaster Mini App always runs on Base
    console.log('🔵 Farcaster connector detected, using Base (8453)');
    return base.id;
  }
  
  // Priority 3: Default to Base Mainnet for safety
  console.warn('⚠️ No chain detected, defaulting to Base (8453)');
  return base.id;
}

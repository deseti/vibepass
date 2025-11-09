/**
 * Gasless Transaction Relayer Service
 * 
 * Allows users to mint badges without paying gas fees.
 * The relayer (contract owner) pays gas on behalf of users.
 * 
 * ⚠️  PRODUCTION SECURITY WARNING ⚠️
 * 
 * 1. NEVER commit private keys to git
 * 2. Use AWS KMS, HashiCorp Vault, or similar for key management
 * 3. Implement rate limiting per wallet address
 * 4. Add authentication/authorization checks
 * 5. Monitor relayer wallet balance and alert when low
 * 6. Use multi-sig or governance for relayer key rotation
 * 7. Implement transaction simulation before broadcasting
 * 8. Add replay protection with nonces
 * 9. Set gas price limits to prevent griefing
 * 10. Log all transactions for audit trail
 * 
 * Setup:
 * 1. Create dedicated relayer wallet
 * 2. Fund it with ETH on Base
 * 3. Set RELAYER_PRIVATE_KEY in environment (use secrets manager)
 * 4. Deploy with restricted access (VPC, IP whitelist)
 */

import { ethers, Wallet, Provider } from 'ethers';
import type { VibeBadge } from '../typechain-types/contracts/VibeBadge';

// Environment configuration
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';
const CONTRACT_ADDRESS = process.env.VIBEBADGE_CONTRACT_ADDRESS;

// Rate limiting: max mints per wallet per day
const RATE_LIMIT_PER_DAY = 10;
const mintCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Mint request interface
 */
export interface MintRequest {
  to: string; // Recipient address
  tokenURI: string; // IPFS metadata URL
  signature?: string; // Optional: user signature for verification
  nonce?: string; // Replay protection
}

/**
 * Initialize relayer wallet and provider
 */
function getRelayer(): { wallet: Wallet; provider: Provider; contract: VibeBadge } {
  if (!RELAYER_PRIVATE_KEY) {
    throw new Error('RELAYER_PRIVATE_KEY not configured');
  }

  if (!CONTRACT_ADDRESS) {
    throw new Error('VIBEBADGE_CONTRACT_ADDRESS not configured');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(RELAYER_PRIVATE_KEY, provider);

  // Load contract ABI (import from typechain)
  const contractABI = [
    'function mintBadge(address to, string memory tokenURI) public onlyOwner returns (uint256)',
    'function owner() public view returns (address)',
    'function getNextTokenId() public view returns (uint256)',
  ];

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    contractABI,
    wallet
  ) as unknown as VibeBadge;

  return { wallet, provider, contract };
}

/**
 * Check rate limit for wallet address
 */
function checkRateLimit(address: string): boolean {
  const now = Date.now();
  const record = mintCounts.get(address.toLowerCase());

  if (!record) {
    return true; // First request
  }

  // Reset counter if 24 hours have passed
  if (now > record.resetTime) {
    mintCounts.delete(address.toLowerCase());
    return true;
  }

  return record.count < RATE_LIMIT_PER_DAY;
}

/**
 * Update rate limit counter
 */
function updateRateLimit(address: string): void {
  const now = Date.now();
  const resetTime = now + 24 * 60 * 60 * 1000; // 24 hours from now
  const record = mintCounts.get(address.toLowerCase());

  if (!record || now > record.resetTime) {
    mintCounts.set(address.toLowerCase(), { count: 1, resetTime });
  } else {
    record.count++;
  }
}

/**
 * Relay a mint transaction
 * 
 * @param request - Mint request details
 * @returns Transaction receipt and minted token ID
 * 
 * @example
 * const result = await relayMint({
 *   to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
 *   tokenURI: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
 * });
 * console.log(`Minted token #${result.tokenId}`);
 */
export async function relayMint(request: MintRequest): Promise<{
  success: boolean;
  transactionHash?: string;
  tokenId?: number;
  error?: string;
}> {
  try {
    const { to, tokenURI, nonce } = request;

    // Validation
    if (!ethers.isAddress(to)) {
      return { success: false, error: 'Invalid recipient address' };
    }

    if (!tokenURI || !tokenURI.startsWith('ipfs://')) {
      return { success: false, error: 'Invalid tokenURI format' };
    }

    // Rate limiting
    if (!checkRateLimit(to)) {
      return {
        success: false,
        error: `Rate limit exceeded. Max ${RATE_LIMIT_PER_DAY} mints per day.`,
      };
    }

    // TODO: Verify nonce to prevent replay attacks
    // if (nonce) {
    //   const nonceUsed = await redis.get(`relay-nonce:${nonce}`);
    //   if (nonceUsed) {
    //     return { success: false, error: 'Nonce already used' };
    //   }
    // }

    // TODO: Optional - Verify user signature
    // if (request.signature) {
    //   const message = `Mint badge to ${to} with URI ${tokenURI} nonce ${nonce}`;
    //   const signer = ethers.verifyMessage(message, request.signature);
    //   if (signer.toLowerCase() !== to.toLowerCase()) {
    //     return { success: false, error: 'Invalid signature' };
    //   }
    // }

    // Initialize relayer
    const { wallet, contract } = getRelayer();

    // Check relayer balance
    const balance = await wallet.provider!.getBalance(wallet.address);
    const minBalance = ethers.parseEther('0.01'); // Alert threshold

    if (balance < minBalance) {
      console.error('⚠️  Relayer balance low:', ethers.formatEther(balance));
      // TODO: Send alert to monitoring system
    }

    // Get next token ID before minting
    const nextTokenId = await contract.getNextTokenId();

    // Estimate gas
    const gasEstimate = await contract.mintBadge.estimateGas(to, tokenURI);
    const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer

    // Set gas price with limit to prevent griefing
    const feeData = await wallet.provider!.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits('100', 'gwei');
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei');

    // Cap gas price at reasonable limit
    const MAX_FEE_LIMIT = ethers.parseUnits('500', 'gwei');
    if (maxFeePerGas > MAX_FEE_LIMIT) {
      return { success: false, error: 'Gas price too high, try again later' };
    }

    console.log('🔄 Relaying mint transaction...', {
      to,
      tokenId: nextTokenId.toString(),
      gasLimit: gasLimit.toString(),
      maxFeePerGas: ethers.formatUnits(maxFeePerGas, 'gwei') + ' gwei',
    });

    // Execute mint transaction
    const tx = await contract.mintBadge(to, tokenURI, {
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

    console.log('⏳ Transaction submitted:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      return { success: false, error: 'Transaction failed' };
    }

    // Update rate limit
    updateRateLimit(to);

    // TODO: Mark nonce as used
    // if (nonce) {
    //   await redis.setex(`relay-nonce:${nonce}`, 86400, '1');
    // }

    // TODO: Log to database for audit
    // await db.query(`
    //   INSERT INTO relay_transactions (tx_hash, recipient, token_id, token_uri, gas_used, timestamp)
    //   VALUES ($1, $2, $3, $4, $5, NOW())
    // `, [receipt.hash, to, nextTokenId.toString(), tokenURI, receipt.gasUsed.toString()]);

    console.log('✅ Mint successful:', {
      txHash: receipt.hash,
      tokenId: nextTokenId.toString(),
      gasUsed: receipt.gasUsed.toString(),
    });

    return {
      success: true,
      transactionHash: receipt.hash,
      tokenId: Number(nextTokenId),
    };
  } catch (error: any) {
    console.error('❌ Relay mint error:', error);
    return {
      success: false,
      error: error.message || 'Failed to relay transaction',
    };
  }
}

/**
 * Batch relay multiple mints
 * 
 * @param requests - Array of mint requests
 * @returns Array of results
 */
export async function relayBatchMint(
  requests: MintRequest[]
): Promise<Array<{
  success: boolean;
  transactionHash?: string;
  tokenId?: number;
  error?: string;
}>> {
  const results = [];

  for (const request of requests) {
    const result = await relayMint(request);
    results.push(result);

    // Add delay between transactions to avoid nonce conflicts
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return results;
}

/**
 * Get relayer status
 */
export async function getRelayerStatus(): Promise<{
  address: string;
  balance: string;
  isOwner: boolean;
  chainId: number;
}> {
  const { wallet, provider, contract } = getRelayer();

  const balance = await provider.getBalance(wallet.address);
  const owner = await contract.owner();
  const network = await provider.getNetwork();

  return {
    address: wallet.address,
    balance: ethers.formatEther(balance),
    isOwner: wallet.address.toLowerCase() === owner.toLowerCase(),
    chainId: Number(network.chainId),
  };
}

/**
 * Usage Example:
 * 
 * // In your API endpoint
 * import { relayMint } from '../services/relayer';
 * 
 * app.post('/api/relay/mint', async (req, res) => {
 *   const { to, tokenURI } = req.body;
 *   
 *   // TODO: Add authentication check
 *   // const session = await getSession(req);
 *   // if (!session) return res.status(401).json({ error: 'Unauthorized' });
 *   
 *   const result = await relayMint({ to, tokenURI });
 *   
 *   if (result.success) {
 *     res.json({
 *       success: true,
 *       tokenId: result.tokenId,
 *       transactionHash: result.transactionHash
 *     });
 *   } else {
 *     res.status(400).json({ error: result.error });
 *   }
 * });
 */

export default {
  relayMint,
  relayBatchMint,
  getRelayerStatus,
};

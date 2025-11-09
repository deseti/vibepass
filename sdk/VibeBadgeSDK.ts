/**
 * VibeBadge SDK - Frontend Integration
 * 
 * Easy-to-use SDK for integrating VibeBadge NFT minting into your React/Next.js app
 */

import { ethers } from 'ethers';

// Contract ABIs (minimal functions needed)
const VIBEBADGE_ABI = [
  "function mintBadge(address to, string memory uri) public payable returns (uint256)",
  "function batchMint(address to, string[] memory uris) public payable returns (uint256[] memory)",
  "function mintPrice() public view returns (uint256)",
  "function getTotalMintCost() public view returns (uint256)",
  "function devAddress() public view returns (address)",
  "function FEE_PERCENTAGE() public view returns (uint256)",
  "function getNextTokenId() public view returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "function balanceOf(address owner) public view returns (uint256)",
  "event BadgeMinted(address indexed to, uint256 indexed tokenId, string tokenURI)",
  "event DevFeeCollected(address indexed from, address indexed devAddress, uint256 amount)"
];

// Network configurations
export const NETWORKS = {
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia Testnet',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    contractAddress: '0xf0FCf8630fdA34593F3a00a41BD553Bd610c2644'
  },
  baseMainnet: {
    chainId: 8453,
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    contractAddress: '0xaCF8105456d400b128Ca6fC739A20c7178d50767'
  }
};

export type NetworkType = keyof typeof NETWORKS;

export interface MintResult {
  tokenId: string;
  transactionHash: string;
  explorerUrl: string;
  success: boolean;
  error?: string;
}

export interface ContractInfo {
  mintPrice: string; // in ETH
  totalCost: string; // in ETH (with 3% fee)
  feePercentage: string;
  devAddress: string;
  nextTokenId: string;
}

export class VibeBadgeSDK {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider;
  private contract: any; // Use any to avoid type issues with ethers v6
  private network: typeof NETWORKS[NetworkType];
  private signer?: ethers.Signer;

  constructor(network: NetworkType = 'baseMainnet', customProvider?: any) {
    this.network = NETWORKS[network];
    
    if (customProvider) {
      // Use custom provider (e.g., MetaMask)
      this.provider = new ethers.BrowserProvider(customProvider);
    } else {
      // Use read-only provider
      this.provider = new ethers.JsonRpcProvider(this.network.rpcUrl);
    }

    this.contract = new ethers.Contract(
      this.network.contractAddress,
      VIBEBADGE_ABI,
      this.provider
    );
  }

  /**
   * Connect wallet and get signer for transactions
   */
  async connectWallet(): Promise<string> {
    if (!(this.provider instanceof ethers.BrowserProvider)) {
      throw new Error('Browser provider required for wallet connection');
    }

    const signer = await this.provider.getSigner();
    this.signer = signer;
    this.contract = this.contract.connect(signer);
    
    const address = await signer.getAddress();
    return address;
  }

  /**
   * Get contract information
   */
  async getContractInfo(): Promise<ContractInfo> {
    const [mintPrice, totalCost, feePercentage, devAddress, nextTokenId] = await Promise.all([
      this.contract.mintPrice(),
      this.contract.getTotalMintCost(),
      this.contract.FEE_PERCENTAGE(),
      this.contract.devAddress(),
      this.contract.getNextTokenId()
    ]);

    return {
      mintPrice: ethers.formatEther(mintPrice),
      totalCost: ethers.formatEther(totalCost),
      feePercentage: feePercentage.toString(),
      devAddress,
      nextTokenId: nextTokenId.toString()
    };
  }

  /**
   * Mint a single badge
   */
  async mintBadge(to: string, tokenURI: string): Promise<MintResult> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Call connectWallet() first.');
      }

      // Get total cost
      const totalCost = await this.contract.getTotalMintCost();

      // Send transaction
      const tx = await this.contract.mintBadge(to, tokenURI, {
        value: totalCost
      });

      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      // Parse events to get token ID
      let tokenId = '';
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          if (parsed && parsed.name === 'BadgeMinted') {
            tokenId = parsed.args.tokenId.toString();
          }
        } catch (e) {
          // Skip unparseable logs
        }
      }

      return {
        tokenId,
        transactionHash: tx.hash,
        explorerUrl: `${this.network.explorerUrl}/tx/${tx.hash}`,
        success: true
      };
    } catch (error: any) {
      console.error('Mint failed:', error);
      return {
        tokenId: '',
        transactionHash: '',
        explorerUrl: '',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch mint multiple badges
   */
  async batchMint(to: string, tokenURIs: string[]): Promise<MintResult> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Call connectWallet() first.');
      }

      // Calculate total cost
      const costPerBadge = await this.contract.getTotalMintCost();
      const totalCost = costPerBadge * BigInt(tokenURIs.length);

      // Send transaction
      const tx = await this.contract.batchMint(to, tokenURIs, {
        value: totalCost
      });

      console.log('Batch mint transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      return {
        tokenId: `${tokenURIs.length} badges`,
        transactionHash: tx.hash,
        explorerUrl: `${this.network.explorerUrl}/tx/${tx.hash}`,
        success: true
      };
    } catch (error: any) {
      console.error('Batch mint failed:', error);
      return {
        tokenId: '',
        transactionHash: '',
        explorerUrl: '',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get badge info
   */
  async getBadgeInfo(tokenId: string): Promise<{
    owner: string;
    tokenURI: string;
  }> {
    const [owner, tokenURI] = await Promise.all([
      this.contract.ownerOf(tokenId),
      this.contract.tokenURI(tokenId)
    ]);

    return { owner, tokenURI };
  }

  /**
   * Get user's badge count
   */
  async getUserBadgeCount(address: string): Promise<string> {
    const balance = await this.contract.balanceOf(address);
    return balance.toString();
  }

  /**
   * Check if user is connected to correct network
   */
  async checkNetwork(): Promise<boolean> {
    if (!(this.provider instanceof ethers.BrowserProvider)) {
      return true; // Read-only provider always correct
    }

    const network = await this.provider.getNetwork();
    return Number(network.chainId) === this.network.chainId;
  }

  /**
   * Switch to correct network
   */
  async switchNetwork(): Promise<boolean> {
    if (!(this.provider instanceof ethers.BrowserProvider)) {
      throw new Error('Cannot switch network on read-only provider');
    }

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${this.network.chainId.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
      // Network not added, try to add it
      if (error.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${this.network.chainId.toString(16)}`,
              chainName: this.network.name,
              rpcUrls: [this.network.rpcUrl],
              blockExplorerUrls: [this.network.explorerUrl]
            }]
          });
          return true;
        } catch (addError) {
          console.error('Failed to add network:', addError);
          return false;
        }
      }
      console.error('Failed to switch network:', error);
      return false;
    }
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return this.network;
  }
}

// Export for easy use
export default VibeBadgeSDK;

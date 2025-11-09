# VibeBadge Frontend Integration Guide

## 🚀 Quick Start

### Installation

```bash
npm install ethers
```

### Basic Usage

```typescript
import { VibeBadgeSDK } from './sdk/VibeBadgeSDK';

// Initialize SDK (mainnet)
const sdk = new VibeBadgeSDK('baseMainnet', window.ethereum);

// Connect wallet
const address = await sdk.connectWallet();
console.log('Connected:', address);

// Get contract info
const info = await sdk.getContractInfo();
console.log('Mint price:', info.mintPrice, 'ETH');
console.log('Total cost:', info.totalCost, 'ETH (includes 3% fee)');

// Mint a badge
const result = await sdk.mintBadge(
  address,
  'ipfs://QmYourMetadataHash/metadata.json'
);

if (result.success) {
  console.log('Minted token ID:', result.tokenId);
  console.log('View on explorer:', result.explorerUrl);
}
```

---

## 📱 React Integration

### 1. Install Dependencies

```bash
npm install ethers wagmi viem
```

### 2. Create Hook

```typescript
// hooks/useVibeBadge.ts
import { useState, useEffect } from 'react';
import { VibeBadgeSDK } from '../sdk/VibeBadgeSDK';
import { useAccount, useProvider } from 'wagmi';

export function useVibeBadge() {
  const { address, isConnected } = useAccount();
  const provider = useProvider();
  const [sdk, setSdk] = useState<VibeBadgeSDK | null>(null);
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && provider) {
      const vibeBadge = new VibeBadgeSDK('baseMainnet', provider);
      setSdk(vibeBadge);
      
      // Load contract info
      vibeBadge.getContractInfo().then(setContractInfo);
    }
  }, [isConnected, provider]);

  const mintBadge = async (tokenURI: string) => {
    if (!sdk || !address) return;
    
    setLoading(true);
    try {
      await sdk.connectWallet();
      const result = await sdk.mintBadge(address, tokenURI);
      return result;
    } finally {
      setLoading(false);
    }
  };

  return {
    sdk,
    contractInfo,
    mintBadge,
    loading,
    isConnected
  };
}
```

### 3. Create Component

```typescript
// components/MintBadge.tsx
import { useState } from 'react';
import { useVibeBadge } from '../hooks/useVibeBadge';

export function MintBadge() {
  const { contractInfo, mintBadge, loading, isConnected } = useVibeBadge();
  const [tokenURI, setTokenURI] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleMint = async () => {
    const mintResult = await mintBadge(tokenURI);
    setResult(mintResult);
  };

  if (!isConnected) {
    return <div>Please connect your wallet</div>;
  }

  return (
    <div className="mint-container">
      <h2>Mint VibeBadge NFT</h2>
      
      {contractInfo && (
        <div className="info">
          <p>Mint Price: {contractInfo.mintPrice} ETH</p>
          <p>Total Cost: {contractInfo.totalCost} ETH (includes 3% fee)</p>
          <p>Next Token ID: {contractInfo.nextTokenId}</p>
        </div>
      )}

      <input
        type="text"
        placeholder="Token URI (IPFS link)"
        value={tokenURI}
        onChange={(e) => setTokenURI(e.target.value)}
      />

      <button onClick={handleMint} disabled={loading || !tokenURI}>
        {loading ? 'Minting...' : 'Mint Badge'}
      </button>

      {result && (
        <div className={result.success ? 'success' : 'error'}>
          {result.success ? (
            <>
              <p>✅ Minted Token ID: {result.tokenId}</p>
              <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer">
                View on BaseScan
              </a>
            </>
          ) : (
            <p>❌ Error: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🔗 Next.js Integration

### 1. API Route for Backend Minting

```typescript
// pages/api/mint-badge.ts
import { ethers } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';

const VIBEBADGE_ABI = [
  "function mintBadge(address to, string memory uri) public payable returns (uint256)",
  "function getTotalMintCost() public view returns (uint256)"
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, tokenURI } = req.body;

  if (!to || !tokenURI) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    // Connect to contract
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS_MAINNET!,
      VIBEBADGE_ABI,
      wallet
    );

    // Get total cost
    const totalCost = await contract.getTotalMintCost();

    // Mint badge
    const tx = await contract.mintBadge(to, tokenURI, {
      value: totalCost
    });

    const receipt = await tx.wait();

    res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      explorerUrl: `https://basescan.org/tx/${tx.hash}`
    });
  } catch (error: any) {
    console.error('Mint error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### 2. Frontend Page

```typescript
// pages/mint.tsx
import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function MintPage() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleMint = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const response = await fetch('/api/mint-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: address,
          tokenURI: `ipfs://QmYourHash/${address}.json`
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Mint VibeBadge</h1>
      <button onClick={handleMint} disabled={loading || !address}>
        {loading ? 'Minting...' : 'Mint My Badge'}
      </button>

      {result && (
        <div>
          {result.success ? (
            <a href={result.explorerUrl} target="_blank">
              ✅ View Transaction
            </a>
          ) : (
            <p>❌ {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🔒 Environment Variables

Create `.env.local` for Next.js:

```bash
# Contract addresses
CONTRACT_ADDRESS_MAINNET=0xaCF8105456d400b128Ca6fC739A20c7178d50767
CONTRACT_ADDRESS_SEPOLIA=0xf0FCf8630fdA34593F3a00a41BD553Bd610c2644

# Private key for backend minting (if needed)
PRIVATE_KEY=your_private_key_here

# Network RPC URLs
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
```

---

## 📊 Cost Calculator Component

```typescript
// components/CostCalculator.tsx
import { useEffect, useState } from 'react';
import { VibeBadgeSDK } from '../sdk/VibeBadgeSDK';

export function CostCalculator({ numBadges = 1 }: { numBadges?: number }) {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    const sdk = new VibeBadgeSDK('baseMainnet');
    sdk.getContractInfo().then(setInfo);
  }, []);

  if (!info) return <div>Loading...</div>;

  const totalCost = (parseFloat(info.totalCost) * numBadges).toFixed(6);
  const mintPrice = (parseFloat(info.mintPrice) * numBadges).toFixed(6);
  const fee = (totalCost - mintPrice).toFixed(6);

  return (
    <div className="cost-calculator">
      <h3>Cost for {numBadges} badge{numBadges > 1 ? 's' : ''}</h3>
      <table>
        <tr>
          <td>Mint Price:</td>
          <td>{mintPrice} ETH</td>
        </tr>
        <tr>
          <td>Fee (3%):</td>
          <td>{fee} ETH</td>
        </tr>
        <tr>
          <td><strong>Total:</strong></td>
          <td><strong>{totalCost} ETH</strong></td>
        </tr>
      </table>
    </div>
  );
}
```

---

## 🎨 Example: Complete Mint Form

```typescript
import { useState } from 'react';
import { useVibeBadge } from '../hooks/useVibeBadge';
import { CostCalculator } from './CostCalculator';

export function CompleteMintForm() {
  const { mintBadge, loading, contractInfo } = useVibeBadge();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Upload metadata to IPFS
    const metadata = {
      name: formData.name,
      description: formData.description,
      image: formData.image,
      attributes: [
        { trait_type: "Event", value: "VibePass 2025" },
        { trait_type: "Date", value: new Date().toISOString() }
      ]
    };

    // TODO: Upload to IPFS (use pinata/nft.storage)
    const tokenURI = 'ipfs://QmYourHash/metadata.json';

    // 2. Mint badge
    const result = await mintBadge(tokenURI);
    
    if (result.success) {
      alert('Badge minted successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Your Badge</h2>

      <CostCalculator numBadges={1} />

      <input
        type="text"
        placeholder="Badge Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        required
      />

      <input
        type="text"
        placeholder="Image URL"
        value={formData.image}
        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Minting...' : `Mint Badge (${contractInfo?.totalCost} ETH)`}
      </button>
    </form>
  );
}
```

---

## 📱 Mobile Wallet Support

```typescript
// utils/walletConnect.ts
import { WalletConnectConnector } from '@wagmi/connectors/walletConnect';
import { createConfig, configureChains } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [base, baseSepolia],
  [publicProvider()]
);

const connector = new WalletConnectConnector({
  chains,
  options: {
    projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  },
});

export const config = createConfig({
  autoConnect: true,
  connectors: [connector],
  publicClient,
});
```

---

## 🔍 Event Listening

```typescript
// Listen for mint events
sdk.contract.on('BadgeMinted', (to, tokenId, tokenURI) => {
  console.log('New badge minted!');
  console.log('To:', to);
  console.log('Token ID:', tokenId.toString());
  console.log('URI:', tokenURI);
  
  // Update UI, send notification, etc.
});

// Listen for fee collection events
sdk.contract.on('DevFeeCollected', (from, devAddress, amount) => {
  console.log('Fee collected!');
  console.log('From:', from);
  console.log('Amount:', ethers.formatEther(amount), 'ETH');
});
```

---

## 🚀 Ready to Deploy!

1. Copy SDK to your project: `sdk/VibeBadgeSDK.ts`
2. Install dependencies: `npm install ethers`
3. Follow integration examples above
4. Test on testnet first (Base Sepolia)
5. Deploy to production with mainnet contract

**Contract Addresses:**
- Mainnet: `0xaCF8105456d400b128Ca6fC739A20c7178d50767`
- Testnet: `0xf0FCf8630fdA34593F3a00a41BD553Bd610c2644`

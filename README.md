# VibeBadge Project - README

## 🎯 Project Overview

VibeBadge adalah NFT smart contract untuk event attendance badges dengan automatic payment system langsung ke developer address.

### Key Features

- ✅ **ERC-721 NFT** Standard
- ✅ **Automatic Payment** - 100% payment langsung ke dev address
- ✅ **3% System Fee** - Included dalam total cost
- ✅ **Batch Minting** - Mint multiple badges sekaligus
- ✅ **Base Network** - Deploy di Base L2 (low fees)
- ✅ **Verified Contract** - Source code verified on BaseScan

---

## 📦 Installation

```bash
# Clone repository
git clone <repo-url>
cd vibepass

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan private key dan settings
```

---

## 🚀 Quick Start

### 1. Compile Contract

```bash
npm run compile
```

### 2. Run Tests

```bash
npm test
```

### 3. Deploy to Testnet

```bash
# Get testnet ETH dari https://www.alchemy.com/faucets/base-sepolia
npm run deploy:sepolia
```

### 4. Deploy to Mainnet

```bash
# Pastikan sudah ada ETH di wallet
npm run deploy:mainnet
```

### 5. Verify Contract

```bash
npm run verify:mainnet <CONTRACT_ADDRESS> "<DEV_ADDRESS>" "<MINT_PRICE>"
```

---

## 📝 Contract Addresses

### Mainnet (Base)
- **Contract:** `0xaCF8105456d400b128Ca6fC739A20c7178d50767`
- **Network:** Base Mainnet (Chain ID: 8453)
- **Explorer:** https://basescan.org/address/0xaCF8105456d400b128Ca6fC739A20c7178d50767

### Testnet (Base Sepolia)
- **Contract:** `0xf0FCf8630fdA34593F3a00a41BD553Bd610c2644`
- **Network:** Base Sepolia (Chain ID: 84532)
- **Explorer:** https://sepolia.basescan.org/address/0xf0FCf8630fdA34593F3a00a41BD553Bd610c2644

---

## 💰 Fee Structure

```
User Payment = Mint Price + 3% Fee

Example:
├─ Mint Price:  0.001 ETH  ($1.00)
├─ Fee (3%):    0.00003 ETH ($0.03)
└─ Total Cost:  0.00103 ETH ($1.03)

Payment Flow:
User → Contract → Dev Address (100%)
Contract Balance: 0 ETH
```

**Key Points:**
- ✅ 100% payment langsung ke dev address
- ✅ 0% tertahan di contract
- ✅ No withdrawal needed (automatic)

---

## 🎨 Frontend Integration

### Install SDK

```bash
npm install ethers
```

### Basic Usage

```typescript
import { VibeBadgeSDK } from './sdk/VibeBadgeSDK';

// Initialize
const sdk = new VibeBadgeSDK('baseMainnet', window.ethereum);

// Connect wallet
const address = await sdk.connectWallet();

// Get info
const info = await sdk.getContractInfo();
console.log('Total cost:', info.totalCost, 'ETH');

// Mint badge
const result = await sdk.mintBadge(
  address,
  'ipfs://QmYourHash/metadata.json'
);
```

📖 **Full Integration Guide:** [docs/FRONTEND_INTEGRATION.md](./docs/FRONTEND_INTEGRATION.md)

---

## 📊 Monitoring

### Real-time Event Monitoring

```bash
# Monitor mainnet mints
npm run monitor

# Monitor testnet mints
npm run monitor:testnet
```

Monitor akan menampilkan:
- 🎉 New badge mints
- 💰 Fee collections
- 📊 Total statistics

---

## 📚 Documentation

- **Complete Documentation:** [docs/COMPLETE_DOCUMENTATION.md](./docs/COMPLETE_DOCUMENTATION.md)
- **Frontend Integration:** [docs/FRONTEND_INTEGRATION.md](./docs/FRONTEND_INTEGRATION.md)
- **Fee Structure:** [docs/FEE_STRUCTURE.md](./docs/FEE_STRUCTURE.md)
- **Smart Contract:** [contracts/VibeBadge.sol](./contracts/VibeBadge.sol)

---

## 🛠️ Available Scripts

```bash
# Development
npm run compile          # Compile contracts
npm test                 # Run tests
npm run clean           # Clean artifacts

# Deployment
npm run deploy:sepolia  # Deploy to testnet
npm run deploy:mainnet  # Deploy to mainnet

# Verification
npm run verify:sepolia  # Verify on testnet
npm run verify:mainnet  # Verify on mainnet

# Testing
npm run test:mint       # Test mint on testnet

# Monitoring
npm run monitor         # Monitor mainnet events
npm run monitor:testnet # Monitor testnet events
```

---

## 🔒 Security

### Best Practices

1. **Never commit private keys**
   - Use `.env` file (already in `.gitignore`)
   - Use hardware wallet for mainnet

2. **Test on testnet first**
   - Always deploy and test on Base Sepolia
   - Verify payment flow works correctly

3. **Verify contract on BaseScan**
   - Makes code transparent and auditable
   - Builds trust with users

4. **Keep dependencies updated**
   ```bash
   npm audit
   npm update
   ```

---

## 📞 Support & Contact

- **GitHub:** [Repository URL]
- **Documentation:** [Docs URL]
- **Email:** [Your Email]
- **Discord:** [Discord Server]

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details

---

## 🎉 Status

### Testnet
- ✅ Deployed
- ✅ Verified
- ✅ Tested (2 badges minted)
- ✅ Payment flow confirmed

### Mainnet
- ✅ Deployed
- ✅ Verified
- ✅ Ready for production

**Version:** 1.0.0  
**Last Updated:** November 8, 2025  
**Status:** 🚀 Production Ready

---

## 🚀 Next Steps

1. ✅ **Smart Contract** - Deployed & Verified
2. 🔄 **Frontend Integration** - Use SDK provided
3. 📊 **Monitoring** - Setup event listeners
4. 📱 **Mobile App** - Integrate with React Native
5. 🎨 **UI/UX** - Build user-friendly interface
6. 📣 **Marketing** - Launch campaign
7. 🔐 **Security Audit** - Optional third-party audit

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

**Built with ❤️ for the Web3 community**

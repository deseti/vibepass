# VibePass Deployment Guide - Base Sepolia Testnet

## 📋 Prerequisites

1. **Get Base Sepolia Testnet ETH**
   - Visit: https://www.alchemy.com/faucets/base-sepolia
   - Enter your wallet address
   - Request testnet ETH (you'll need ~0.01 ETH for deployment)

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   ```
   PRIVATE_KEY=your_private_key_here_without_0x
   DEV_ADDRESS=0xfacA089a60508744703EC9FfBc9AdaFACeD94621
   MINT_PRICE=1000000000000000
   BASESCAN_API_KEY=your_api_key_optional
   ```

## 🚀 Deploy to Base Sepolia Testnet

### Step 1: Compile Contract
```bash
npx hardhat compile
```

### Step 2: Deploy to Testnet
```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**Expected Output:**
```
🚀 Starting VibeBadge deployment with 3% dev fee...

💼 Dev Address (receives 3% fee): 0xfacA089a60508744703EC9FfBc9AdaFACeD94621
💰 Mint Price: 0.001 ETH

✅ VibeBadge deployed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Contract Address: 0x...
🔗 Transaction Hash: 0x...
📊 Dev Fee: 3%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**SAVE THE CONTRACT ADDRESS!** You'll need it for testing.

### Step 3: Verify Contract on BaseScan (Optional)
```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> "0xfacA089a60508744703EC9FfBc9AdaFACeD94621" "1000000000000000"
```

### Step 4: Test Mint with 3% Fee

Add contract address to `.env`:
```
CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

Run test mint:
```bash
npx hardhat run scripts/test-mint.ts --network baseSepolia
```

**Expected Output:**
```
🧪 Testing VibeBadge mint with 3% dev fee...

💰 Mint Price: 0.001 ETH
📊 Expected Dev Fee (3%): 0.00003 ETH

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 Dev balance BEFORE mint: X.XXX ETH
⏳ Minting badge...
✅ Transaction confirmed!
💼 Dev balance AFTER mint: X.XXX ETH
💸 Actual Dev Fee received: 0.00003 ETH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Dev fee is 3%: ✅
✓ Owner is correct: ✅
✓ URI is correct: ✅

🎉 Test completed successfully!
✅ 3% dev fee is working correctly
✅ Badge minted successfully
```

## ✅ Verification Checklist

- [ ] Contract deployed to Base Sepolia
- [ ] Contract verified on BaseScan
- [ ] Test mint successful
- [ ] 3% fee sent to dev address `0xfacA089a60508744703EC9FfBc9AdaFACeD94621`
- [ ] Badge minted to correct address
- [ ] Token URI saved correctly

## 🚀 Deploy to Base Mainnet (After Testing)

**⚠️ ONLY AFTER SUCCESSFUL TESTNET TESTING!**

### Prerequisites:
1. Get real ETH on Base Mainnet (bridge from Ethereum L1)
2. Double-check all parameters
3. Ensure dev address is correct

### Deploy:
```bash
npx hardhat run scripts/deploy.ts --network baseMainnet
```

### Verify:
```bash
npx hardhat verify --network baseMainnet <CONTRACT_ADDRESS> "0xfacA089a60508744703EC9FfBc9AdaFACeD94621" "1000000000000000"
```

## 🔍 View on Block Explorer

**Testnet:**
- https://sepolia-explorer.base.org/address/<CONTRACT_ADDRESS>

**Mainnet:**
- https://basescan.org/address/<CONTRACT_ADDRESS>

## 📊 Contract Details

- **Network:** Base (Layer 2)
- **Mint Price:** 0.001 ETH (adjustable by owner)
- **Dev Fee:** 3% of mint price
- **Dev Address:** 0xfacA089a60508744703EC9FfBc9AdaFACeD94621
- **Fee Calculation:** `devFee = (mintPrice * 3) / 100`

### Example Fee Calculation:
- Mint Price: 0.001 ETH
- Dev Fee (3%): 0.00003 ETH
- Remaining: 0.00097 ETH (stays in contract, withdrawable by owner)

## 🛠️ Post-Deployment

### Update Frontend
Update `apps/web/.env.local`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
NEXT_PUBLIC_CHAIN_ID=84532  # Testnet
# Or
NEXT_PUBLIC_CHAIN_ID=8453   # Mainnet
```

### Update Services
Update `services/relayer.ts`:
```typescript
const CONTRACT_ADDRESS = '0xYourContractAddress';
```

## 🔐 Security Notes

1. **Never commit .env file** - Already in .gitignore
2. **Use hardware wallet for mainnet** deployment
3. **Start with low mint price** on mainnet (can increase later)
4. **Monitor dev address** for fee collection
5. **Test thoroughly on testnet** before mainnet

## 📞 Support

If deployment fails:
1. Check you have enough testnet ETH
2. Verify private key is correct (without 0x prefix)
3. Check network is reachable
4. Review error messages carefully

## 🎉 Success Criteria

✅ Contract deployed successfully  
✅ Dev address receives 3% on every mint  
✅ Badge minted and owned by correct address  
✅ Token URI stored correctly  
✅ All events emitted properly  

**Ready for mainnet deployment!** 🚀

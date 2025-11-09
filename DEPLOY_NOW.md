# 🚀 Quick Start - Deploy ke Base Sepolia Testnet

## ✅ Status Kontrak

**Smart Contract VibeBadge sudah siap dengan fitur:**
- ✅ **Fee 3% ke dev address**: `0xfacA089a60508744703EC9FfBc9AdaFACeD94621`
- ✅ **Payable mint function**: User bayar mint price
- ✅ **Auto fee calculation**: `devFee = (mintPrice * 3) / 100`
- ✅ **Fee transfer on every mint**: Langsung masuk ke dev wallet
- ✅ **Refund excess payment**: Kelebihan bayar di-refund otomatis
- ✅ **Owner can withdraw 97%**: Sisa 97% bisa ditarik owner
- ✅ **12 unit tests passed**: Semua fungsi sudah diverifikasi

---

## 📋 Step-by-Step Deployment

### 1️⃣ **Setup Environment**

Buat file `.env` (copy dari `.env.example`):
```bash
cp .env.example .env
```

Edit `.env` dan isi:
```env
# Private key wallet Anda (tanpa 0x prefix)
PRIVATE_KEY=your_private_key_here

# Dev address (sudah di-set, jangan ubah)
DEV_ADDRESS=0xfacA089a60508744703EC9FfBc9AdaFACeD94621

# Mint price (0.001 ETH = 1000000000000000 wei)
MINT_PRICE=1000000000000000

# BaseScan API Key (opsional, untuk verify contract)
BASESCAN_API_KEY=
```

⚠️ **PENTING**: Jangan commit file `.env` ke git!

---

### 2️⃣ **Get Testnet ETH**

Minta testnet ETH (gratis) untuk deployment:
- 🔗 **Faucet**: https://www.alchemy.com/faucets/base-sepolia
- 💰 **Jumlah**: Request ~0.01 ETH (cukup untuk deploy + test)
- 📍 **Network**: Pilih "Base Sepolia"

Paste address wallet Anda dan klik "Send Me ETH".

---

### 3️⃣ **Compile Contract**

```bash
npm run compile
```

**Output:**
```
✓ Compiled 16 Solidity files successfully
✓ Generated 54 typings
```

---

### 4️⃣ **Deploy ke Base Sepolia**

```bash
npm run deploy:sepolia
```

**Expected Output:**
```
🚀 Starting VibeBadge deployment with 3% dev fee...

💼 Dev Address (receives 3% fee): 0xfacA089a60508744703EC9FfBc9AdaFACeD94621
💰 Mint Price: 0.001 ETH

✅ VibeBadge deployed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Contract Address: 0x1234567890abcdef... ← SAVE THIS!
🔗 Transaction Hash: 0xabc...
📊 Dev Fee: 3%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**✅ SIMPAN CONTRACT ADDRESS!** Anda butuh ini untuk testing.

---

### 5️⃣ **Verify Contract (Opsional)**

Verify contract di BaseScan explorer:
```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> "0xfacA089a60508744703EC9FfBc9AdaFACeD94621" "1000000000000000"
```

Lihat contract Anda di:
🔍 https://sepolia-explorer.base.org/address/<CONTRACT_ADDRESS>

---

### 6️⃣ **Test Mint dengan Fee 3%**

Tambahkan contract address ke `.env`:
```env
CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

Run test mint:
```bash
npm run test:mint
```

**Expected Output:**
```
🧪 Testing VibeBadge mint with 3% dev fee...

💰 Mint Price: 0.001 ETH
📊 Expected Dev Fee (3%): 0.00003 ETH

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 Dev balance BEFORE mint: 10.000000 ETH
⏳ Minting badge...
✅ Transaction confirmed!
💼 Dev balance AFTER mint: 10.000030 ETH
💸 Actual Dev Fee received: 0.00003 ETH ← 3% ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Dev fee is 3%: ✅
✓ Owner is correct: ✅
✓ URI is correct: ✅

📋 Events emitted:
   - DevFeeCollected
     From: 0xYourAddress
     To: 0xfacA089a60508744703EC9FfBc9AdaFACeD94621
     Amount: 0.00003 ETH
   - BadgeMinted
     TokenId: 1

🎉 Test completed successfully!
✅ 3% dev fee is working correctly
✅ Badge minted successfully
```

---

## ✅ Verification Checklist

Sebelum deploy ke mainnet, pastikan semua ini ✅:

- [ ] Contract deployed ke Base Sepolia testnet
- [ ] Contract address disimpan
- [ ] Test mint berhasil
- [ ] Dev address **menerima 3% fee** (cek balance before/after)
- [ ] Badge minted ke address yang benar
- [ ] Token URI tersimpan dengan benar
- [ ] Events `DevFeeCollected` dan `BadgeMinted` emitted
- [ ] Bisa verify contract di BaseScan explorer
- [ ] Owner bisa update mint price
- [ ] Owner bisa withdraw 97% balance

---

## 🎯 Fee Calculation Example

| Mint Price | Dev Fee (3%) | Contract Gets (97%) |
|------------|--------------|---------------------|
| 0.001 ETH  | 0.00003 ETH  | 0.00097 ETH        |
| 0.01 ETH   | 0.0003 ETH   | 0.0097 ETH         |
| 0.1 ETH    | 0.003 ETH    | 0.097 ETH          |
| 1 ETH      | 0.03 ETH     | 0.97 ETH           |

**Formula:** `devFee = (mintPrice * 3) / 100`

---

## 🚀 Deploy ke Mainnet (Setelah Testing Sukses)

**⚠️ HANYA LAKUKAN INI SETELAH TESTNET BERHASIL!**

1. Pastikan punya real ETH di Base Mainnet (bridge dari Ethereum L1)
2. Update `.env` dengan real private key (gunakan hardware wallet untuk produksi)
3. Deploy:
   ```bash
   npm run deploy:mainnet
   ```
4. Verify:
   ```bash
   npx hardhat verify --network baseMainnet <CONTRACT_ADDRESS> "0xfacA089a60508744703EC9FfBc9AdaFACeD94621" "1000000000000000"
   ```

---

## 📊 Monitoring Dev Wallet

Check balance dev wallet kapan saja:
```bash
# Testnet
https://sepolia-explorer.base.org/address/0xfacA089a60508744703EC9FfBc9AdaFACeD94621

# Mainnet
https://basescan.org/address/0xfacA089a60508744703EC9FfBc9AdaFACeD94621
```

Setiap mint, Anda akan lihat transaction masuk 3% dari mint price.

---

## 🆘 Troubleshooting

**Error: "insufficient funds"**
- Get more testnet ETH dari faucet

**Error: "dev address cannot be zero"**
- Check `.env` file, pastikan `DEV_ADDRESS` terisi

**Error: "insufficient payment"**
- Mint price harus minimal 0.001 ETH (atau sesuai setting)

**Fee tidak masuk ke dev wallet**
- Check transaction hash di explorer
- Verify dev address benar: `0xfacA089a60508744703EC9FfBc9AdaFACeD94621`
- Run test script untuk debug

---

## 📁 File Penting

- `contracts/VibeBadge.sol` - Smart contract dengan fee 3%
- `scripts/deploy.ts` - Deployment script
- `scripts/test-mint.ts` - Test mint script
- `test/VibeBadge.fee.test.ts` - Unit tests untuk fee (12 tests ✅)
- `.env` - Environment variables (JANGAN COMMIT!)
- `docs/DEPLOYMENT.md` - Dokumentasi lengkap

---

## 🎉 Next Steps

Setelah testnet berhasil:
1. ✅ Update frontend dengan contract address
2. ✅ Update relayer service dengan contract address
3. ✅ Update indexer untuk tracking fee events
4. ✅ Deploy ke mainnet
5. ✅ Monitor dev wallet untuk fee collection
6. ✅ Start minting badges! 🚀

---

**Happy Deploying! 🎊**

Jika ada pertanyaan atau error, check `docs/DEPLOYMENT.md` untuk detail lengkap.

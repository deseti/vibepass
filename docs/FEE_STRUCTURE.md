# 💰 VibePass Fee Structure - Updated

## 📊 Payment Model

### **User Pays:**
- **Badge Price: $1.00** (dalam ETH)
- **System Fee: 3%** (dari badge price = $0.03)
- **TOTAL: $1.03** (dalam ETH)

### **Fund Distribution:**
- **100% masuk ke Dev Address:** `0xfacA089a60508744703EC9FfBc9AdaFACeD94621`
- **Contract balance: $0** (tidak ada yang tersisa di contract)

---

## 💡 Penjelasan Struktur Pembayaran

### **Single Mint:**
```
User mint 1 badge:
├─ Badge price:  $1.00 (0.0004 ETH @ $2,500/ETH)
├─ Fee 3%:       $0.03 (0.000012 ETH)
└─ TOTAL:        $1.03 (0.000412 ETH)

Semua $1.03 → Dev Address ✅
Contract balance: $0 ✅
```

### **Batch Mint (3 badges):**
```
User mint 3 badges:
├─ Badge price:  $3.00 (3 × $1.00)
├─ Fee 3%:       $0.09 (3 × $0.03)
└─ TOTAL:        $3.09

Semua $3.09 → Dev Address ✅
Contract balance: $0 ✅
```

---

## 🔢 Contoh Kalkulasi (ETH Price Scenarios)

### **Scenario 1: ETH = $2,500**
```
Mint Price in .env:    400000000000000 wei
Badge Price ($1):      0.0004 ETH
Fee 3% ($0.03):        0.000012 ETH
Total User Pays:       0.000412 ETH
Dev Receives:          0.000412 ETH (100%)
```

### **Scenario 2: ETH = $3,000**
```
Mint Price in .env:    333333333333333 wei
Badge Price ($1):      0.000333 ETH
Fee 3% ($0.03):        0.00001 ETH
Total User Pays:       0.000343 ETH
Dev Receives:          0.000343 ETH (100%)
```

### **Scenario 3: ETH = $2,000**
```
Mint Price in .env:    500000000000000 wei
Badge Price ($1):      0.0005 ETH
Fee 3% ($0.03):        0.000015 ETH
Total User Pays:       0.000515 ETH
Dev Receives:          0.000515 ETH (100%)
```

---

## 🚀 Setup Mint Price

### **Calculate Mint Price:**
```
mintPrice (in ETH) = $1 / Current ETH Price
mintPrice (in wei) = mintPrice (in ETH) × 10^18
```

### **Examples:**
| ETH Price | $1 in ETH | Mint Price (wei) |
|-----------|-----------|------------------|
| $2,000 | 0.0005 | 500000000000000 |
| $2,500 | 0.0004 | 400000000000000 |
| $3,000 | 0.000333 | 333333333333333 |
| $3,500 | 0.000286 | 286000000000000 |
| $4,000 | 0.00025 | 250000000000000 |

### **Update .env:**
```env
# Set based on current ETH price
MINT_PRICE=400000000000000  # $1 when ETH = $2,500
DEV_ADDRESS=0xfacA089a60508744703EC9FfBc9AdaFACeD94621
```

---

## 📈 Revenue Projection

### **Monthly Revenue Scenarios:**

| Badges/Month | Dev Revenue ($) | Dev Revenue (ETH @ $2,500) |
|--------------|-----------------|----------------------------|
| 100 | $103 | 0.0412 ETH |
| 500 | $515 | 0.206 ETH |
| 1,000 | $1,030 | 0.412 ETH |
| 5,000 | $5,150 | 2.06 ETH |
| 10,000 | $10,300 | 4.12 ETH |
| 50,000 | $51,500 | 20.6 ETH |
| 100,000 | $103,000 | 41.2 ETH |

*Based on $1 badge price + 3% fee = $1.03 per mint*

---

## 🔍 Smart Contract Logic

### **mintBadge() Function:**
```solidity
// User must pay: mintPrice + (mintPrice * 3 / 100)
uint256 feeAmount = (mintPrice * 3) / 100;
uint256 totalRequired = mintPrice + feeAmount;

require(msg.value >= totalRequired);

// Transfer ALL to dev address
devAddress.call{value: totalRequired}("");

// Refund excess
if (msg.value > totalRequired) {
    refund = msg.value - totalRequired;
}
```

### **getTotalMintCost() Function:**
```solidity
function getTotalMintCost() public view returns (uint256) {
    uint256 fee = (mintPrice * 3) / 100;
    return mintPrice + fee;  // Total user must pay
}
```

---

## ✅ Verification Tests

**14 Tests Passed:**
- ✅ User must pay mintPrice + 3% fee
- ✅ ALL payment goes to dev address
- ✅ Contract balance remains 0
- ✅ DevFeeCollected event emits total amount
- ✅ getTotalMintCost() calculates correctly
- ✅ Works with different mint prices
- ✅ Batch mint transfers full payment
- ✅ Refunds excess payment
- ✅ Reverts on insufficient payment
- ✅ Owner can update mint price
- ✅ Zero mint price handled correctly
- ✅ Cannot deploy with zero dev address
- ✅ Dev address is immutable
- ✅ Fee constants are correct (3%)

---

## 📝 Deployment Instructions

### **1. Update .env:**
```bash
# Calculate based on current ETH price
# Example: ETH = $2,500 → mintPrice = 400000000000000
MINT_PRICE=400000000000000
DEV_ADDRESS=0xfacA089a60508744703EC9FfBc9AdaFACeD94621
PRIVATE_KEY=your_private_key
```

### **2. Deploy:**
```bash
# Testnet
npm run deploy:sepolia

# Mainnet (after testing)
npm run deploy:mainnet
```

### **3. Test Mint:**
```bash
# Update CONTRACT_ADDRESS in .env
npm run test:mint
```

---

## 💡 Important Notes

1. **Badge Price = $1 USD** (fixed in USD, varies in ETH)
2. **Fee = 3%** (fixed percentage)
3. **Total = $1.03** (what user actually pays)
4. **100% masuk ke Dev Address** (tidak ada yang di contract)
5. **Owner TIDAK bisa withdraw** (karena balance selalu 0)
6. **Update mint price** jika ETH price berubah signifikan

---

## 🔄 Updating Mint Price

**When to update:**
- ETH price changes > 20%
- Want to adjust USD price

**How to update:**
```bash
# Calculate new price
newPrice = $1 / current_eth_price * 10^18

# Call setMintPrice (owner only)
await vibeBadge.setMintPrice(newPrice);
```

**Example:**
```javascript
// ETH price changed from $2,500 to $3,000
const newPrice = ethers.parseEther('0.000333'); // $1 at $3,000/ETH
await vibeBadge.connect(owner).setMintPrice(newPrice);
```

---

## 🎯 Summary

- ✅ User bayar: **$1.03** ($1 badge + $0.03 fee)
- ✅ Dev dapat: **$1.03** (100% dari payment)
- ✅ Contract balance: **$0** (tidak ada yang tersisa)
- ✅ Transparent & automatic
- ✅ No manual fee collection needed
- ✅ All verified with 14 passing tests

**Ready to deploy!** 🚀

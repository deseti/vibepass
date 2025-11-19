# 🔧 Troubleshooting Guide - VibeBadge

## ❌ Common Errors & Solutions

### 1. Mint Badge Gagal / Transaction Fails

#### Error: "Origin https://farcaster.xyz not found on Allowlist"

**Penyebab**: WalletConnect project belum dikonfigurasi dengan benar untuk Farcaster Mini App.

**Solusi**:
1. Buka https://cloud.walletconnect.com/
2. Login dan pilih project Anda (Project ID: `3915c114eef8cb154d04b41fccf18cf3`)
3. Di **Settings** → **Allowed Origins**, tambahkan:
   - `https://app.vibepas.xyz`
   - `https://*.vercel.app` (untuk preview deployments)
4. Save dan tunggu 1-2 menit
5. Refresh aplikasi Anda

---

#### Error: "User rejected the request" atau "Transaction cancelled"

**Penyebab**: User membatalkan transaksi di wallet, atau insufficient balance.

**Solusi**:
1. Pastikan wallet memiliki ETH yang cukup di Base network
2. Mint cost: ~0.00103 ETH + gas fee (~0.0001 ETH)
3. Total needed: ~0.0015 ETH minimum
4. Cek balance di wallet dan top up jika kurang

---

#### Error: "Upload to IPFS failed" atau "Failed to upload badge"

**Penyebab**: Pinata API error atau file terlalu besar.

**Solusi untuk Auto Generate Mode**:
- Ini seharusnya tidak terjadi karena SVG auto-generated kecil
- Cek Pinata API key masih valid: https://app.pinata.cloud/
- Pastikan NEXT_PUBLIC_PINATA_JWT ada di environment variables

**Solusi untuk Manual Upload Mode**:
- Pastikan file image < 10MB
- Format yang didukung: PNG, JPG, GIF, WebP, SVG
- Compress image dulu jika terlalu besar: https://tinypng.com/

---

#### Error: "execution reverted" atau smart contract error

**Penyebab**: Smart contract menolak transaksi.

**Kemungkinan penyebab**:
1. **Value terlalu kecil**: Pastikan mengirim ETH sesuai dengan `totalCost`
2. **Contract paused**: Owner mungkin pause contract untuk maintenance
3. **Gas limit terlalu rendah**: Naikkan gas limit di wallet

**Solusi**:
```bash
# Cek status contract
# Buka BaseScan: https://basescan.org/address/0xaCF8105456d400b128Ca6fC739A20c7178d50767
# Lihat "Read Contract" → isPaused() harus false
```

---

### 2. Wallet Connection Issues

#### "Connect Wallet" tidak muncul di Farcaster Mini App

**Normal behavior**: Di Farcaster Mini App, wallet auto-connect otomatis.

**Jika tidak auto-connect**:
1. Refresh halaman
2. Pastikan membuka lewat Farcaster (bukan browser biasa)
3. Cek console browser untuk error logs

---

#### "Wrong Network" warning terus muncul

**Penyebab**: Wallet masih di network lain (Ethereum, Polygon, dll)

**Solusi**:
1. Click "Switch to Base" button
2. Approve network switch di wallet
3. Jika Base network belum ada, wallet akan auto-add network

**Manual Add Base Network**:
- Network Name: `Base`
- RPC URL: `https://mainnet.base.org`
- Chain ID: `8453`
- Currency Symbol: `ETH`
- Block Explorer: `https://basescan.org`

---

### 3. Badge Display Issues

#### Badge tidak muncul di "My Badges" page

**Penyebab**: Transaksi masih pending atau belum terindex.

**Solusi**:
1. Tunggu 10-30 detik untuk block confirmation
2. Refresh page
3. Cek transaksi di BaseScan (klik "View on BaseScan")
4. Pastikan status "Success" (hijau)

---

#### Image badge tidak load / broken image

**Penyebab**: IPFS gateway lambat atau Pinata issue.

**Solusi**:
1. Tunggu beberapa detik, IPFS gateway kadang lambat
2. Badge metadata tersimpan on-chain, jadi tidak akan hilang
3. Refresh page atau coba gateway lain

**IPFS Gateway Alternatives**:
- `https://gateway.pinata.cloud/ipfs/[hash]`
- `https://ipfs.io/ipfs/[hash]`
- `https://cloudflare-ipfs.com/ipfs/[hash]`

---

### 4. Gas Fee Issues

#### Gas fee terlalu mahal

**Normal range**: 0.0001 - 0.0005 ETH untuk Base network.

**Jika lebih mahal**:
1. Tunggu beberapa menit (network congestion)
2. Base biasanya murah, gas spike jarang terjadi
3. Cek Base network status: https://status.base.org/

---

### 5. Development/Testing Issues

#### Build errors saat `npm run build`

**Ignore these warnings** (safe):
```
Module not found: Can't resolve '@react-native-async-storage/async-storage'
Module not found: Can't resolve 'pino-pretty'
```

**These are optional dependencies** yang tidak diperlukan di browser.

---

#### "indexedDB is not defined" during build

**Normal**: Terjadi saat static generation di server.
**Impact**: None - wagmi works correctly in browser.
**Action**: Ignore warning.

---

## 🚀 Deployment Checklist

Sebelum deploy ke production, pastikan:

- [ ] `.env.local` sudah ada dan berisi:
  ```bash
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
  NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
  ```

- [ ] WalletConnect project sudah dikonfigurasi:
  - Allowed Origins: `https://app.vibepas.xyz` + `https://*.vercel.app`
  
- [ ] Pinata API key masih valid (check: https://app.pinata.cloud/)

- [ ] Contract address sudah benar di `lib/contracts.ts`

- [ ] Test mint di testnet dulu (Base Sepolia) sebelum mainnet

---

## 📊 Monitoring & Debugging

### Check Contract Status
```
BaseScan Mainnet: https://basescan.org/address/0xaCF8105456d400b128Ca6fC739A20c7178d50767

Read Contract:
- mintPrice() → should be 1030000000000000 (0.00103 ETH)
- devFee() → should be 300000000000000 (0.0003 ETH)
- isPaused() → should be false
- totalSupply() → jumlah badge yang sudah dimint
```

### Check User Balance
```javascript
// Di browser console:
await window.ethereum.request({ 
  method: 'eth_getBalance', 
  params: [address, 'latest'] 
})
// Convert from Wei to ETH
```

### Check Transaction Status
1. Copy transaction hash dari console log
2. Buka https://basescan.org/tx/[hash]
3. Lihat status:
   - ✅ Success (hijau) - Mint berhasil
   - ⏳ Pending (orange) - Tunggu beberapa detik
   - ❌ Failed (merah) - Ada error, lihat error message

---

## 🆘 Still Having Issues?

### Debug Mode

Enable debug logging di browser console:
```javascript
localStorage.setItem('wagmi.debug', 'true')
```

Refresh page dan cek console untuk detailed logs.

### Get Help

1. **Check BaseScan** untuk transaction details
2. **Screenshot error message** dari console
3. **Note down**:
   - Wallet address
   - Transaction hash (jika ada)
   - Network (Base Mainnet/Sepolia)
   - Browser & device
4. **Share** dengan dev team

---

## 🔐 Security Reminders

✅ **Safe**:
- VibeBadge smart contract sudah verified di BaseScan
- Hanya meminta approval untuk mint transaction
- Tidak pernah minta private key atau seed phrase

⚠️ **Warning**:
- Wallet warning "This transaction may fail" adalah **normal** untuk NFT minting
- Ini karena smart contract menggunakan custom logic
- Contract aman dan sudah diaudit

❌ **Never**:
- Jangan share private key atau seed phrase
- Jangan approve unlimited token spending
- Jangan connect ke website yang tidak dipercaya

---

## ✅ Success Indicators

Mint berhasil jika:
- ✅ Transaction status "Success" di BaseScan
- ✅ Badge muncul di "My Badges" page
- ✅ Token ID increment di contract (check totalSupply)
- ✅ Balance ETH berkurang sesuai mint cost
- ✅ Event `BadgeMinted` emitted di transaction logs

---

## 📚 Useful Links

- **BaseScan Mainnet**: https://basescan.org/
- **BaseScan Testnet**: https://sepolia.basescan.org/
- **WalletConnect Dashboard**: https://cloud.walletconnect.com/
- **Pinata Dashboard**: https://app.pinata.cloud/
- **Base Network Status**: https://status.base.org/
- **Get Base ETH**: https://bridge.base.org/

---

Happy Minting! 🎉

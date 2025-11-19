# 🔧 Mint Badge Error - Fixed!

## 🐛 Masalah yang Ditemukan

Mint badge selalu gagal dengan error:
- **"Origin https://farcaster.xyz not found on Allowlist"**
- postMessage failures antara wallet.farcaster.xyz dan farcaster.xyz
- WalletConnect configuration error

## ✅ Perbaikan yang Sudah Dilakukan

### 1. **Menambahkan WalletConnect Project ID** 
   - File: `components/Web3Provider.tsx`
   - Menambahkan `projectId` dari environment variable
   - Default fallback ke project ID yang ada

### 2. **Memperbaiki Farcaster Connector**
   - Menghapus config parameters yang tidak didukung
   - Menggunakan auto-configuration untuk Farcaster Mini App
   - Connector sekarang inisialisasi dengan benar

### 3. **Dokumentasi Troubleshooting**
   - Membuat `TROUBLESHOOTING.md` lengkap
   - Panduan fix untuk semua error umum
   - Step-by-step debugging guide

## 🚀 Langkah Selanjutnya

### PENTING - Konfigurasi WalletConnect Cloud:

1. **Buka WalletConnect Dashboard**:
   ```
   https://cloud.walletconnect.com/
   ```

2. **Login dan pilih project Anda**:
   - Project ID: `3915c114eef8cb154d04b41fccf18cf3`

3. **Update Allowed Origins**:
   - Go to **Settings** → **Domains** atau **Allowed Origins**
   - Tambahkan origins berikut:
     ```
     https://app.vibepas.xyz
     https://*.vercel.app
     ```
   - **Save changes**

4. **Tunggu 1-2 menit** untuk propagasi

5. **Test mint flow**:
   - Buka https://app.vibepas.xyz/mint
   - Connect wallet di Farcaster Mini App
   - Coba mint badge

## 📋 Testing Checklist

Setelah update WalletConnect config, test hal berikut:

- [ ] Wallet auto-connect di Farcaster Mini App
- [ ] Tidak ada error "Origin not found on Allowlist"
- [ ] Tidak ada postMessage errors di console
- [ ] Bisa mint badge (mode auto-generate)
- [ ] Bisa mint badge (mode manual upload)
- [ ] Transaction berhasil di BaseScan
- [ ] Badge muncul di "My Badges" page
- [ ] IPFS image load dengan benar

## 🔍 Cara Debug Jika Masih Error

### 1. Check Console Logs
```javascript
// Buka browser DevTools (F12)
// Lihat tab Console
// Cari error messages
```

### 2. Enable Debug Mode
```javascript
localStorage.setItem('wagmi.debug', 'true')
// Refresh page
```

### 3. Check Network Tab
```
DevTools → Network tab
Filter: XHR/Fetch
Look for failed requests to:
- Pinata API
- WalletConnect
- Base RPC
```

### 4. Verify Environment Variables
```bash
# Check .env.local
cat apps/web/.env.local

# Should contain:
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=3915c114eef8cb154d04b41fccf18cf3
NEXT_PUBLIC_PINATA_JWT=eyJhbGci...
```

### 5. Check Contract Status
```
BaseScan: https://basescan.org/address/0xaCF8105456d400b128Ca6fC739A20c7178d50767

Read Contract:
- isPaused() → should be false
- mintPrice() → should be 1030000000000000
- devFee() → should be 300000000000000
```

## 🎯 Expected Behavior After Fix

### Auto-Connect Flow:
1. User buka mini app di Farcaster
2. App detect Farcaster environment
3. Auto-connect ke Farcaster wallet
4. User bisa langsung mint tanpa klik "Connect"

### Mint Flow:
1. User masukkan event name
2. User pilih mode (Auto Generate / Manual Upload)
3. Click "Mint Badge"
4. Upload ke IPFS (2-5 detik)
5. Transaction popup di wallet
6. User approve transaction
7. Wait for confirmation (2-10 detik)
8. Success page dengan share button
9. Badge muncul di "My Badges"

## 🛠️ Files Modified

1. **`components/Web3Provider.tsx`**
   - Added WalletConnect project ID configuration
   - Fixed Farcaster connector initialization
   - Removed unsupported config parameters

2. **`TROUBLESHOOTING.md`** (NEW)
   - Comprehensive error guide
   - Step-by-step solutions
   - Debugging instructions

3. **`MINT_FIX_SUMMARY.md`** (NEW - this file)
   - Summary of all fixes
   - Testing checklist
   - Next steps

## 💡 Technical Details

### Root Cause:
WalletConnect tidak dikonfigurasi dengan Project ID, sehingga:
- Tidak bisa validate origins
- Farcaster Mini App connector gagal inisialisasi
- postMessage antara iframes blocked oleh CORS

### Solution:
1. Menambahkan Project ID ke connector config
2. Membersihkan Farcaster connector dari config yang tidak perlu
3. Update WalletConnect Cloud allowlist dengan domain yang benar

### Why This Fixes It:
- WalletConnect sekarang tahu project mana yang digunakan
- Bisa validate origin request dari Farcaster Mini App
- postMessage communication allowed
- Connector initialize dengan benar

## 📞 Support

Jika masih ada error setelah langkah di atas:

1. **Screenshot error message** (full console log)
2. **Copy transaction hash** (jika ada)
3. **Note down**:
   - Wallet address
   - Network (Base Mainnet/Sepolia)
   - Browser & device type
   - Mint mode (Auto/Manual)
4. **Share** dengan dev team atau buat GitHub issue

## ✅ Success Indicators

Mint BERHASIL jika melihat:
- ✅ "Minting Successful!" page
- ✅ Transaction hash di BaseScan
- ✅ Status "Success" (hijau) di BaseScan
- ✅ Badge dengan rarity level (Diamond/Gold/Silver)
- ✅ Share button works
- ✅ Badge muncul di My Badges page
- ✅ Image load dari IPFS

---

**Update terakhir**: November 19, 2025
**Status**: Fixes applied, awaiting WalletConnect config update and testing

# VibeBadge Frontend - Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
1. **GitHub Account** - Push your code to GitHub
2. **Vercel Account** - Sign up at https://vercel.com
3. **WalletConnect Project ID** - Get from https://cloud.walletconnect.com/

---

## Step 1: Get WalletConnect Project ID

1. Go to https://cloud.walletconnect.com/
2. Sign in or create an account
3. Create a new project
4. Copy your **Project ID**

---

## Step 2: Push to GitHub

```bash
# If not already initialized
cd d:\user\vibepass
git init
git add .
git commit -m "Add VibeBadge frontend with wallet integration"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/vibepass.git
git push -u origin main
```

---

## Step 3: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. **Import Git Repository**:
   - Select your GitHub repository
   - Click "Import"
3. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: `apps/web`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. **Environment Variables**:
   - Click "Add Environment Variable"
   - Add: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` = `your_project_id`
5. **Deploy**: Click "Deploy" button

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd d:\user\vibepass\apps\web
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? vibepass-web
# - Directory? ./
# - Override settings? No

# Add environment variable
vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

# Deploy to production
vercel --prod
```

---

## Step 4: Configure Environment Variables in Vercel

After initial deployment:

1. Go to your project dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Your WalletConnect Project ID | Production, Preview, Development |

**Note**: App uses public RPC from Base (https://mainnet.base.org & https://sepolia.base.org)

5. Click **Save**
6. **Redeploy**: Go to **Deployments** → Click ⋯ on latest → **Redeploy**

---

## Step 5: Verify Deployment

Once deployed, you'll get a URL like: `https://vibepass-web.vercel.app`

### Test Checklist:
- [ ] Homepage loads correctly
- [ ] Connect Wallet button works
- [ ] Can switch between Base Mainnet and Sepolia
- [ ] Mint page displays correct price (0.00103 ETH)
- [ ] Can mint badge successfully
- [ ] Transaction shows on BaseScan
- [ ] My Badges page shows owned badges
- [ ] Stats page displays contract info

---

## 🌐 Network Configuration

Your frontend supports:
- **Base Mainnet** (Chain ID: 8453)
- **Base Sepolia Testnet** (Chain ID: 84532)

Contract Addresses:
- Mainnet: `0xaCF8105456d400b128Ca6fC739A20c7178d50767`
- Testnet: `0xf0FCf8630fdA34593F3a00a41BD553Bd610c2644`

---

## 🔧 Troubleshooting

### Build fails with "Module not found"
- **Solution**: Ignore warnings about `@react-native-async-storage` and `pino-pretty` - they're optional dependencies

### "indexedDB is not defined" during build
- **Solution**: This is expected during static generation - wagmi works correctly in the browser

### Wallet connection not working
- **Check**: Environment variable `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set correctly
- **Verify**: Project ID is active on https://cloud.walletconnect.com/

### Transaction failing
- **Check**: Wallet has enough ETH (need ~0.00103 ETH + gas fees)
- **Verify**: On correct network (Base Mainnet or Sepolia)
- **Try**: Switch networks in wallet, then refresh page

---

## 📱 Getting Testnet ETH

For Base Sepolia testing:
1. Get Sepolia ETH from: https://sepoliafaucet.com/
2. Bridge to Base Sepolia: https://bridge.base.org/
3. Or use Base Sepolia faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

---

## 🔄 Continuous Deployment

Vercel automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update frontend"
git push

# Vercel will automatically deploy to:
# - Preview: Pull request deployments
# - Production: Main branch deployments
```

---

## 📊 Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `vibepass.io`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (~5 minutes)

---

## 🎯 Team Testing Instructions

Share this with your team:

### For Team Members:

**URL**: `https://your-app.vercel.app`

**How to Test:**

1. **Get a Wallet**:
   - Install MetaMask: https://metamask.io/
   - Or use any Web3 wallet (Rainbow, Coinbase Wallet, etc.)

2. **Get Test ETH** (for Sepolia):
   - Go to https://sepoliafaucet.com/
   - Enter your wallet address
   - Get free Sepolia ETH
   - Bridge to Base Sepolia: https://bridge.base.org/

3. **Connect & Mint**:
   - Go to the website
   - Click "Connect Wallet"
   - Select your wallet and approve
   - Switch to Base Sepolia (testnet) or Base Mainnet
   - Go to "Mint" page
   - Enter metadata URI (use: `https://example.com/metadata.json`)
   - Click "Mint Badge"
   - Approve transaction in wallet
   - Wait for confirmation (~2 seconds)

4. **View Badges**:
   - Go to "My Badges" page
   - See your minted badges
   - Click to view on BaseScan

5. **Report Issues**:
   - Take screenshot
   - Note which network (Mainnet/Testnet)
   - Share wallet address (for debugging)

---

## 📈 Analytics (Optional)

Add Vercel Analytics:

1. Go to **Analytics** tab in Vercel dashboard
2. Click "Enable Analytics"
3. No code changes needed - automatically integrated

---

## Support

- **BaseScan Mainnet**: https://basescan.org/address/0xaCF8105456d400b128Ca6fC739A20c7178d50767
- **BaseScan Testnet**: https://sepolia.basescan.org/address/0xf0FCf8630fdA34593F3a00a41BD553Bd610c2644
- **Dev Address**: 0xfacA089a60508744703EC9FfBc9AdaFACeD94621

---

## 🎉 Success!

Your VibeBadge frontend is now live! Share the URL with your team for testing.

**Next Steps**:
1. Test thoroughly on testnet
2. Get team feedback
3. Fix any issues
4. Deploy to mainnet when ready
5. Share with users!

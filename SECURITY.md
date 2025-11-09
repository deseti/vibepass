# Security Policy

## 🔒 VibePass Security Guidelines

This document outlines security best practices, audit procedures, and a comprehensive pre-deployment checklist for the VibePass platform.

---

## 📋 Pre-Mainnet Deployment Checklist

### Smart Contract Security

- [ ] **Professional Audit**
  - [ ] Engage reputable audit firm (OpenZeppelin, Trail of Bits, Consensys Diligence)
  - [ ] Address all findings (Critical, High, Medium)
  - [ ] Publish audit report publicly
  - [ ] Re-audit after significant changes

- [ ] **Automated Security Scans**
  - [ ] Run Slither: `slither contracts/`
  - [ ] Run Mythril: `myth analyze contracts/VibeBadge.sol`
  - [ ] Run Echidna for fuzzing (if applicable)
  - [ ] Check with Aderyn: `aderyn contracts/`

- [ ] **Code Review**
  - [ ] Peer review by 2+ experienced Solidity developers
  - [ ] Check for common vulnerabilities (reentrancy, overflow, access control)
  - [ ] Verify OpenZeppelin imports are latest stable versions
  - [ ] Review gas optimization opportunities

- [ ] **Testing**
  - [ ] 100% code coverage (`npx hardhat coverage`)
  - [ ] All tests passing (22+ tests)
  - [ ] Fuzz testing for edge cases
  - [ ] Integration tests with mainnet fork

- [ ] **Access Control**
  - [ ] Verify `onlyOwner` modifiers on sensitive functions
  - [ ] Consider multi-sig wallet for owner (Gnosis Safe)
  - [ ] Document admin privileges clearly
  - [ ] Test ownership transfer mechanism

- [ ] **Upgradeability**
  - [ ] Decide: Upgradeable (UUPS/Transparent) vs Immutable
  - [ ] If upgradeable: Use OpenZeppelin upgradeable contracts
  - [ ] If immutable: Plan for migration strategy
  - [ ] Document upgrade process

---

### Backend Security

#### 1. Private Key Management

**❌ NEVER DO:**
```bash
# DO NOT commit private keys to git
PRIVATE_KEY=0x1234567890abcdef...  # ❌ EXPOSED

# DO NOT hardcode in source code
const privateKey = "0x123...";  // ❌ DANGER
```

**✅ PROPER HANDLING:**

```bash
# Use environment variables
PRIVATE_KEY=0x...  # In .env file (gitignored)

# Use hardware wallets for production
# - Ledger
# - Trezor
# - AWS KMS
# - Google Cloud KMS

# Use multi-sig for critical operations
# - Gnosis Safe
# - 2-of-3 or 3-of-5 signers
```

**Remediation Steps:**
1. **Rotate Keys Immediately** if exposed
2. **Use separate keys** for dev/testnet/mainnet
3. **Store in secure vaults** (AWS Secrets Manager, 1Password, HashiCorp Vault)
4. **Never share** private keys via chat/email
5. **Backup securely** (encrypted, offline storage)

#### 2. RPC & API Keys

```bash
# Protect RPC endpoints
RPC_URL=https://mainnet.base.org  # Use rate-limited endpoints
ALCHEMY_API_KEY=***               # Store securely

# Rotate regularly
BASESCAN_API_KEY=***             # Every 90 days
WEB3_STORAGE_TOKEN=***           # Monitor usage
```

**Best Practices:**
- Use separate keys per environment
- Enable IP whitelisting when possible
- Monitor usage for anomalies
- Set up billing alerts

#### 3. Database Security

```bash
# PostgreSQL
DB_PASSWORD=***  # Strong password (32+ chars)
DB_HOST=localhost  # Not public internet

# Enable SSL
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

**Checklist:**
- [ ] Strong passwords (generated, not manual)
- [ ] SSL/TLS enabled for connections
- [ ] Limited user permissions (principle of least privilege)
- [ ] Regular backups (encrypted, tested restores)
- [ ] Audit logging enabled
- [ ] No public database access
- [ ] Parameterized queries only (prevent SQL injection)

#### 4. SIWE (Sign-In with Ethereum) Security

**Critical Checks:**

```typescript
// ✅ Verify nonce is fresh
const nonceAge = Date.now() - nonceTimestamp;
if (nonceAge > 5 * 60 * 1000) {  // 5 minutes
  throw new Error('Nonce expired');
}

// ✅ Prevent replay attacks
const nonceUsed = await redis.get(`nonce:${nonce}`);
if (nonceUsed) {
  throw new Error('Nonce already used');
}
await redis.setex(`nonce:${nonce}`, 600, '1');  // Mark as used

// ✅ Verify domain matches
if (siweMessage.domain !== req.headers.host) {
  throw new Error('Domain mismatch');
}

// ✅ Verify chain ID
if (siweMessage.chainId !== 8453) {  // Base mainnet
  throw new Error('Invalid chain');
}

// ✅ Check signature validity
const recoveredAddress = await siweMessage.verify({ signature });
if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
  throw new Error('Invalid signature');
}
```

**Security Measures:**
- [ ] Nonce expires after 5 minutes
- [ ] Nonce can only be used once (store in Redis/DB)
- [ ] Domain verification (prevent phishing)
- [ ] Chain ID validation (prevent cross-chain attacks)
- [ ] Rate limiting on nonce generation (10/minute per IP)
- [ ] HTTPS only in production
- [ ] Secure cookies (httpOnly, secure, sameSite=strict)

**JWT Security:**
```typescript
// ✅ Proper JWT configuration
const token = jwt.sign(
  { address, chainId },
  process.env.JWT_SECRET,  // Strong secret (256-bit)
  {
    expiresIn: '24h',      // Short expiration
    algorithm: 'HS256',    // Secure algorithm
    issuer: 'vibepass',
    audience: 'vibepass-web',
  }
);

// Set secure cookie
res.setHeader('Set-Cookie', [
  `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`,
]);
```

#### 5. Gasless Relayer Security

**Critical Risks:**
- 🚨 **Unlimited gas spending** - attacker drains relayer wallet
- 🚨 **Nonce manipulation** - transaction reordering
- 🚨 **Front-running** - MEV attacks

**Mitigations:**

```typescript
// ✅ Rate limiting (per wallet)
const requests = await redis.get(`relayer:${wallet}`);
if (requests > 5) {  // Max 5 mints per hour
  throw new Error('Rate limit exceeded');
}

// ✅ Gas price cap
const gasPrice = await provider.getGasPrice();
const maxGasPrice = ethers.parseUnits('50', 'gwei');
if (gasPrice > maxGasPrice) {
  throw new Error('Gas price too high');
}

// ✅ Daily spending cap
const dailySpent = await getDailySpending();
if (dailySpent > DAILY_CAP) {
  throw new Error('Daily cap reached');
}

// ✅ Whitelist verification
if (!ALLOWED_RECIPIENTS.includes(to)) {
  throw new Error('Recipient not whitelisted');
}

// ✅ Nonce management
const nonce = await wallet.getTransactionCount('pending');
// Store nonce in DB to prevent concurrent issues
```

**Checklist:**
- [ ] Rate limiting (5 transactions/hour per wallet)
- [ ] Gas price caps (50 gwei max)
- [ ] Daily spending limits ($100/day)
- [ ] Whitelist allowed recipients (if applicable)
- [ ] Monitor wallet balance (alert at 0.1 ETH)
- [ ] Nonce tracking in database
- [ ] Transaction monitoring (detect failures)
- [ ] Pause mechanism (emergency stop)

#### 6. IPFS/Web3.Storage Security

```typescript
// ✅ Content validation
if (metadata.image.startsWith('ipfs://')) {
  const cid = metadata.image.replace('ipfs://', '');
  if (!isValidCID(cid)) {
    throw new Error('Invalid CID');
  }
}

// ✅ File size limits
if (fileSize > 10 * 1024 * 1024) {  // 10 MB
  throw new Error('File too large');
}

// ✅ File type validation
const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
if (!allowedTypes.includes(file.mimetype)) {
  throw new Error('Invalid file type');
}

// ✅ Metadata sanitization
const sanitized = {
  name: sanitizeHTML(metadata.name),
  description: sanitizeHTML(metadata.description),
  image: validateCID(metadata.image),
  attributes: metadata.attributes.filter(attr => 
    typeof attr.trait_type === 'string' &&
    typeof attr.value === 'string'
  ),
};
```

**Checklist:**
- [ ] File size limits (10 MB)
- [ ] File type whitelist (images only)
- [ ] Content validation (no malicious code)
- [ ] CID validation (IPFS format)
- [ ] Metadata sanitization (prevent XSS)
- [ ] Rate limiting (uploads per user)
- [ ] Storage quota monitoring

---

### Frontend Security

#### 1. XSS Prevention

```typescript
// ✅ Sanitize user input
import DOMPurify from 'dompurify';

const cleanDescription = DOMPurify.sanitize(userInput);

// ✅ Use React's built-in escaping
<div>{badge.name}</div>  // ✅ Auto-escaped

// ❌ Dangerous
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // ❌ XSS risk
```

#### 2. CSP (Content Security Policy)

```typescript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: ipfs.io *.ipfs.io;
  connect-src 'self' https://mainnet.base.org https://*.alchemy.com;
  frame-ancestors 'none';
`;

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

#### 3. Wallet Connection Security

```typescript
// ✅ Verify network
const chainId = await provider.getNetwork();
if (chainId.chainId !== 8453) {
  await provider.send('wallet_switchEthereumChain', [
    { chainId: '0x2105' },  // Base mainnet
  ]);
}

// ✅ Verify contract address
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
  throw new Error('Invalid contract address');
}

// ✅ Check wallet is connected
if (!window.ethereum) {
  throw new Error('No wallet detected');
}

// ✅ Handle disconnection
window.ethereum.on('accountsChanged', (accounts) => {
  if (accounts.length === 0) {
    // User disconnected
    logout();
  }
});
```

---

### Dependency Security

#### NPM Audit

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (low/moderate)
npm audit fix

# Review high/critical manually
npm audit --json | jq '.vulnerabilities'

# Update specific packages
npm update package-name
```

**Checklist:**
- [ ] Run `npm audit` weekly
- [ ] Fix high/critical vulnerabilities immediately
- [ ] Review low/moderate vulnerabilities
- [ ] Keep dependencies up to date
- [ ] Use Dependabot (automated PRs)
- [ ] Review dependency licenses

#### Pinned Versions

```json
// package.json - Use exact versions for production
{
  "dependencies": {
    "ethers": "6.15.0",        // ✅ Exact version
    "next": "14.0.0",          // ✅ No caret/tilde
    "@openzeppelin/contracts": "5.4.0"
  }
}
```

---

### Rate Limiting

```typescript
// Rate limit by IP
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limit by wallet
const walletLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                     // 5 mints per hour
  keyGenerator: (req) => req.body.wallet,
});

app.use('/api/relay/mint', walletLimiter);
```

**Endpoints to Protect:**
- [ ] `/api/siwe/nonce` - 10/minute per IP
- [ ] `/api/siwe/verify` - 5/minute per IP
- [ ] `/api/relay/mint` - 5/hour per wallet
- [ ] `/api/pin/*` - 20/hour per wallet
- [ ] `/api/badges` - 60/minute per IP

---

## 🚨 Incident Response

### If Private Key is Compromised

1. **Immediately:**
   - Rotate key
   - Pause relayer
   - Transfer contract ownership to new address
   - Alert team

2. **Investigate:**
   - Check transaction history
   - Identify unauthorized transactions
   - Calculate losses

3. **Mitigate:**
   - Deploy new relayer with new key
   - Update environment variables
   - Notify users if affected

### If Smart Contract Has Vulnerability

1. **Critical:**
   - Pause contract (if pausable)
   - Contact audit firm
   - Prepare fix/migration
   - Communicate with users

2. **Post-Mortem:**
   - Document incident
   - Update security practices
   - Implement monitoring

---

## 🔍 Monitoring & Alerts

### Set Up Alerts For:

- [ ] **Contract Events**
  - Large batch mints (>100 badges)
  - Ownership transfers
  - Failed transactions

- [ ] **Relayer**
  - Low balance (<0.1 ETH)
  - High gas usage (>0.01 ETH/tx)
  - Failed transactions (>3 in 1 hour)
  - Rate limit hits

- [ ] **API**
  - Error rate >1%
  - Response time >1s
  - 429 rate limit responses
  - Database connection failures

- [ ] **Security**
  - Failed login attempts (>5 in 10 min)
  - Unusual IP patterns
  - npm audit findings
  - Certificate expiration (30 days)

**Tools:**
- Sentry (error tracking)
- Datadog (APM)
- PagerDuty (on-call)
- OpenZeppelin Defender (contract monitoring)

---

## 📚 Security Resources

### Audits & Tools
- [OpenZeppelin Contracts Wizard](https://wizard.openzeppelin.com/)
- [Slither](https://github.com/crytic/slither) - Static analysis
- [Mythril](https://github.com/ConsenSys/mythril) - Security scanner
- [Secureum](https://secureum.xyz/) - Security training

### Best Practices
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

### Bug Bounties
- [Immunefi](https://immunefi.com/)
- [Code4rena](https://code4rena.com/)
- [HackerOne](https://www.hackerone.com/)

---

## 📝 Reporting Security Issues

**DO NOT** open public GitHub issues for security vulnerabilities.

**Please report to:**
- Email: security@vibepass.xyz
- Encrypted: PGP key available on request

**Include:**
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Response Time:**
- Acknowledgment: 24 hours
- Initial assessment: 48 hours
- Fix timeline: Based on severity

---

## ✅ Final Security Checklist

### Before Mainnet Deploy

**Smart Contracts:**
- [ ] Professional audit completed
- [ ] All findings addressed
- [ ] Tests passing (100% coverage)
- [ ] Gas optimized
- [ ] Owner is multi-sig
- [ ] Verified on BaseScan

**Backend:**
- [ ] Private keys in secure vault
- [ ] Environment variables set
- [ ] Rate limiting enabled
- [ ] Monitoring configured
- [ ] Backups tested
- [ ] SSL/TLS enabled

**Frontend:**
- [ ] CSP headers configured
- [ ] XSS prevention tested
- [ ] Input sanitization
- [ ] HTTPS only
- [ ] Dependencies updated
- [ ] Error handling

**Operations:**
- [ ] Incident response plan
- [ ] On-call rotation
- [ ] Monitoring alerts
- [ ] Backup strategy
- [ ] Rollback plan
- [ ] Team trained

---

**Last Updated:** 2025-11-08  
**Version:** 1.0  
**Status:** Pre-Mainnet

**Remember: Security is an ongoing process, not a one-time checklist.**

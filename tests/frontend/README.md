# E2E Testing with Playwright

End-to-end testing setup for VibePass frontend using Playwright.

## 🚀 Quick Start

### Install Dependencies

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Run Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/frontend/e2e.spec.ts

# Run specific browser
npx playwright test --project=chromium
```

## 📁 Test Structure

```
tests/
└── frontend/
    └── e2e.spec.ts  # Main E2E tests

Test Coverage:
- Landing page rendering
- Wallet connection flow
- SIWE authentication
- Profile page & badge gallery
- Badge minting flow
- Error handling
- Responsive design
```

## 🧪 Test Suites

### 1. Landing Page Tests
- Verify page loads correctly
- Check hero section & navigation
- Ensure connect wallet button is visible

### 2. Wallet Connection Tests
- Mock MetaMask provider
- Test successful connection
- Verify wallet address display
- Check network switching (Base)

### 3. SIWE Authentication Tests
- Mock SIWE API endpoints
- Test login flow completion
- Handle signature requests
- Verify authenticated state
- Test verification failures

### 4. Profile Page Tests
- Display user profile with VibeScore
- Show badge collection in grid
- Handle empty state (no badges)
- Mock badges API responses
- Test badge metadata rendering

### 5. Mint Page Tests
- Display mint form
- Validate form inputs
- Test image upload flow
- Mock IPFS pinning APIs
- Mock gasless minting
- Show minting progress indicators
- Display success state with token ID

### 6. Error Handling Tests
- Network errors (failed requests)
- 404 page not found
- API error responses
- Graceful error messages

### 7. Responsive Design Tests
- Mobile viewport (375x667)
- Tablet viewport (768x1024)
- Desktop viewport (1920x1080)

## 🎭 Mock Setup

### Mock Wallet Provider

Tests inject a mock `window.ethereum` object that simulates MetaMask:

```javascript
window.ethereum = {
  isMetaMask: true,
  request: async ({ method, params }) => {
    // Mock responses for:
    // - eth_requestAccounts
    // - eth_accounts
    // - eth_chainId
    // - personal_sign (SIWE signature)
    // - eth_sendTransaction
    // etc.
  },
};
```

### Mock API Routes

```javascript
// Mock SIWE nonce endpoint
await page.route('**/api/siwe/nonce', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ nonce: 'test-nonce' }),
  });
});

// Mock badges API
await page.route('**/api/badges*', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ badges: [...] }),
  });
});
```

## 📊 Test Reports

### HTML Report

```bash
# Run tests (generates report automatically)
npm run test:e2e

# Open report
npx playwright show-report
```

### CI Integration

Tests run automatically on GitHub Actions. See `.github/workflows/ci.yml` for configuration.

## 🐛 Debugging

### Debug Mode

```bash
# Run with Playwright Inspector
npx playwright test --debug

# Debug specific test
npx playwright test --debug -g "should connect wallet"
```

### Screenshots & Videos

- Screenshots: Captured on failure
- Videos: Recorded for failed tests
- Traces: Available for retried tests

Location: `test-results/` directory

### View Traces

```bash
# Open trace viewer
npx playwright show-trace test-results/.../trace.zip
```

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './tests/frontend',
  timeout: 30 * 1000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'Mobile Chrome', use: devices['Pixel 5'] },
    { name: 'Mobile Safari', use: devices['iPhone 12'] },
  ],
  
  webServer: {
    command: 'cd apps/web && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## ✅ Best Practices

### 1. Use Test IDs
```tsx
// In component
<button data-testid="connect-wallet">Connect</button>

// In test
await page.getByTestId('connect-wallet').click();
```

### 2. Wait for Network Idle
```typescript
await page.goto('/', { waitUntil: 'networkidle' });
```

### 3. Use Locators
```typescript
// Prefer specific locators
await page.locator('[data-testid="badge-card"]').count();

// Instead of generic selectors
await page.locator('.badge-card').count();  // Less stable
```

### 4. Mock External Services
Always mock:
- Wallet providers (MetaMask)
- API endpoints
- IPFS uploads
- Blockchain transactions

### 5. Test User Flows, Not Implementation
Focus on what users see and do, not internal state.

## 🚧 Limitations

Current mock limitations:
- No actual blockchain interactions
- No real IPFS uploads
- No MetaMask signature validation
- Simplified wallet connection flow

For full integration testing, use testnet with real wallet.

## 📚 Resources

- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Setup](https://playwright.dev/docs/ci)

## 🎯 Next Steps

1. **Add More Tests**
   - Farcaster verification flow
   - Badge transfer scenarios
   - Leaderboard sorting
   - Search/filter functionality

2. **Integration Tests**
   - Test against Base testnet
   - Real wallet connections (with test keys)
   - Actual IPFS uploads

3. **Performance Tests**
   - Page load times
   - Image optimization
   - Bundle size checks

4. **Accessibility Tests**
   - Keyboard navigation
   - Screen reader compatibility
   - ARIA labels

---

**Status**: Basic E2E test skeleton complete ✅  
**Coverage**: ~15 test cases across 7 test suites  
**Next**: Run `npm run test:e2e` to execute tests

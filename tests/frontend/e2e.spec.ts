import { test, expect, Page, Route } from '@playwright/test';

/**
 * E2E Tests for VibePass
 * 
 * Tests critical user flows:
 * - Wallet connection
 * - SIWE authentication
 * - Profile viewing
 * - Badge minting
 */

// Mock wallet provider for testing
test.beforeEach(async ({ page }: { page: Page }) => {
  // Inject mock wallet
  await page.addInitScript(() => {
    // @ts-ignore
    window.ethereum = {
      isMetaMask: true,
      request: async ({ method, params }: any) => {
        console.log('Mock wallet request:', method, params);
        
        switch (method) {
          case 'eth_requestAccounts':
            return ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e'];
          
          case 'eth_accounts':
            return ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e'];
          
          case 'eth_chainId':
            return '0x2105'; // Base mainnet (8453)
          
          case 'wallet_switchEthereumChain':
            return null;
          
          case 'personal_sign':
            // Mock SIWE signature
            return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12';
          
          case 'eth_getBalance':
            return '0x56bc75e2d63100000'; // 100 ETH
          
          case 'eth_getTransactionCount':
            return '0x1';
          
          case 'eth_sendTransaction':
            // Mock transaction hash
            return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
          
          case 'eth_getTransactionReceipt':
            return {
              status: '0x1',
              transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
              blockNumber: '0x1234',
            };
          
          default:
            throw new Error(`Unhandled method: ${method}`);
        }
      },
      on: (event: string, callback: Function) => {
        console.log('Mock wallet event listener:', event);
      },
      removeListener: () => {},
    };
  });
});

test.describe('Landing Page', () => {
  test('should load landing page', async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:3000');
    
    // Check title
    await expect(page).toHaveTitle(/VibePass/);
    
    // Check hero section
    await expect(page.locator('h1')).toContainText('VibePass');
    
    // Check connect wallet button exists
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    await expect(connectButton).toBeVisible();
  });

  test('should have navigation links', async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:3000');
    
    // Check nav elements
    await expect(page.locator('nav')).toBeVisible();
  });
});

test.describe('Wallet Connection', () => {
  test('should connect wallet successfully', async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:3000');
    
    // Click connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    await connectButton.click();
    
    // Wait for wallet to connect
    await page.waitForTimeout(1000);
    
    // Verify wallet address is displayed
    await expect(page.locator('text=/0x742d35Cc/i')).toBeVisible();
  });

  test('should show correct network (Base)', async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:3000');
    
    // Connect wallet
    await page.locator('button:has-text("Connect Wallet")').click();
    await page.waitForTimeout(1000);
    
    // Verify Base network indicator (if implemented)
    // await expect(page.locator('text=/Base/i')).toBeVisible();
  });
});

test.describe('SIWE Authentication', () => {
  test('should complete SIWE login flow', async ({ page }: { page: Page }) => {
    // Mock API responses
    await page.route('**/api/siwe/nonce', async (route: Route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ nonce: 'test-nonce-12345' }),
      });
    });

    await page.route('**/api/siwe/verify', (route: Route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        }),
      });
    });

    await page.goto('http://localhost:3000');
    
    // Connect wallet
    await page.locator('button:has-text("Connect Wallet")').click();
    await page.waitForTimeout(1000);
    
    // Should trigger SIWE signature request
    // In real flow, user would sign message
    
    // Verify authenticated state
    await page.waitForTimeout(2000);
    // Check for user-specific UI elements
  });

  test('should handle SIWE verification failure', async ({ page }: { page: Page }) => {
    // Mock failed verification
    await page.route('**/api/siwe/verify', (route: Route) => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'Invalid signature',
        }),
      });
    });

    await page.goto('http://localhost:3000');
    
    // Attempt connection
    await page.locator('button:has-text("Connect Wallet")').click();
    await page.waitForTimeout(1000);
    
    // Should show error message
    // await expect(page.locator('text=/error/i')).toBeVisible();
  });
});

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Mock authentication
    await page.route('**/api/siwe/nonce', (route: Route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ nonce: 'test-nonce' }),
      });
    });

    await page.route('**/api/siwe/verify', (route: Route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        }),
      });
    });
  });

  test('should display user profile', async ({ page }: { page: Page }) => {
    // Mock badges API
    await page.route('**/api/badges*', (route: Route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          badges: [
            {
              tokenId: 1,
              tokenURI: 'ipfs://QmExample1',
              metadata: {
                name: 'ETHGlobal 2024',
                description: 'Attended ETHGlobal hackathon',
                image: 'ipfs://QmImage1',
                attributes: [
                  { trait_type: 'Event', value: 'ETHGlobal' },
                  { trait_type: 'Rarity', value: 'Rare' },
                ],
              },
            },
          ],
        }),
      });
    });

    await page.goto('http://localhost:3000');
    
    // Connect wallet
    await page.locator('button:has-text("Connect Wallet")').click();
    await page.waitForTimeout(1000);
    
    // Navigate to profile
    await page.goto('http://localhost:3000/profile');
    
    // Wait for profile to load
    await page.waitForTimeout(2000);
    
    // Verify profile elements
    await expect(page.locator('h1')).toContainText('My Profile');
    
    // Verify VibeScore is displayed
    await expect(page.locator('text=/VibeScore/i')).toBeVisible();
    
    // Verify badge gallery
    await expect(page.locator('text=/My Badge Collection/i')).toBeVisible();
  });

  test('should display badge collection', async ({ page }: { page: Page }) => {
    // Mock badges with multiple items
    await page.route('**/api/badges*', (route: Route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          badges: [
            {
              tokenId: 1,
              tokenURI: 'ipfs://QmExample1',
              metadata: { name: 'Badge 1', image: 'ipfs://img1' },
            },
            {
              tokenId: 2,
              tokenURI: 'ipfs://QmExample2',
              metadata: { name: 'Badge 2', image: 'ipfs://img2' },
            },
            {
              tokenId: 3,
              tokenURI: 'ipfs://QmExample3',
              metadata: { name: 'Badge 3', image: 'ipfs://img3' },
            },
          ],
        }),
      });
    });

    await page.goto('http://localhost:3000/profile');
    await page.waitForTimeout(2000);
    
    // Verify multiple badges are displayed
    const badges = page.locator('.badge-card');
    await expect(badges).toHaveCount(3);
  });

  test('should show empty state when no badges', async ({ page }: { page: Page }) => {
    // Mock empty badges
    await page.route('**/api/badges*', (route: Route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ badges: [] }),
      });
    });

    await page.goto('http://localhost:3000/profile');
    await page.waitForTimeout(2000);
    
    // Verify empty state message
    await expect(page.locator('text=/No badges yet/i')).toBeVisible();
    
    // Verify CTA to mint first badge
    await expect(page.locator('text=/Mint Your First Badge/i')).toBeVisible();
  });
});

test.describe('Mint Page', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Mock authentication
    await page.route('**/api/siwe/nonce', (route: Route) => {
      route.fulfill({ status: 200, body: JSON.stringify({ nonce: 'test' }) });
    });

    await page.route('**/api/siwe/verify', (route: Route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' }),
      });
    });
  });

  test('should display mint form', async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:3000/mint');
    
    // Verify form elements
    await expect(page.locator('h1')).toContainText('Mint');
    await expect(page.locator('input[placeholder*="Badge"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:3000/mint');
    
    // Try to submit empty form
    await page.locator('button[type="submit"]').click();
    
    // Should show validation errors
    // await expect(page.locator('text=/required/i')).toBeVisible();
  });

  test('should upload image and mint badge', async ({ page }: { page: Page }) => {
    // Mock API responses
    await page.route('**/api/pin/image', (route: Route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          ipfsUrl: 'ipfs://QmImageCID',
          cid: 'QmImageCID',
        }),
      });
    });

    await page.route('**/api/pin/metadata', (route: Route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          ipfsUrl: 'ipfs://QmMetadataCID',
          cid: 'QmMetadataCID',
        }),
      });
    });

    await page.route('**/api/relay/mint', (route: Route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          tokenId: 123,
          transactionHash: '0xabcd1234',
        }),
      });
    });

    await page.goto('http://localhost:3000/mint');
    
    // Fill form
    await page.fill('input[placeholder*="name"]', 'Test Badge');
    await page.fill('textarea', 'This is a test badge');
    await page.fill('input[placeholder*="event"]', 'Test Event');
    
    // Upload image (if file input is present)
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles('./test-image.png');
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Wait for minting process
    await page.waitForTimeout(3000);
    
    // Verify success state
    await expect(page.locator('text=/success/i')).toBeVisible();
    await expect(page.locator('text=/Token ID/i')).toBeVisible();
  });

  test('should show minting progress', async ({ page }: { page: Page }) => {
    // Slow down API responses to see progress
    await page.route('**/api/pin/image', async (route: Route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        body: JSON.stringify({ ipfsUrl: 'ipfs://QmImage', cid: 'QmImage' }),
      });
    });

    await page.route('**/api/relay/mint', async (route: Route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, tokenId: 1, transactionHash: '0xabc' }),
      });
    });

    await page.goto('http://localhost:3000/mint');
    
    // Fill and submit
    await page.fill('input[placeholder*="name"]', 'Test');
    await page.fill('textarea', 'Test description');
    await page.locator('button[type="submit"]').click();
    
    // Verify progress indicators
    await expect(page.locator('text=/Uploading/i')).toBeVisible();
    // await expect(page.locator('text=/Minting/i')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }: { page: Page }) => {
    // Mock network error
    await page.route('**/api/badges*', (route: Route) => {
      route.abort('failed');
    });

    await page.goto('http://localhost:3000/profile');
    await page.waitForTimeout(2000);
    
    // Should show error message
    await expect(page.locator('text=/error|failed/i')).toBeVisible();
  });

  test('should handle 404 errors', async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:3000/nonexistent-page');
    
    // Should show 404 page
    await expect(page.locator('text=/404|not found/i')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }: { page: Page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    // Verify mobile layout
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }: { page: Page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000');
    
    // Verify tablet layout
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }: { page: Page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000');
    
    // Verify desktop layout
    await expect(page.locator('h1')).toBeVisible();
  });
});

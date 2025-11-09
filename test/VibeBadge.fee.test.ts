import { expect } from 'chai';
import hre from 'hardhat';
import type { VibeBadge } from '../typechain-types/contracts/VibeBadge';
import type { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

// @ts-ignore
const ethers = hre.ethers;

describe('VibeBadge - Fee Tests', function () {
  let vibeBadge: VibeBadge;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let devAddress: SignerWithAddress;

  const MINT_PRICE = ethers.parseEther('0.0004'); // $1 when ETH = $2500
  const TOKEN_URI = 'ipfs://QmTest/metadata.json';

  beforeEach(async function () {
    [owner, user, devAddress] = await ethers.getSigners();

    const VibeBadge = await ethers.getContractFactory('VibeBadge');
    vibeBadge = await VibeBadge.deploy(devAddress.address, MINT_PRICE);
    await vibeBadge.waitForDeployment();
  });

  describe('Payment Structure: $1 + 3% fee = $1.03 total to dev', function () {
    it('Should require user to pay mintPrice + 3% fee', async function () {
      const fee = (MINT_PRICE * BigInt(3)) / BigInt(100);
      const totalRequired = MINT_PRICE + fee;
      
      // Should work with exact payment
      await expect(
        vibeBadge.connect(user).mintBadge(user.address, TOKEN_URI, {
          value: totalRequired
        })
      ).to.not.be.reverted;
    });

    it('Should transfer ALL payment (mintPrice + fee) to dev address', async function () {
      const devBalanceBefore = await ethers.provider.getBalance(devAddress.address);
      
      const fee = (MINT_PRICE * BigInt(3)) / BigInt(100);
      const totalRequired = MINT_PRICE + fee;
      
      await vibeBadge.connect(user).mintBadge(user.address, TOKEN_URI, {
        value: totalRequired
      });

      const devBalanceAfter = await ethers.provider.getBalance(devAddress.address);
      const devReceived = devBalanceAfter - devBalanceBefore;

      // Dev should receive FULL payment (100% of what user paid)
      expect(devReceived).to.equal(totalRequired);
    });

    it('Should leave ZERO balance in contract', async function () {
      const fee = (MINT_PRICE * BigInt(3)) / BigInt(100);
      const totalRequired = MINT_PRICE + fee;
      
      await vibeBadge.connect(user).mintBadge(user.address, TOKEN_URI, {
        value: totalRequired
      });

      // Contract should have 0 balance (all went to dev)
      const contractBalance = await ethers.provider.getBalance(await vibeBadge.getAddress());
      expect(contractBalance).to.equal(0);
    });

    it('Should emit DevFeeCollected with TOTAL amount', async function () {
      const fee = (MINT_PRICE * BigInt(3)) / BigInt(100);
      const totalRequired = MINT_PRICE + fee;
      
      await expect(
        vibeBadge.connect(user).mintBadge(user.address, TOKEN_URI, {
          value: totalRequired
        })
      )
        .to.emit(vibeBadge, 'DevFeeCollected')
        .withArgs(user.address, devAddress.address, totalRequired);
    });

    it('Should calculate correct total with getTotalMintCost()', async function () {
      const totalCost = await vibeBadge.getTotalMintCost();
      const fee = (MINT_PRICE * BigInt(3)) / BigInt(100);
      const expectedTotal = MINT_PRICE + fee;
      
      expect(totalCost).to.equal(expectedTotal);
    });

    it('Should calculate fee correctly for different mint prices', async function () {
      const newPrice = ethers.parseEther('0.001'); // New $1 equivalent
      await vibeBadge.connect(owner).setMintPrice(newPrice);

      const devBalanceBefore = await ethers.provider.getBalance(devAddress.address);
      
      const fee = (newPrice * BigInt(3)) / BigInt(100);
      const totalRequired = newPrice + fee;
      
      await vibeBadge.connect(user).mintBadge(user.address, TOKEN_URI, {
        value: totalRequired
      });

      const devBalanceAfter = await ethers.provider.getBalance(devAddress.address);
      const devReceived = devBalanceAfter - devBalanceBefore;

      // Dev receives full amount (price + fee)
      expect(devReceived).to.equal(totalRequired);
    });

    it('Should transfer full payment on batch mint', async function () {
      const recipients = [user.address, user.address, user.address];
      const uris = [TOKEN_URI, TOKEN_URI, TOKEN_URI];
      
      const feePerBadge = (MINT_PRICE * BigInt(3)) / BigInt(100);
      const totalPerBadge = MINT_PRICE + feePerBadge;
      const totalRequired = totalPerBadge * BigInt(3);
      
      const devBalanceBefore = await ethers.provider.getBalance(devAddress.address);
      
      await vibeBadge.connect(user).batchMint(recipients, uris, {
        value: totalRequired
      });

      const devBalanceAfter = await ethers.provider.getBalance(devAddress.address);
      const devReceived = devBalanceAfter - devBalanceBefore;

      // Dev receives full payment for all 3 badges
      expect(devReceived).to.equal(totalRequired);
    });

    it('Should refund excess payment', async function () {
      const totalRequired = await vibeBadge.getTotalMintCost();
      const overpayment = totalRequired + ethers.parseEther('0.001');
      
      const userBalanceBefore = await ethers.provider.getBalance(user.address);
      
      const tx = await vibeBadge.connect(user).mintBadge(user.address, TOKEN_URI, {
        value: overpayment
      });
      
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const userBalanceAfter = await ethers.provider.getBalance(user.address);
      
      // User should only pay totalRequired + gas
      const userSpent = userBalanceBefore - userBalanceAfter;
      expect(userSpent).to.be.closeTo(totalRequired + gasUsed, ethers.parseEther('0.0001'));
    });

    it('Should revert if payment is insufficient', async function () {
      const totalRequired = await vibeBadge.getTotalMintCost();
      const insufficientPayment = totalRequired - BigInt(1);
      
      await expect(
        vibeBadge.connect(user).mintBadge(user.address, TOKEN_URI, {
          value: insufficientPayment
        })
      ).to.be.revertedWith('VibeBadge: insufficient payment');
    });

    it('Should allow owner to update mint price', async function () {
      const newPrice = ethers.parseEther('0.0005'); // New $1 equivalent
      
      await expect(vibeBadge.connect(owner).setMintPrice(newPrice))
        .to.emit(vibeBadge, 'MintPriceUpdated')
        .withArgs(MINT_PRICE, newPrice);
      
      expect(await vibeBadge.mintPrice()).to.equal(newPrice);
    });
  });

  describe('Edge Cases', function () {
    it('Should handle zero mint price correctly', async function () {
      await vibeBadge.connect(owner).setMintPrice(0);
      
      const devBalanceBefore = await ethers.provider.getBalance(devAddress.address);
      
      await vibeBadge.connect(user).mintBadge(user.address, TOKEN_URI, {
        value: 0
      });

      const devBalanceAfter = await ethers.provider.getBalance(devAddress.address);
      expect(devBalanceAfter).to.equal(devBalanceBefore); // No fee for zero price
    });

    it('Should not allow deployment with zero dev address', async function () {
      const VibeBadge = await ethers.getContractFactory('VibeBadge');
      
      await expect(
        VibeBadge.deploy(ethers.ZeroAddress, MINT_PRICE)
      ).to.be.revertedWith('VibeBadge: dev address cannot be zero');
    });

    it('Should store dev address as immutable', async function () {
      const storedDevAddress = await vibeBadge.devAddress();
      expect(storedDevAddress).to.equal(devAddress.address);
    });

    it('Should have correct fee constants', async function () {
      expect(await vibeBadge.FEE_PERCENTAGE()).to.equal(3);
      expect(await vibeBadge.FEE_DENOMINATOR()).to.equal(100);
    });
  });
});

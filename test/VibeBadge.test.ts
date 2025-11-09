import { expect } from 'chai';
import hre from 'hardhat';
import type { VibeBadge } from '../typechain-types/contracts/VibeBadge';
import type { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

// @ts-ignore - ethers is available at runtime via hardhat-ethers plugin
const ethers = hre.ethers;

// Extend Chai Assertion interface for hardhat-chai-matchers
declare global {
  export namespace Chai {
    interface Assertion {
      emit(contract: any, eventName: string): ChainablePromiseAssertion;
      revertedWith(reason: string): ChainablePromiseAssertion;
      revertedWithCustomError(contract: any, errorName: string): ChainablePromiseAssertion;
    }
    interface ChainablePromiseAssertion {
      withArgs(...args: any[]): ChainablePromiseAssertion;
    }
  }
}

describe('VibeBadge', function () {
  let vibeBadge: VibeBadge;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let devAddress: SignerWithAddress;

  const TOKEN_URI_1 = 'ipfs://QmTest1/metadata.json';
  const TOKEN_URI_2 = 'ipfs://QmTest2/metadata.json';
  const TOKEN_URI_3 = 'ipfs://QmTest3/metadata.json';
  const MINT_PRICE = ethers.parseEther('0.001'); // 0.001 ETH

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, addr3, devAddress] = await ethers.getSigners();

    // Deploy VibeBadge contract with dev address and mint price
    const VibeBadge = await ethers.getContractFactory('VibeBadge');
    vibeBadge = await VibeBadge.deploy(devAddress.address, MINT_PRICE);
    await vibeBadge.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the correct name and symbol', async function () {
      expect(await vibeBadge.name()).to.equal('VibeBadge');
      expect(await vibeBadge.symbol()).to.equal('VBADGE');
    });

    it('Should set the deployer as owner', async function () {
      expect(await vibeBadge.owner()).to.equal(owner.address);
    });

    it('Should set the correct dev address', async function () {
      expect(await vibeBadge.devAddress()).to.equal(devAddress.address);
    });

    it('Should set the correct mint price', async function () {
      expect(await vibeBadge.mintPrice()).to.equal(MINT_PRICE);
    });

    it('Should set 3% fee percentage', async function () {
      expect(await vibeBadge.FEE_PERCENTAGE()).to.equal(3);
    });

    it('Should initialize nextId to 1', async function () {
      expect(await vibeBadge.getNextTokenId()).to.equal(1);
    });
  });

  describe('mintBadge', function () {
    it('Should mint a badge with payment and send 3% fee to dev', async function () {
      const devBalanceBefore = await ethers.provider.getBalance(devAddress.address);
      
      const tx = await vibeBadge.connect(addr1).mintBadge(addr1.address, TOKEN_URI_1, {
        value: MINT_PRICE
      });
      await tx.wait();

      // Check token was minted
      expect(await vibeBadge.ownerOf(1)).to.equal(addr1.address);
      
      // Check token URI is correct
      expect(await vibeBadge.tokenURI(1)).to.equal(TOKEN_URI_1);
      
      // Check nextId incremented
      expect(await vibeBadge.getNextTokenId()).to.equal(2);

      // Check dev received 3% fee
      const devBalanceAfter = await ethers.provider.getBalance(devAddress.address);
      const expectedFee = (MINT_PRICE * BigInt(3)) / BigInt(100);
      expect(devBalanceAfter - devBalanceBefore).to.equal(expectedFee);
    });

    it('Should emit BadgeMinted and DevFeeCollected events', async function () {
      const expectedFee = (MINT_PRICE * BigInt(3)) / BigInt(100);
      
      const tx = await vibeBadge.connect(addr1).mintBadge(addr1.address, TOKEN_URI_1, {
        value: MINT_PRICE
      });
      
      await expect(tx)
        .to.emit(vibeBadge, 'BadgeMinted')
        .withArgs(addr1.address, 1, TOKEN_URI_1);
      
      await expect(tx)
        .to.emit(vibeBadge, 'DevFeeCollected')
        .withArgs(addr1.address, devAddress.address, expectedFee);
    });

    it('Should increment token IDs correctly', async function () {
      await vibeBadge.connect(addr1).mintBadge(addr1.address, TOKEN_URI_1, { value: MINT_PRICE });
      await vibeBadge.connect(addr2).mintBadge(addr2.address, TOKEN_URI_2, { value: MINT_PRICE });
      
      expect(await vibeBadge.ownerOf(1)).to.equal(addr1.address);
      expect(await vibeBadge.ownerOf(2)).to.equal(addr2.address);
      expect(await vibeBadge.getNextTokenId()).to.equal(3);
    });

    it('Should store unique tokenURI for each token', async function () {
      await vibeBadge.mintBadge(addr1.address, TOKEN_URI_1);
      await vibeBadge.mintBadge(addr2.address, TOKEN_URI_2);

      expect(await vibeBadge.tokenURI(1)).to.equal(TOKEN_URI_1);
      expect(await vibeBadge.tokenURI(2)).to.equal(TOKEN_URI_2);
    });

    it('Should revert when non-owner tries to mint', async function () {
      await expect(
        vibeBadge.connect(addr1).mintBadge(addr2.address, TOKEN_URI_1)
      ).to.be.revertedWithCustomError(vibeBadge, 'OwnableUnauthorizedAccount');
    });

    it('Should revert when minting to zero address', async function () {
      await expect(
        vibeBadge.mintBadge(ethers.ZeroAddress, TOKEN_URI_1)
      ).to.be.revertedWith('VibeBadge: mint to zero address');
    });

    it('Should revert when tokenURI is empty', async function () {
      await expect(
        vibeBadge.mintBadge(addr1.address, '')
      ).to.be.revertedWith('VibeBadge: empty token URI');
    });
  });

  describe('batchMint', function () {
    it('Should mint multiple badges at once', async function () {
      const addresses = [addr1.address, addr2.address, addr3.address];
      const uris = [TOKEN_URI_1, TOKEN_URI_2, TOKEN_URI_3];

      await vibeBadge.batchMint(addresses, uris);

      expect(await vibeBadge.ownerOf(1)).to.equal(addr1.address);
      expect(await vibeBadge.ownerOf(2)).to.equal(addr2.address);
      expect(await vibeBadge.ownerOf(3)).to.equal(addr3.address);

      expect(await vibeBadge.tokenURI(1)).to.equal(TOKEN_URI_1);
      expect(await vibeBadge.tokenURI(2)).to.equal(TOKEN_URI_2);
      expect(await vibeBadge.tokenURI(3)).to.equal(TOKEN_URI_3);

      expect(await vibeBadge.getNextTokenId()).to.equal(4);
    });

    it('Should emit BadgeMinted events for each mint', async function () {
      const addresses = [addr1.address, addr2.address];
      const uris = [TOKEN_URI_1, TOKEN_URI_2];

      const tx = await vibeBadge.batchMint(addresses, uris);
      
      await expect(tx)
        .to.emit(vibeBadge, 'BadgeMinted')
        .withArgs(addr1.address, 1, TOKEN_URI_1);
      
      await expect(tx)
        .to.emit(vibeBadge, 'BadgeMinted')
        .withArgs(addr2.address, 2, TOKEN_URI_2);
    });

    it('Should revert when arrays have different lengths', async function () {
      const addresses = [addr1.address, addr2.address];
      const uris = [TOKEN_URI_1]; // Only one URI

      await expect(
        vibeBadge.batchMint(addresses, uris)
      ).to.be.revertedWith('VibeBadge: arrays length mismatch');
    });

    it('Should revert when arrays are empty', async function () {
      await expect(
        vibeBadge.batchMint([], [])
      ).to.be.revertedWith('VibeBadge: empty arrays');
    });

    it('Should revert when non-owner tries to batch mint', async function () {
      const addresses = [addr1.address];
      const uris = [TOKEN_URI_1];

      await expect(
        vibeBadge.connect(addr1).batchMint(addresses, uris)
      ).to.be.revertedWithCustomError(vibeBadge, 'OwnableUnauthorizedAccount');
    });
  });

  describe('tokenURI', function () {
    it('Should return correct tokenURI for minted tokens', async function () {
      await vibeBadge.mintBadge(addr1.address, TOKEN_URI_1);
      expect(await vibeBadge.tokenURI(1)).to.equal(TOKEN_URI_1);
    });

    it('Should revert for non-existent token', async function () {
      await expect(
        vibeBadge.tokenURI(999)
      ).to.be.revertedWith('VibeBadge: URI query for nonexistent token');
    });
  });

  describe('ERC721 Standard Functions', function () {
    beforeEach(async function () {
      await vibeBadge.mintBadge(addr1.address, TOKEN_URI_1);
    });

    it('Should support token transfers', async function () {
      await vibeBadge.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
      expect(await vibeBadge.ownerOf(1)).to.equal(addr2.address);
    });

    it('Should support balance queries', async function () {
      expect(await vibeBadge.balanceOf(addr1.address)).to.equal(1);
      
      await vibeBadge.mintBadge(addr1.address, TOKEN_URI_2);
      expect(await vibeBadge.balanceOf(addr1.address)).to.equal(2);
    });

    it('Should support approve and transferFrom', async function () {
      await vibeBadge.connect(addr1).approve(addr2.address, 1);
      expect(await vibeBadge.getApproved(1)).to.equal(addr2.address);
      
      await vibeBadge.connect(addr2).transferFrom(addr1.address, addr3.address, 1);
      expect(await vibeBadge.ownerOf(1)).to.equal(addr3.address);
    });
  });

  describe('Ownership', function () {
    it('Should allow owner to transfer ownership', async function () {
      await vibeBadge.transferOwnership(addr1.address);
      expect(await vibeBadge.owner()).to.equal(addr1.address);
    });

    it('Should allow new owner to mint after ownership transfer', async function () {
      await vibeBadge.transferOwnership(addr1.address);
      
      await expect(
        vibeBadge.mintBadge(addr2.address, TOKEN_URI_1)
      ).to.be.revertedWithCustomError(vibeBadge, 'OwnableUnauthorizedAccount');
      
      await expect(
        vibeBadge.connect(addr1).mintBadge(addr2.address, TOKEN_URI_1)
      ).to.not.be.reverted;
    });
  });
});

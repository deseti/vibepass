import '@nomicfoundation/hardhat-ethers';
import '@typechain/hardhat';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-verify';
import { HardhatUserConfig } from 'hardhat/config';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Hardhat config for Base Sepolia Testnet and Base Mainnet
 */
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    localhost: {
      url: 'http://127.0.0.1:8545'
    },
    baseSepolia: {
      url: 'https://sepolia.base.org',
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    },
    baseMainnet: {
      url: 'https://mainnet.base.org',
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    }
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6'
  },
  mocha: {
    timeout: 40000
  },
  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY || 'PLACEHOLDER_STRING',
    customChains: [
      {
        network: 'baseSepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org'
        }
      },
      {
        network: 'baseMainnet',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org'
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};

export default config;

import { base, baseSepolia } from 'wagmi/chains';

export const CONTRACTS = {
  [base.id]: {
    address: '0xaCF8105456d400b128Ca6fC739A20c7178d50767' as `0x${string}`,
    explorer: 'https://basescan.org',
  },
  [baseSepolia.id]: {
    address: '0xf0FCf8630fdA34593F3a00a41BD553Bd610c2644' as `0x${string}`,
    explorer: 'https://sepolia.basescan.org',
  },
};

export const VIBEBADGE_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'string', name: 'uri', type: 'string' },
    ],
    name: 'mintBadge',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mintPrice',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalMintCost',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getNextTokenId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'tokenURI', type: 'string' },
    ],
    name: 'BadgeMinted',
    type: 'event',
  },
] as const;

export const DEV_ADDRESS = '0xfacA089a60508744703EC9FfBc9AdaFACeD94621';

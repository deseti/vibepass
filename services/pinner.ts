/**
 * IPFS Pinner Service using Web3.Storage
 * 
 * Provides utilities to pin NFT metadata and images to IPFS via Web3.Storage.
 * Web3.Storage provides free decentralized storage powered by Filecoin.
 * 
 * Setup:
 * 1. Get API token from https://web3.storage
 * 2. Set WEB3_STORAGE_TOKEN environment variable
 * 3. npm install web3.storage
 * 
 * Alternative: Use NFT.Storage (https://nft.storage) which is NFT-optimized
 */

import { Web3Storage, File } from 'web3.storage';
import fs from 'fs';
import path from 'path';

const WEB3_STORAGE_TOKEN = process.env.WEB3_STORAGE_TOKEN;

if (!WEB3_STORAGE_TOKEN) {
  console.warn('⚠️  WEB3_STORAGE_TOKEN not set. Pinner service will not work.');
}

/**
 * Initialize Web3.Storage client
 */
function getClient(): Web3Storage {
  if (!WEB3_STORAGE_TOKEN) {
    throw new Error('WEB3_STORAGE_TOKEN environment variable is required');
  }
  return new Web3Storage({ token: WEB3_STORAGE_TOKEN });
}

/**
 * NFT Metadata Interface (ERC-721 standard)
 */
export interface NFTMetadata {
  name: string;
  description: string;
  image: string; // IPFS URL or data URI
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  background_color?: string;
  animation_url?: string;
}

/**
 * Pin JSON metadata to IPFS
 * 
 * @param metadata - NFT metadata object
 * @returns Object with CID and IPFS gateway URL
 * 
 * @example
 * const result = await pinMetadata({
 *   name: "VibePass Badge #1",
 *   description: "Attended ETHGlobal 2024",
 *   image: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
 *   attributes: [
 *     { trait_type: "Event", value: "ETHGlobal" },
 *     { trait_type: "Year", value: 2024 }
 *   ]
 * });
 * console.log(result.url); // https://ipfs.io/ipfs/bafyb...
 */
export async function pinMetadata(metadata: NFTMetadata): Promise<{
  cid: string;
  url: string;
  gatewayUrl: string;
}> {
  try {
    const client = getClient();

    // Convert metadata to JSON and create File object
    const metadataJson = JSON.stringify(metadata, null, 2);
    const file = new File([metadataJson], 'metadata.json', {
      type: 'application/json',
    });

    // Upload to IPFS
    const cid = await client.put([file], {
      name: `VibePass-${metadata.name}`,
      wrapWithDirectory: false,
    });

    return {
      cid,
      url: `ipfs://${cid}`,
      gatewayUrl: `https://ipfs.io/ipfs/${cid}`,
    };
  } catch (error) {
    console.error('Error pinning metadata:', error);
    throw new Error(`Failed to pin metadata: ${error}`);
  }
}

/**
 * Pin a file (image, video, etc.) to IPFS
 * 
 * @param filePath - Path to the file to upload
 * @returns Object with CID and IPFS gateway URL
 * 
 * @example
 * const result = await pinFile('./badge-image.png');
 * console.log(result.url); // ipfs://bafyb...
 */
export async function pinFile(filePath: string): Promise<{
  cid: string;
  url: string;
  gatewayUrl: string;
}> {
  try {
    const client = getClient();

    // Read file from disk
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    // Create File object
    const file = new File([fileData], fileName, {
      type: getContentType(fileName),
    });

    // Upload to IPFS
    const cid = await client.put([file], {
      name: `VibePass-${fileName}`,
      wrapWithDirectory: false,
    });

    return {
      cid,
      url: `ipfs://${cid}`,
      gatewayUrl: `https://ipfs.io/ipfs/${cid}`,
    };
  } catch (error) {
    console.error('Error pinning file:', error);
    throw new Error(`Failed to pin file: ${error}`);
  }
}

/**
 * Pin a file from Buffer (useful for uploaded files)
 * 
 * @param buffer - File buffer
 * @param fileName - Name of the file
 * @returns Object with CID and IPFS gateway URL
 * 
 * @example
 * const result = await pinFileBuffer(imageBuffer, 'badge.png');
 */
export async function pinFileBuffer(
  buffer: Buffer,
  fileName: string
): Promise<{
  cid: string;
  url: string;
  gatewayUrl: string;
}> {
  try {
    const client = getClient();

    // Create File object from buffer
    const file = new File([new Uint8Array(buffer)], fileName, {
      type: getContentType(fileName),
    });

    // Upload to IPFS
    const cid = await client.put([file], {
      name: `VibePass-${fileName}`,
      wrapWithDirectory: false,
    });

    return {
      cid,
      url: `ipfs://${cid}`,
      gatewayUrl: `https://ipfs.io/ipfs/${cid}`,
    };
  } catch (error) {
    console.error('Error pinning file buffer:', error);
    throw new Error(`Failed to pin file buffer: ${error}`);
  }
}

/**
 * Pin complete NFT (image + metadata) in one operation
 * 
 * @param imagePath - Path to image file
 * @param metadata - NFT metadata (without image field)
 * @returns Complete metadata with IPFS URLs
 * 
 * @example
 * const result = await pinNFT('./badge.png', {
 *   name: "VibePass Badge #1",
 *   description: "Attended ETHGlobal 2024",
 *   attributes: [{ trait_type: "Event", value: "ETHGlobal" }]
 * });
 * console.log(result.metadataUrl); // Use this as tokenURI
 */
export async function pinNFT(
  imagePath: string,
  metadata: Omit<NFTMetadata, 'image'>
): Promise<{
  imageCid: string;
  imageUrl: string;
  metadataCid: string;
  metadataUrl: string;
  gatewayUrl: string;
}> {
  try {
    // First, pin the image
    const imageResult = await pinFile(imagePath);

    // Then, pin metadata with image URL
    const completeMetadata: NFTMetadata = {
      ...metadata,
      image: imageResult.url,
    };

    const metadataResult = await pinMetadata(completeMetadata);

    return {
      imageCid: imageResult.cid,
      imageUrl: imageResult.url,
      metadataCid: metadataResult.cid,
      metadataUrl: metadataResult.url,
      gatewayUrl: metadataResult.gatewayUrl,
    };
  } catch (error) {
    console.error('Error pinning NFT:', error);
    throw new Error(`Failed to pin NFT: ${error}`);
  }
}

/**
 * Helper function to determine content type from file name
 */
function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.json': 'application/json',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Usage Examples:
 * 
 * // 1. Pin metadata only
 * const metadata = await pinMetadata({
 *   name: "Badge #1",
 *   description: "First badge",
 *   image: "ipfs://existing-image-cid"
 * });
 * 
 * // 2. Pin image only
 * const image = await pinFile('./badge.png');
 * 
 * // 3. Pin complete NFT
 * const nft = await pinNFT('./badge.png', {
 *   name: "Badge #1",
 *   description: "First badge",
 *   attributes: [
 *     { trait_type: "Rarity", value: "Rare" }
 *   ]
 * });
 * 
 * // Use nft.metadataUrl as tokenURI when minting:
 * await vibeBadge.mintBadge(userAddress, nft.metadataUrl);
 */

export default {
  pinMetadata,
  pinFile,
  pinFileBuffer,
  pinNFT,
};

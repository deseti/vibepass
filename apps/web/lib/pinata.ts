// Pinata IPFS upload utilities
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_API_URL = 'https://api.pinata.cloud';

export async function uploadToPinata(data: any, filename: string): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error('Pinata JWT not configured');
  }

  try {
    const formData = new FormData();
    
    // Convert data to blob
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    formData.append('file', blob, filename);

    const metadata = JSON.stringify({
      name: filename,
    });
    formData.append('pinataMetadata', metadata);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Pinata upload error:', error);
    throw error;
  }
}

export async function uploadSVGToPinata(svg: string, filename: string): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error('Pinata JWT not configured');
  }

  try {
    const formData = new FormData();
    
    // Convert SVG to blob
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    formData.append('file', blob, filename);

    const metadata = JSON.stringify({
      name: filename,
    });
    formData.append('pinataMetadata', metadata);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Pinata SVG upload error:', error);
    throw error;
  }
}

export function ipfsToHttps(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', 'https://harlequin-adjacent-gull-459.mypinata.cloud/ipfs/');
  }
  return ipfsUrl;
}

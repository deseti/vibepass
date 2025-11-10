import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
      return NextResponse.json({ error: 'Pinata API keys not configured' }, { status: 500 });
    }

    // Upload to Pinata
    const data = new FormData();
    data.append('file', file);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
      body: data,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata upload failed:', errorText);
      return NextResponse.json({ error: 'Failed to upload to Pinata' }, { status: 500 });
    }

    const result = await response.json();
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

    return NextResponse.json({ ipfsUrl, ipfsHash: result.IpfsHash });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}

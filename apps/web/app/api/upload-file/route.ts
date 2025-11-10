import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('❌ No file in FormData');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('📁 File received:', { name: file.name, size: file.size, type: file.type });

    const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

    if (!pinataJWT) {
      console.error('❌ Pinata JWT not configured');
      return NextResponse.json({ error: 'Pinata JWT not configured' }, { status: 500 });
    }

    // Upload to Pinata
    const data = new FormData();
    data.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
    });
    data.append('pinataMetadata', metadata);

    console.log('📤 Uploading to Pinata...');
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: data,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Pinata upload failed:', { status: response.status, error: errorText });
      return NextResponse.json({ error: `Failed to upload to Pinata: ${response.status}` }, { status: 500 });
    }

    const result = await response.json();
    const ipfsUrl = `ipfs://${result.IpfsHash}`;

    console.log('✅ Upload successful:', { ipfsHash: result.IpfsHash, ipfsUrl });
    return NextResponse.json({ ipfsUrl, ipfsHash: result.IpfsHash });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}

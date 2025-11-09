/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['ipfs.io', 'w3s.link', 'gateway.pinata.cloud'],
  },
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '8453',
  },
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      crypto: false,
    };
    config.externals.push(
      'pino-pretty', 
      'lokijs', 
      'encoding',
      '@react-native-async-storage/async-storage'
    );
    
    // Ignore warnings for optional dependencies
    config.ignoreWarnings = [
      { module: /@metamask\/sdk/ },
      { module: /@react-native-async-storage/ },
    ];
    
    return config;
  },
}

module.exports = nextConfig

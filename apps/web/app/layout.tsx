import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';

const Web3Provider = dynamic(
  () => import('@/components/Web3Provider').then((mod) => mod.Web3Provider),
  { ssr: false }
);

const MiniAppInit = dynamic(
  () => import('@/components/MiniAppInit').then((mod) => mod.MiniAppInit),
  { ssr: false }
);

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VibeBadge - Event NFT Badges',
  description: 'Mint and collect event attendance NFT badges on Base',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
  },
  openGraph: {
    title: 'VibeBadge - Event NFT Badges',
    description: 'Mint and collect event attendance NFT badges on Base',
    images: [
      {
        url: 'https://app.vibepas.xyz/icon.png',
        width: 512,
        height: 512,
        alt: 'VibeBadge'
      }
    ],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: "1",
      imageUrl: "https://app.vibepas.xyz/icon.png",
      button: {
        title: "🎫 Mint Badge",
        action: {
          type: "launch_miniapp",
          name: "VibeBadge",
          url: "https://app.vibepas.xyz/mint",
          splashImageUrl: "https://app.vibepas.xyz/icon.png",
          splashBackgroundColor: "#7C3AED"
        }
      }
    })
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MiniAppInit />
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}

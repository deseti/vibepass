import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mint Badge - VibeBadge',
  description: 'Mint your event badge NFT with random rarity level',
  openGraph: {
    title: 'Mint Your VibeBadge',
    description: 'Create unique event badges with random rarity - Diamond, Gold, or Silver!',
    images: [
      {
        url: 'https://vibepass.vercel.app/og-mint.png',
        width: 1200,
        height: 630,
        alt: 'VibeBadge Mint'
      }
    ],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: "1",
      imageUrl: "https://vibepass.vercel.app/og-mint.png",
      button: {
        title: "🎫 Mint Badge",
        action: {
          type: "launch_miniapp",
          name: "VibeBadge",
          url: "https://vibepass.vercel.app/mint",
          splashImageUrl: "https://vibepass.vercel.app/logo-splash.png",
          splashBackgroundColor: "#7C3AED"
        }
      }
    })
  }
};

export default function MintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

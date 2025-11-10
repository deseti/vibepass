// Badge generator utility with random rarity
export type BadgeLevel = 'GOLD' | 'SILVER' | 'DIAMOND';

interface BadgeColors {
  primary: string;
  secondary: string;
  glow: string;
}

const BADGE_COLORS: Record<BadgeLevel, BadgeColors> = {
  DIAMOND: {
    primary: '#B9F2FF',
    secondary: '#00D4FF',
    glow: 'rgba(185, 242, 255, 0.8)',
  },
  GOLD: {
    primary: '#FFD700',
    secondary: '#FFA500',
    glow: 'rgba(255, 215, 0, 0.6)',
  },
  SILVER: {
    primary: '#C0C0C0',
    secondary: '#A8A8A8',
    glow: 'rgba(192, 192, 192, 0.6)',
  },
};

// Random badge level with probability:
// Diamond: 10% (rarest)
// Gold: 30%
// Silver: 60% (most common)
export function getRandomBadgeLevel(): BadgeLevel {
  const random = Math.random() * 100;
  
  if (random < 10) {
    return 'DIAMOND'; // 10% chance
  } else if (random < 40) {
    return 'GOLD'; // 30% chance
  } else {
    return 'SILVER'; // 60% chance
  }
}

export function generateBadgeSVG(
  eventName: string,
  level: BadgeLevel,
  date: string = new Date().toLocaleDateString()
): string {
  const colors = BADGE_COLORS[level];
  
  return `
    <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="500" height="500" fill="#1a1a2e"/>
      
      <!-- Badge Circle with Glow -->
      <circle cx="250" cy="250" r="180" fill="url(#badgeGradient)" filter="url(#glow)" opacity="0.9"/>
      <circle cx="250" cy="250" r="160" fill="none" stroke="${colors.primary}" stroke-width="3"/>
      
      <!-- Inner Circle -->
      <circle cx="250" cy="250" r="140" fill="rgba(26, 26, 46, 0.7)"/>
      
      <!-- Level Badge -->
      <rect x="200" y="100" width="100" height="40" rx="20" fill="${colors.primary}"/>
      <text x="250" y="127" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1a1a2e" text-anchor="middle">${level}</text>
      
      <!-- Event Name -->
      <text x="250" y="240" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${colors.primary}" text-anchor="middle">${eventName}</text>
      
      <!-- VibeBadge Label -->
      <text x="250" y="280" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" text-anchor="middle" opacity="0.8">VibeBadge</text>
      
      <!-- Date -->
      <text x="250" y="310" font-family="Arial, sans-serif" font-size="14" fill="#888888" text-anchor="middle">${date}</text>
      
      <!-- Decorative Stars -->
      <text x="150" y="200" font-size="20" fill="${colors.primary}" opacity="0.6">★</text>
      <text x="350" y="200" font-size="20" fill="${colors.primary}" opacity="0.6">★</text>
      <text x="150" y="350" font-size="20" fill="${colors.primary}" opacity="0.6">★</text>
      <text x="350" y="350" font-size="20" fill="${colors.primary}" opacity="0.6">★</text>
      
      <!-- Bottom Text -->
      <text x="250" y="420" font-family="Arial, sans-serif" font-size="12" fill="#666666" text-anchor="middle">Event Attendance NFT</text>
    </svg>
  `.trim();
}

export function generateBadgeMetadata(
  eventName: string,
  level: BadgeLevel,
  imageUrl: string,
  description?: string
) {
  const rarityText = level === 'DIAMOND' ? 'Legendary (10%)' : level === 'GOLD' ? 'Rare (30%)' : 'Common (60%)';
  const rarityScore = level === 'DIAMOND' ? 100 : level === 'GOLD' ? 70 : 40;
  
  return {
    name: `${eventName} - ${level} Badge`,
    description: description || `${level} tier VibeBadge for ${eventName}. Rarity: ${rarityText}. Official VibeBadge NFT minted on Base.`,
    image: imageUrl,
    external_url: 'https://app.vibepas.xyz',
    attributes: [
      {
        trait_type: 'Level',
        value: level,
      },
      {
        trait_type: 'Event',
        value: eventName,
      },
      {
        trait_type: 'Rarity Score',
        value: rarityScore,
      },
      {
        trait_type: 'Mint Date',
        value: new Date().toISOString(),
      },
      {
        trait_type: 'Contract',
        value: 'VibeBadge Official',
      },
      {
        trait_type: 'Network',
        value: 'Base',
      },
    ],
  };
}

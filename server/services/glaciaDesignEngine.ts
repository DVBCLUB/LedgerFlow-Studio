/**
 * server/services/glaciaDesignEngine.ts
 * Động cơ Thiết Kế Đồ Họa Vector Tự Động (Generative Design Engine) cho Robot Glacia.
 * Tự động tạo Vector Graphic độ phân giải cao, Poster Cyberpunk, Banner YouTube & Thẻ Báo Cáo HUD Điều Hành.
 */

import fs from 'fs';
import path from 'path';

export interface BannerDesignRequest {
  headline: string;
  subheadline?: string;
  theme?: 'frost_crystal' | 'cyberpunk_neon' | 'executive_dark' | 'emerald_finance' | 'solar_amber';
  size?: '1200x630' | '1080x1080' | '1920x1080' | '1080x1920' | '800x400';
  badge?: string;
  metrics?: Array<{ label: string; value: string }>;
  showHudElements?: boolean;
}

export interface BannerDesignResult {
  success: boolean;
  svgContent: string;
  outputPath: string;
  publicUrl?: string;
  dimensions: { width: number; height: number };
  message: string;
}

export async function generateGlaciaBanner(req: BannerDesignRequest): Promise<BannerDesignResult> {
  const [widthStr, heightStr] = (req.size || '1200x630').split('x');
  const width = parseInt(widthStr, 10) || 1200;
  const height = parseInt(heightStr, 10) || 630;
  const isVertical = height > width;

  const runtimeArtifactsDir = path.join(process.cwd(), 'runtime', 'artifacts', 'design');
  if (!fs.existsSync(runtimeArtifactsDir)) {
    fs.mkdirSync(runtimeArtifactsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const fileName = `glacia_vector_${timestamp}.svg`;
  const filePath = path.join(runtimeArtifactsDir, fileName);

  const themeColors = {
    frost_crystal: {
      bgGrad1: '#020617',
      bgGrad2: '#082f49',
      bgCard: 'rgba(15, 23, 42, 0.75)',
      cardBorder: 'rgba(56, 189, 248, 0.4)',
      accent: '#38bdf8',
      accentSecondary: '#818cf8',
      accentGlow: 'rgba(56, 189, 248, 0.4)',
      textMain: '#f8fafc',
      textSub: '#94a3b8',
    },
    cyberpunk_neon: {
      bgGrad1: '#090014',
      bgGrad2: '#2e0854',
      bgCard: 'rgba(24, 6, 45, 0.75)',
      cardBorder: 'rgba(236, 72, 153, 0.4)',
      accent: '#ec4899',
      accentSecondary: '#a855f7',
      accentGlow: 'rgba(236, 72, 153, 0.5)',
      textMain: '#ffffff',
      textSub: '#d8b4fe',
    },
    executive_dark: {
      bgGrad1: '#0a0a0a',
      bgGrad2: '#1c1917',
      bgCard: 'rgba(23, 23, 23, 0.8)',
      cardBorder: 'rgba(251, 191, 36, 0.4)',
      accent: '#fbbf24',
      accentSecondary: '#f59e0b',
      accentGlow: 'rgba(251, 191, 36, 0.3)',
      textMain: '#ffffff',
      textSub: '#d1d5db',
    },
    emerald_finance: {
      bgGrad1: '#022c22',
      bgGrad2: '#064e3b',
      bgCard: 'rgba(4, 47, 36, 0.75)',
      cardBorder: 'rgba(52, 211, 153, 0.4)',
      accent: '#34d399',
      accentSecondary: '#10b981',
      accentGlow: 'rgba(52, 211, 153, 0.4)',
      textMain: '#ffffff',
      textSub: '#a7f3d0',
    },
    solar_amber: {
      bgGrad1: '#1c0e00',
      bgGrad2: '#451a03',
      bgCard: 'rgba(41, 19, 3, 0.75)',
      cardBorder: 'rgba(249, 115, 22, 0.4)',
      accent: '#f97316',
      accentSecondary: '#fb923c',
      accentGlow: 'rgba(249, 115, 22, 0.4)',
      textMain: '#fff7ed',
      textSub: '#fdba74',
    },
  }[req.theme || 'frost_crystal'];

  const metrics = req.metrics || [
    { label: 'EFFICIENCY', value: '99.8%' },
    { label: 'TOKEN COST', value: '$0.00' },
    { label: 'AUTONOMY', value: 'LEVEL 5' },
  ];

  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${themeColors.bgGrad1}" />
      <stop offset="100%" stop-color="${themeColors.bgGrad2}" />
    </linearGradient>

    <!-- Accent Gradient -->
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${themeColors.accent}" />
      <stop offset="100%" stop-color="${themeColors.accentSecondary}" />
    </linearGradient>

    <!-- Glow Filter -->
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <!-- Subtle Blur Filter -->
    <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="100%" height="100%" fill="url(#bgGrad)" />

  <!-- Quantum Grid & Stardust Particles -->
  <g opacity="0.08" stroke="#ffffff" stroke-width="1">
    ${Array.from({ length: 18 })
      .map((_, i) => `<line x1="${(i * width) / 18}" y1="0" x2="${(i * width) / 18}" y2="${height}" />`)
      .join('\n')}
    ${Array.from({ length: 12 })
      .map((_, i) => `<line x1="0" y1="${(i * height) / 12}" x2="${width}" y2="${(i * height) / 12}" />`)
      .join('\n')}
  </g>

  <!-- Ambient Light Orbs -->
  <circle cx="${width - 120}" cy="120" r="140" fill="${themeColors.accent}" opacity="0.22" filter="url(#glow)" />
  <circle cx="100" cy="${height - 100}" r="110" fill="${themeColors.accentSecondary}" opacity="0.18" filter="url(#glow)" />

  <!-- HUD Telemetry Arc Gauges -->
  <g transform="translate(${width - 180}, 160)" opacity="0.45">
    <circle cx="0" cy="0" r="80" fill="none" stroke="${themeColors.accent}" stroke-width="2" stroke-dasharray="12, 6" />
    <circle cx="0" cy="0" r="64" fill="none" stroke="${themeColors.accentSecondary}" stroke-width="1.5" stroke-dasharray="6, 4" />
    <circle cx="0" cy="0" r="6" fill="${themeColors.accent}" />
    <text x="0" y="28" fill="${themeColors.accent}" font-family="system-ui, sans-serif" font-size="9" font-weight="800" text-anchor="middle" letter-spacing="2">SYS.ONLINE</text>
  </g>

  <!-- Main Glassmorphism Content Card -->
  <g transform="translate(${isVertical ? 40 : 60}, ${isVertical ? 80 : 60})">
    <!-- Card Frame -->
    <rect width="${width - (isVertical ? 80 : 120)}" height="${height - (isVertical ? 160 : 120)}" rx="20" fill="${themeColors.bgCard}" stroke="${themeColors.cardBorder}" stroke-width="1.5" />

    <!-- Corner HUD Accents -->
    <path d="M 0,25 L 0,0 L 25,0" fill="none" stroke="${themeColors.accent}" stroke-width="3" />
    <path d="M ${width - (isVertical ? 80 : 120) - 25},0 L ${width - (isVertical ? 80 : 120)},0 L ${width - (isVertical ? 80 : 120)},25" fill="none" stroke="${themeColors.accent}" stroke-width="3" />
    <path d="M 0,${height - (isVertical ? 160 : 120) - 25} L 0,${height - (isVertical ? 160 : 120)} L 25,${height - (isVertical ? 160 : 120)}" fill="none" stroke="${themeColors.accent}" stroke-width="3" />
    <path d="M ${width - (isVertical ? 80 : 120) - 25},${height - (isVertical ? 160 : 120)} L ${width - (isVertical ? 80 : 120)},${height - (isVertical ? 160 : 120)} L ${width - (isVertical ? 80 : 120)},${height - (isVertical ? 160 : 120) - 25}" fill="none" stroke="${themeColors.accent}" stroke-width="3" />

    <!-- Badge Pill -->
    <g transform="translate(40, 40)">
      <rect x="0" y="0" width="${(req.badge?.length || 15) * 11 + 40}" height="32" rx="16" fill="${themeColors.accentGlow}" stroke="${themeColors.accent}" stroke-width="1.5" filter="url(#subtleGlow)" />
      <circle cx="16" cy="16" r="4" fill="${themeColors.accent}" />
      <text x="30" y="21" fill="${themeColors.accent}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="900" letter-spacing="1.5">
        ${(req.badge || 'GLACIA AUTONOMOUS ROBOT').toUpperCase()}
      </text>
    </g>

    <!-- Main Headline -->
    <text x="40" y="125" fill="${themeColors.textMain}" font-family="system-ui, -apple-system, sans-serif" font-size="${isVertical ? 36 : 42}" font-weight="900" letter-spacing="-0.5">
      ${req.headline}
    </text>

    <!-- Subheadline -->
    ${
      req.subheadline
        ? `
    <text x="40" y="${isVertical ? 175 : 170}" fill="${themeColors.textSub}" font-family="system-ui, -apple-system, sans-serif" font-size="${isVertical ? 17 : 19}" font-weight="500">
      ${req.subheadline}
    </text>
    `
        : ''
    }

    <!-- Telemetry Metric Badges (Bottom Row) -->
    <g transform="translate(40, ${height - (isVertical ? 280 : 210)})">
      ${metrics
        .map(
          (m, idx) => `
      <g transform="translate(${idx * (isVertical ? 150 : 200)}, 0)">
        <rect width="${isVertical ? 135 : 180}" height="56" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
        <text x="16" y="22" fill="${themeColors.textSub}" font-family="system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="1.2">${m.label}</text>
        <text x="16" y="44" fill="${themeColors.accent}" font-family="system-ui, sans-serif" font-size="18" font-weight="900">${m.value}</text>
      </g>
      `
        )
        .join('\n')}
    </g>

    <!-- Footer Signature Brand -->
    <g transform="translate(${width - (isVertical ? 80 : 120) - 240}, ${height - (isVertical ? 160 : 120) - 30})">
      <text x="0" y="0" fill="${themeColors.accent}" font-family="system-ui, sans-serif" font-size="12" font-weight="800" letter-spacing="1.5">
        ⚡ GLACIA SUPREME OS
      </text>
    </g>
  </g>
</svg>
`;

  fs.writeFileSync(filePath, svg, 'utf8');

  return {
    success: true,
    svgContent: svg,
    outputPath: filePath,
    publicUrl: `/runtime/artifacts/design/${fileName}`,
    dimensions: { width, height },
    message: `Đã thiết kế thành công Banner Vector độ phân giải cao (${width}x${height}) phong cách ${req.theme || 'frost_crystal'}.`,
  };
}


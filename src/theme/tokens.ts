export const appTheme = {
  accent: {
    primary: '#83D16F',
    soft: '#244129',
    warm: '#F4C646',
  },
  materials: {
    dirt: '#4B3827',
    grass: '#6FAF54',
    ore: '#D6B04A',
    stone: '#6E726B',
    timber: '#7A5A35',
    torch: '#F2C35B',
  },
  feedback: {
    correct: '#8DE58D',
    danger: '#FF7F6B',
    wrong: '#FF9A65',
    waiting: '#F4C646',
  },
  layout: {
    cardRadius: 14,
    chipRadius: 10,
    controlHeight: 58,
    /** Content column on tablets and the web; phones use the full width. */
    maxContentWidth: 760,
    screenGap: 16,
    screenPadding: 20,
    /** From this width two-column layouts kick in. */
    wideBreakpoint: 700,
  },
  shadow: {
    card: '0 14px 26px rgba(0, 0, 0, 0.28)',
    block: '0 8px 0 rgba(12, 20, 14, 0.92)',
    panel: '0 12px 24px rgba(0, 0, 0, 0.24)',
  },
  surface: {
    base: '#132017',
    border: 'rgba(214, 240, 192, 0.12)',
    borderStrong: 'rgba(214, 240, 192, 0.22)',
    borderFocus: 'rgba(244, 198, 70, 0.7)',
    canvas: '#0D1410',
    gradient: ['#0D1410', '#16261A', '#2A2014'] as const,
    raised: 'rgba(255,255,255,0.06)',
    inset: 'rgba(12, 20, 14, 0.58)',
    accent: 'rgba(255, 216, 77, 0.18)',
    successSoft: 'rgba(141,229,141,0.14)',
    warningSoft: 'rgba(244,198,70,0.14)',
  },
  surfaceTiers: {
    hero: {
      base: '#1A2518',
      edge: 'rgba(180, 209, 139, 0.26)',
      inset: 'rgba(11, 16, 10, 0.66)',
    },
    panel: {
      base: '#1F281C',
      edge: 'rgba(151, 175, 125, 0.2)',
      inset: 'rgba(13, 19, 12, 0.54)',
    },
    utility: {
      base: 'rgba(255,255,255,0.06)',
      edge: 'rgba(214, 240, 192, 0.18)',
      inset: 'rgba(12, 20, 14, 0.42)',
    },
  },
  text: {
    inverse: '#0D1410',
    muted: '#A9BDA6',
    primary: '#F3F7E8',
    secondary: '#D3DDC5',
  },
  typography: {
    body: 16,
    caption: 14,
    display: 34,
    h1: 28,
    h2: 24,
    h3: 20,
    micro: 12,
    overline: 14,
  },
} as const;

/**
 * Tiny5 (pixel, OFL) for headings and numbers, Nunito (OFL) for everything people read.
 * Each weight is its own family, so styles set `fontFamily` instead of `fontWeight`.
 */
export const fonts = {
  black: 'Nunito_900Black',
  bold: 'Nunito_700Bold',
  display: 'Tiny5_400Regular',
  extraBold: 'Nunito_800ExtraBold',
  regular: 'Nunito_400Regular',
  semiBold: 'Nunito_600SemiBold',
} as const;

export const motion = {
  fast: 140,
  base: 240,
  slow: 420,
  /** Count-up of scores on the results screen. */
  countUp: 1100,
} as const;

export const colors = {
  accent: appTheme.accent.primary,
  accentSoft: appTheme.accent.soft,
  backgroundGradient: appTheme.surface.gradient,
  border: appTheme.surface.border,
  borderStrong: appTheme.surface.borderStrong,
  borderFocus: appTheme.surface.borderFocus,
  canvas: appTheme.surface.canvas,
  danger: appTheme.feedback.danger,
  dangerSoft: 'rgba(255, 127, 107, 0.14)',
  dirt: appTheme.materials.dirt,
  grass: appTheme.materials.grass,
  highlight: appTheme.accent.warm,
  ore: appTheme.materials.ore,
  panelSurface: appTheme.surfaceTiers.panel.base,
  panelEdge: appTheme.surfaceTiers.panel.edge,
  sceneSurface: appTheme.surfaceTiers.hero.base,
  sceneEdge: appTheme.surfaceTiers.hero.edge,
  timber: appTheme.materials.timber,
  torch: appTheme.materials.torch,
  surfaceAccent: appTheme.surface.accent,
  surfaceInset: appTheme.surface.inset,
  surfaceHeroInset: appTheme.surfaceTiers.hero.inset,
  surfacePanelInset: appTheme.surfaceTiers.panel.inset,
  success: appTheme.feedback.correct,
  successSoft: appTheme.surface.successSoft,
  stone: appTheme.materials.stone,
  surface: appTheme.surface.base,
  surfaceRaised: appTheme.surface.raised,
  utilitySurface: appTheme.surfaceTiers.utility.base,
  utilityEdge: appTheme.surfaceTiers.utility.edge,
  wrong: appTheme.feedback.wrong,
  textMuted: appTheme.text.muted,
  textPrimary: appTheme.text.primary,
  textSecondary: appTheme.text.secondary,
} as const;

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 10,
  md: 16,
  lg: appTheme.layout.screenPadding,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: appTheme.layout.cardRadius,
  full: appTheme.layout.chipRadius,
} as const;

export const typography = appTheme.typography;

export const shadows = {
  block: {
    boxShadow: appTheme.shadow.block,
  },
  panel: {
    boxShadow: appTheme.shadow.panel,
  },
  soft: {
    boxShadow: appTheme.shadow.card,
  },
} as const;

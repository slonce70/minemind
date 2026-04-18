export const appTheme = {
  accent: {
    primary: '#83D16F',
    soft: '#244129',
    warm: '#F4C646',
  },
  feedback: {
    correct: '#8DE58D',
    danger: '#FF7F6B',
    wrong: '#FF9A65',
    waiting: '#F4C646',
  },
  layout: {
    cardRadius: 18,
    chipRadius: 16,
    controlHeight: 58,
    screenGap: 16,
    screenPadding: 20,
  },
  shadow: {
    card: '0 14px 26px rgba(0, 0, 0, 0.28)',
  },
  surface: {
    base: '#132017',
    border: 'rgba(214, 240, 192, 0.12)',
    borderStrong: 'rgba(214, 240, 192, 0.22)',
    canvas: '#0D1410',
    gradient: ['#0D1410', '#16261A', '#2A2014'] as const,
    raised: 'rgba(255,255,255,0.06)',
    successSoft: 'rgba(141,229,141,0.14)',
    warningSoft: 'rgba(244,198,70,0.14)',
  },
  text: {
    inverse: '#0D1410',
    muted: '#9CB19A',
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
    micro: 11,
    overline: 12,
  },
} as const;

export const colors = {
  accent: appTheme.accent.primary,
  accentSoft: appTheme.accent.soft,
  backgroundGradient: appTheme.surface.gradient,
  border: appTheme.surface.border,
  borderStrong: appTheme.surface.borderStrong,
  canvas: appTheme.surface.canvas,
  danger: appTheme.feedback.danger,
  dangerSoft: 'rgba(255, 127, 107, 0.14)',
  highlight: appTheme.accent.warm,
  success: appTheme.feedback.correct,
  successSoft: appTheme.surface.successSoft,
  surface: appTheme.surface.base,
  surfaceRaised: appTheme.surface.raised,
  textMuted: appTheme.text.muted,
  textPrimary: appTheme.text.primary,
  textSecondary: appTheme.text.secondary,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: appTheme.layout.screenPadding,
  xl: 32,
} as const;

export const radii = {
  lg: 16,
  xl: appTheme.layout.cardRadius,
  full: appTheme.layout.chipRadius,
} as const;

export const typography = appTheme.typography;

export const shadows = {
  soft: {
    boxShadow: appTheme.shadow.card,
  },
} as const;

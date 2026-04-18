export const appTheme = {
  accent: {
    primary: '#77E1A8',
    soft: '#1D3D2E',
    warm: '#FFD84D',
  },
  feedback: {
    correct: '#6EF0A6',
    danger: '#FF6C7A',
    wrong: '#FF7A72',
    waiting: '#FFD84D',
  },
  layout: {
    cardRadius: 24,
    chipRadius: 999,
    controlHeight: 56,
    screenGap: 16,
    screenPadding: 20,
  },
  shadow: {
    card: '0 14px 30px rgba(0, 0, 0, 0.24)',
  },
  surface: {
    base: '#101826',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.16)',
    canvas: '#0B1020',
    gradient: ['#111827', '#172033', '#201528'] as const,
    raised: 'rgba(255,255,255,0.08)',
    successSoft: 'rgba(94,229,158,0.14)',
    warningSoft: 'rgba(255,216,77,0.14)',
  },
  text: {
    inverse: '#0B1020',
    muted: '#94A3B8',
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
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
  dangerSoft: appTheme.surface.warningSoft,
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

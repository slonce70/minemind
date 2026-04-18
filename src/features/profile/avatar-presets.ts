export const avatarPresets = [
  { id: 'fox', label: 'Fox', color: '#FF7A18' },
  { id: 'slime', label: 'Slime', color: '#33C76B' },
  { id: 'bee', label: 'Bee', color: '#F5B301' },
  { id: 'axolotl', label: 'Axolotl', color: '#FF5E8A' },
] as const;

export const avatarLookup = Object.fromEntries(
  avatarPresets.map((avatar) => [avatar.id, avatar])
) as Record<string, (typeof avatarPresets)[number]>;

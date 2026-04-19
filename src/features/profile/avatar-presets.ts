export const avatarPresets = [
  { id: 'fox', labelKey: 'avatars.fox', label: 'Fox', color: '#FF7A18' },
  { id: 'slime', labelKey: 'avatars.slime', label: 'Slime', color: '#33C76B' },
  { id: 'bee', labelKey: 'avatars.bee', label: 'Bee', color: '#F5B301' },
  { id: 'axolotl', labelKey: 'avatars.axolotl', label: 'Axolotl', color: '#FF5E8A' },
] as const;

export const avatarLookup = Object.fromEntries(
  avatarPresets.map((avatar) => [avatar.id, avatar])
) as Record<string, (typeof avatarPresets)[number]>;

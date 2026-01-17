// Avatar Icons - Organized by categories for better UX
// Image avatars stored in /public/avatars/

// Category: Illustrated Characters (professional vector illustrations)
export const ILLUSTRATED_AVATARS = [
  '/avatars/girl_435066.png',
  '/avatars/boy_2945312.png',
  '/avatars/man_1912108.png',
  '/avatars/man_4179639.png',
  '/avatars/man_6714070.png',
  '/avatars/profile_11045288.png',
  '/avatars/profile_11045308.png',
  '/avatars/pirate_1010047.png',
  '/avatars/french_9703059.png',
  '/avatars/fancy_6970425.png',
  '/avatars/steampunk_9436366.png',
  '/avatars/writer_475233.png',
  '/avatars/little-red-riding-hood_3531023.png',
  '/avatars/avatar_8323317.png',
  '/avatars/boy_2945512.png',
  '/avatars/boy_6530866.png',
  '/avatars/cat_3530528.png',
  '/avatars/owl_9049305.png',
  '/avatars/pilot_818056.png',
  '/avatars/student_10156005.png',
  '/avatars/superhero_1624485.png',
  '/avatars/vampire_2155416.png',
  '/avatars/woman_4196192.png',
];

// Category: Custom avatars (numbered 1-49)
export const CUSTOM_AVATARS = Array.from({ length: 49 }, (_, i) => `/avatars/${i + 1}.png`);

// Category: Emoji avatars (popular selections)
export const EMOJI_AVATARS = [
  // Faces
  '😊', '😎', '🤓', '🥳', '😇', '🤩', '🥰', '🤖', '👻', '😺',
  // Animals
  '🐱', '🐶', '🐼', '🦊', '🦁', '🐯', '🦄', '🐲', '🐸', '🐵',
  // Nature & Objects
  '🌸', '⭐', '🌙', '🔥', '💎', '🎮', '🎨', '🎵', '🏆', '🚀',
];

// All image avatars combined
export const IMAGE_AVATARS = [...ILLUSTRATED_AVATARS, ...CUSTOM_AVATARS];

// Categories for UI display
export const AVATAR_CATEGORIES = [
  { key: 'illustrated', label: 'Nhân vật', icons: ILLUSTRATED_AVATARS, isImage: true },
  { key: 'custom', label: 'Tùy chỉnh', icons: CUSTOM_AVATARS, isImage: true },
  { key: 'emoji', label: 'Emoji', icons: EMOJI_AVATARS, isImage: false },
];

// All avatars flat array
export const ALL_AVATAR_ICONS = [...IMAGE_AVATARS, ...EMOJI_AVATARS];

// Check if avatar is an image URL
export function isImageAvatar(avatar: string): boolean {
  return avatar.startsWith('/avatars/') || avatar.startsWith('http');
}

// Get random avatar
export function getRandomAvatar(): string {
  return ALL_AVATAR_ICONS[Math.floor(Math.random() * ALL_AVATAR_ICONS.length)];
}

// Get avatar by category
export function getAvatarsByCategory(category: string): string[] {
  const cat = AVATAR_CATEGORIES.find(c => c.key === category);
  return cat ? cat.icons : [];
}

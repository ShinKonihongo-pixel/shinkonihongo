// Avatar Icons - Image avatars + reduced emoji selection
// Image avatars are stored in /public/avatars/

// Image avatar paths (13 illustrated avatars)
export const IMAGE_AVATARS = [
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
];

// Reduced emoji selection (30 popular emojis)
export const EMOJI_AVATARS = [
  // Faces (10)
  '😊', '😎', '🤓', '🥳', '😇', '🤩', '🥰', '🤖', '👻', '😺',
  // Animals (10)
  '🐱', '🐶', '🐼', '🦊', '🦁', '🐯', '🦄', '🐲', '🐸', '🐵',
  // Nature & Objects (10)
  '🌸', '⭐', '🌙', '🔥', '💎', '🎮', '🎨', '🎵', '🏆', '🚀',
];

// Combined categories for UI
export const AVATAR_CATEGORIES = [
  { key: 'images', label: 'Nhân vật', icons: IMAGE_AVATARS, isImage: true },
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

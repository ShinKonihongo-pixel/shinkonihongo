// Types and constants for music player

export const MUSIC_SOURCES = [
  { name: 'Pixabay Music', url: 'https://pixabay.com/music/', icon: '🎵' },
  { name: 'Free Music Archive', url: 'https://freemusicarchive.org/', icon: '📚' },
  { name: 'Uppbeat', url: 'https://uppbeat.io/', icon: '🎧' },
  { name: 'Mixkit', url: 'https://mixkit.co/free-stock-music/', icon: '🎼' },
];

export const EMOJI_OPTIONS = [
  '🎵', '🎶', '🎼', '🎧', '🎤', '🎸', '🥁', '🎹', '🎺', '🎻',
  '🪕', '🎷', '💿', '📀', '🔊', '💫', '⭐', '🌟', '✨', '🌸',
  '🌺', '🌼', '🌻', '🔥', '❤️'
];

export const VOLUME_PRESETS = [
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: 'Max' },
];

export type RepeatMode = 'none' | 'all' | 'one';

export interface FloatingMusicPlayerProps {
  onClose?: () => void;
}

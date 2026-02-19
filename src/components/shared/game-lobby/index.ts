// Barrel export for game lobby shared components

// Legacy basic components
export { GameCodeDisplay } from './game-code-display';
export { PlayerListGrid } from './player-list-grid';
export { LobbyActionBar } from './lobby-action-bar';
export { normalizePlayer } from './types';
export type { BaseLobbyPlayer } from './types';

// Premium lobby components (full-screen immersive)
export { PremiumLobbyShell } from './premium-lobby-shell';
export type { PremiumLobbyAccent } from './premium-lobby-shell';
export { LobbyHostCard } from './lobby-host-card';
export { LobbyJoinSection } from './lobby-join-section';
export { LobbyPlayersPanel } from './lobby-players-panel';
export { LobbyStartFooter } from './lobby-start-footer';

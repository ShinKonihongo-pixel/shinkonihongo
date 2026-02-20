// Shared lobby state/handlers
// Replaces identical boilerplate in 7 lobby components

import { useState, useMemo, useCallback } from 'react';
import type { BasePlayer } from './game-types';
import { normalizePlayer } from '../../components/shared/game-lobby';

interface UseLobbyStateConfig {
  /** URL slug for join link, e.g. 'image-word' */
  gameSlug: string;
}

interface UseLobbyStateProps {
  players: Record<string, BasePlayer>;
  hostId: string;
  currentPlayerId: string;
  maxPlayers: number;
  minPlayers: number;
  code: string;
  onKickPlayer?: (playerId: string) => void;
}

export function useLobbyState(
  props: UseLobbyStateProps,
  config: UseLobbyStateConfig,
) {
  const { players, hostId, currentPlayerId, maxPlayers, minPlayers, code, onKickPlayer } = props;
  const { gameSlug } = config;

  // Local UI state
  const [qrVisible, setQrVisible] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [kickTarget, setKickTarget] = useState<string | null>(null);

  const isHost = hostId === currentPlayerId;

  const { hostPlayer, normalizedPlayers, playerCount, fillPercent } = useMemo(() => {
    const list = Object.values(players);
    return {
      hostPlayer: list.find(p => p.odinhId === hostId),
      normalizedPlayers: list.map(p =>
        normalizePlayer({
          ...p,
          odinhId: p.odinhId,
          isHost: p.odinhId === hostId,
          isBot: (p as any).isBot,
          role: p.role,
        })
      ),
      playerCount: list.length,
      fillPercent: Math.min(100, (list.length / maxPlayers) * 100),
    };
  }, [players, maxPlayers, hostId]);

  const canStart = playerCount >= minPlayers;
  const joinUrl = `${window.location.origin}?game=${gameSlug}&join=${code}`;

  // Handlers
  const handleKick = useCallback((id: string) => setKickTarget(id), []);
  const handleKickConfirm = useCallback(() => {
    if (!kickTarget || !onKickPlayer) return;
    onKickPlayer(kickTarget);
    setKickTarget(null);
  }, [kickTarget, onKickPlayer]);

  const openLeaveConfirm = useCallback(() => setShowLeaveConfirm(true), []);
  const closeLeaveConfirm = useCallback(() => setShowLeaveConfirm(false), []);
  const closeKickConfirm = useCallback(() => setKickTarget(null), []);

  return {
    // UI state
    qrVisible, setQrVisible,
    showLeaveConfirm, kickTarget,
    // Computed
    isHost, hostPlayer, normalizedPlayers,
    playerCount, fillPercent, canStart, joinUrl,
    // Handlers
    handleKick, handleKickConfirm,
    openLeaveConfirm, closeLeaveConfirm, closeKickConfirm,
  };
}

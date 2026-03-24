// Lobby Host Card — Displays host info with VIP styling
// Reusable across all premium game lobbies

import { useMemo } from 'react';
import { isImageAvatar } from '../../../utils/avatar-icons';
import { getVipNameClasses, getVipNameStyle, getVipBadge, isVipRole } from '../../../utils/vip-styling';

interface LobbyHostCardProps {
  displayName: string;
  avatar: string;
  role?: string;
}

export function LobbyHostCard({ displayName, avatar, role }: LobbyHostCardProps) {
  const vipBadge = useMemo(() => getVipBadge(role), [role]);
  const nameClass = useMemo(() => {
    return isVipRole(role)
      ? getVipNameClasses(role, 'pl-lobby-host-name')
      : 'pl-lobby-host-name';
  }, [role]);
  const nameStyle = useMemo(() => getVipNameStyle(role), [role]);

  return (
    <div className="pl-lobby-host-card">
      <div className="pl-lobby-host-avatar">
        {avatar && isImageAvatar(avatar)
          ? <img src={avatar} alt={displayName} loading="lazy" />
          : (avatar || displayName.charAt(0).toUpperCase())}
      </div>
      <div className="pl-lobby-host-info">
        <div className="pl-lobby-host-name-row">
          <span className={nameClass} style={nameStyle} title={displayName}>
            {vipBadge && <span className="vip-badge">{vipBadge}</span>}
            {displayName}
          </span>
          <span className="pl-lobby-host-badge">Host</span>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import type { GameSetupConfig } from './types';
import { SliderInput } from './slider-input';

interface GameModeSectionProps {
  config: GameSetupConfig;
  gameMode: string;
  setGameMode: (value: string) => void;
  teamCount: number;
  setTeamCount: (value: number) => void;
  maxPlayersPerTeam: number;
  setMaxPlayersPerTeam: (value: number) => void;
  userRole?: string;
}

export function GameModeSection({
  config,
  gameMode,
  setGameMode,
  teamCount,
  setTeamCount,
  maxPlayersPerTeam,
  setMaxPlayersPerTeam,
  userRole,
}: GameModeSectionProps) {
  const isVipOrAdmin = userRole === 'super_admin' || userRole === 'vip_user';
  const [upgradeHint, setUpgradeHint] = useState<string | null>(null);

  const showUpgradeHint = useCallback((key: string) => {
    setUpgradeHint(key);
    setTimeout(() => setUpgradeHint(prev => prev === key ? null : prev), 3000);
  }, []);

  const teamCountFreeMax = config.teamCountFreeMax ?? config.teamCountSlider?.max ?? 6;
  const pptFreeMax = config.maxPlayersPerTeamFreeMax ?? config.maxPlayersPerTeamSlider?.max ?? 6;

  const handleTeamCountChange = useCallback((val: number) => {
    if (!isVipOrAdmin && val > teamCountFreeMax) {
      setTeamCount(teamCountFreeMax);
      showUpgradeHint('teamCount');
    } else {
      setTeamCount(val);
    }
  }, [isVipOrAdmin, teamCountFreeMax, setTeamCount, showUpgradeHint]);

  const handlePPTChange = useCallback((val: number) => {
    if (!isVipOrAdmin && val > pptFreeMax) {
      setMaxPlayersPerTeam(pptFreeMax);
      showUpgradeHint('ppt');
    } else {
      setMaxPlayersPerTeam(val);
    }
  }, [isVipOrAdmin, pptFreeMax, setMaxPlayersPerTeam, showUpgradeHint]);

  return (
    <div className="rm-field">
      <div className="rm-mode-cards">
        {config.gameModeOptions!.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`rm-mode-card ${gameMode === opt.value ? 'active' : ''}`}
            onClick={() => setGameMode(opt.value)}
          >
            <div className="rm-mode-card-icon">{opt.icon}</div>
            <div className="rm-mode-card-content">
              <span className="rm-mode-card-label">{opt.label}</span>
              <span className="rm-mode-card-desc">{opt.description}</span>
            </div>
            <div className="rm-mode-card-check">
              {gameMode === opt.value && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="9" fill="currentColor" opacity="0.15" />
                  <path d="M5.5 9L8 11.5L12.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {gameMode === 'team' && (
        <div className="rm-team-config">
          {config.teamCountSlider && (
            <>
              <SliderInput
                value={teamCount}
                onChange={handleTeamCountChange}
                config={config.teamCountSlider}
                label="Số đội"
                icon={<Users size={16} />}
                suffix=" đội"
                freeMax={!isVipOrAdmin ? teamCountFreeMax : undefined}
              />
              {upgradeHint === 'teamCount' && (
                <div className="rm-upgrade-hint">
                  🌟 Nâng cấp VIP để tạo tới {config.teamCountSlider.max} đội
                </div>
              )}
            </>
          )}
          {config.maxPlayersPerTeamSlider && (
            <>
              <SliderInput
                value={maxPlayersPerTeam}
                onChange={handlePPTChange}
                config={config.maxPlayersPerTeamSlider}
                label="Số người mỗi đội"
                icon={<Users size={16} />}
                suffix=" người"
                freeMax={!isVipOrAdmin ? pptFreeMax : undefined}
              />
              {upgradeHint === 'ppt' && (
                <div className="rm-upgrade-hint">
                  🌟 Nâng cấp VIP để thêm tới {config.maxPlayersPerTeamSlider.max} người/đội
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

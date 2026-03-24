// Daily missions widget for home page

import { Target, Check, Sparkles } from 'lucide-react';
import type { DailyMission } from '../../types/achievements';
import { getMissionIcon } from '../../data/mission-templates';
import './daily-missions-widget.css';

interface DailyMissionsWidgetProps {
  missions: DailyMission[];
  allCompleted: boolean;
  bonusClaimed: boolean;
  onClaimBonus: () => void;
}

export function DailyMissionsWidget({
  missions,
  allCompleted,
  bonusClaimed,
  onClaimBonus,
}: DailyMissionsWidgetProps) {
  const completedCount = missions.filter(m => m.isCompleted).length;

  if (missions.length === 0) return null;

  return (
    <div className="dm-widget">
      <div className="dm-header">
        <div className="dm-header-left">
          <Target size={18} className="dm-header-icon" />
          <span className="dm-title">Nhiệm Vụ Hàng Ngày</span>
        </div>
        <span className="dm-header-badge">{completedCount}/{missions.length}</span>
      </div>
      <div className="dm-divider" />

      <div className="dm-list">
        {missions.map(mission => {
          const Icon = getMissionIcon(mission.type);
          const percent = Math.min((mission.progress / mission.target) * 100, 100);

          return (
            <div key={mission.id} className={`dm-mission ${mission.isCompleted ? 'completed' : ''}`}>
              <div className="dm-mission-icon">
                {mission.isCompleted ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <div className="dm-mission-content">
                <div className="dm-mission-title">{mission.title}</div>
                <div className="dm-mission-bar">
                  <div className="dm-mission-bar-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <div className="dm-mission-right">
                <span className="dm-mission-progress-text">
                  {mission.progress}/{mission.target}
                </span>
                <span className="dm-mission-xp">+{mission.xpReward} XP</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bonus banner when all complete */}
      {allCompleted && (
        <div className="dm-bonus">
          <span className="dm-bonus-text">
            <Sparkles size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Bonus +50 XP!
          </span>
          {bonusClaimed ? (
            <span className="dm-bonus-claimed">Đã nhận</span>
          ) : (
            <button className="dm-bonus-btn" onClick={onClaimBonus}>Nhận thưởng</button>
          )}
        </div>
      )}
    </div>
  );
}

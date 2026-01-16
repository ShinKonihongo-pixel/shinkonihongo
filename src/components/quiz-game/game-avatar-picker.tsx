// Game Avatar Picker - Select avatar before joining/creating game

import { useState } from 'react';
import { AVATAR_CATEGORIES, isImageAvatar } from '../../utils/avatar-icons';

interface GameAvatarPickerProps {
  currentAvatar?: string;
  playerName: string;
  onSelect: (avatar: string) => void;
}

export function GameAvatarPicker({ currentAvatar, playerName, onSelect }: GameAvatarPickerProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '');
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    onSelect(avatar);
    setShowPicker(false);
  };

  const displayAvatar = selectedAvatar || currentAvatar;

  return (
    <div className="game-avatar-picker">
      <div className="avatar-preview" onClick={() => setShowPicker(!showPicker)}>
        <div className="avatar-display">
          {displayAvatar && isImageAvatar(displayAvatar) ? (
            <img src={displayAvatar} alt="avatar" />
          ) : displayAvatar ? (
            displayAvatar
          ) : (
            playerName.charAt(0).toUpperCase()
          )}
        </div>
        <span className="avatar-change-hint">
          {showPicker ? '▲ Đóng' : '▼ Đổi avatar'}
        </span>
      </div>

      {showPicker && (
        <div className="avatar-picker-dropdown">
          {AVATAR_CATEGORIES.map((category) => (
            <div key={category.key} className="avatar-picker-category">
              <span className="category-label">{category.label}</span>
              <div className="avatar-picker-grid">
                {category.icons.map((avatar) => (
                  <button
                    key={avatar}
                    className={`avatar-picker-item ${selectedAvatar === avatar ? 'selected' : ''} ${category.isImage ? 'is-image' : ''}`}
                    onClick={() => handleSelect(avatar)}
                  >
                    {isImageAvatar(avatar) ? (
                      <img src={avatar} alt="avatar" />
                    ) : (
                      avatar
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

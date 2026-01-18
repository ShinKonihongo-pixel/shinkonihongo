// Inventory Bar Component - Shows player's items (max 3)
// Allows using power-ups and placing traps

import { useState } from 'react';
import type { InventoryItem, SpecialFeatureType, TrapType } from '../../../types/racing-game';
import { SPECIAL_FEATURES, TRAPS } from '../../../types/racing-game';

interface InventoryBarProps {
  inventory: InventoryItem[];
  maxSize?: number;
  onUseItem: (itemId: string, targetId?: string) => void;
  onPlaceTrap?: (trapType: TrapType, position: number) => void;
  currentDistance: number;
  disabled?: boolean;
}

// Main inventory bar component
export function InventoryBar({
  inventory,
  maxSize = 3,
  onUseItem,
  onPlaceTrap,
  currentDistance,
  disabled,
}: InventoryBarProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showPlaceTrapModal, setShowPlaceTrapModal] = useState(false);

  const handleItemClick = (item: InventoryItem) => {
    if (disabled) return;

    if (item.category === 'powerup') {
      // Use power-up immediately
      onUseItem(item.id);
    } else if (item.category === 'trap') {
      // Show trap placement modal
      setSelectedItem(item);
      setShowPlaceTrapModal(true);
    }
  };

  const handlePlaceTrap = (position: number) => {
    if (selectedItem && onPlaceTrap) {
      onPlaceTrap(selectedItem.type as TrapType, position);
      setSelectedItem(null);
      setShowPlaceTrapModal(false);
    }
  };

  const emptySlots = maxSize - inventory.length;

  return (
    <>
      <div className={`inventory-bar ${disabled ? 'disabled' : ''}`}>
        <div className="inventory-label">
          <span className="label-icon">🎒</span>
          <span className="label-text">Túi đồ</span>
        </div>

        <div className="inventory-slots">
          {inventory.map(item => (
            <InventorySlot
              key={item.id}
              item={item}
              onClick={() => handleItemClick(item)}
              disabled={disabled}
            />
          ))}

          {/* Empty slots */}
          {Array.from({ length: emptySlots }).map((_, idx) => (
            <div key={`empty-${idx}`} className="inventory-slot empty">
              <span className="empty-icon">+</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trap placement modal */}
      {showPlaceTrapModal && selectedItem && (
        <TrapPlacementModal
          trapType={selectedItem.type as TrapType}
          currentDistance={currentDistance}
          onPlace={handlePlaceTrap}
          onCancel={() => {
            setSelectedItem(null);
            setShowPlaceTrapModal(false);
          }}
        />
      )}
    </>
  );
}

interface InventorySlotProps {
  item: InventoryItem;
  onClick: () => void;
  disabled?: boolean;
}

// Individual inventory slot
function InventorySlot({ item, onClick, disabled }: InventorySlotProps) {
  const isPowerup = item.category === 'powerup';
  const info = isPowerup
    ? SPECIAL_FEATURES[item.type as SpecialFeatureType]
    : TRAPS[item.type as TrapType];

  return (
    <button
      className={`inventory-slot ${item.category} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={info.name}
    >
      <span className="slot-emoji">{info.emoji}</span>
      <span className="slot-category">{isPowerup ? '⚡' : '⚠️'}</span>
    </button>
  );
}

interface TrapPlacementModalProps {
  trapType: TrapType;
  currentDistance: number;
  onPlace: (position: number) => void;
  onCancel: () => void;
}

// Modal for selecting where to place a trap
function TrapPlacementModal({
  trapType,
  currentDistance,
  onPlace,
  onCancel,
}: TrapPlacementModalProps) {
  const [position, setPosition] = useState(Math.min(currentDistance + 20, 90));
  const trapDef = TRAPS[trapType];

  const minPosition = Math.max(currentDistance + 5, 10);
  const maxPosition = 95;

  return (
    <div className="trap-placement-modal-overlay">
      <div className="trap-placement-modal">
        <div className="modal-header">
          <span className="modal-icon">{trapDef.emoji}</span>
          <h3>Đặt Bẫy {trapDef.name}</h3>
        </div>

        <div className="modal-content">
          <p className="placement-desc">
            Chọn vị trí đặt bẫy trên đường đua (phía trước bạn)
          </p>

          <div className="placement-track-preview">
            <div className="track-line">
              <div
                className="your-position"
                style={{ left: `${currentDistance}%` }}
                title="Vị trí của bạn"
              >
                📍
              </div>
              <div
                className="trap-position"
                style={{ left: `${position}%` }}
              >
                {trapDef.emoji}
              </div>
              <div className="finish-line" style={{ left: '100%' }}>
                🏁
              </div>
            </div>
          </div>

          <div className="placement-slider">
            <label>
              Vị trí: {position.toFixed(0)}%
            </label>
            <input
              type="range"
              min={minPosition}
              max={maxPosition}
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
            />
            <div className="slider-labels">
              <span>Gần ({minPosition}%)</span>
              <span>Xa ({maxPosition}%)</span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Hủy
          </button>
          <button className="place-btn" onClick={() => onPlace(position)}>
            <span>{trapDef.emoji}</span>
            Đặt Bẫy
          </button>
        </div>
      </div>
    </div>
  );
}

interface InventoryItemPreviewProps {
  type: SpecialFeatureType | TrapType;
  category: 'powerup' | 'trap';
}

// Preview of an item (for rewards, etc.)
export function InventoryItemPreview({ type, category }: InventoryItemPreviewProps) {
  const isPowerup = category === 'powerup';
  const info = isPowerup
    ? SPECIAL_FEATURES[type as SpecialFeatureType]
    : TRAPS[type as TrapType];

  return (
    <div className={`inventory-item-preview ${category}`}>
      <div className="preview-emoji">{info.emoji}</div>
      <div className="preview-info">
        <span className="preview-name">{info.name}</span>
        <span className="preview-desc">{info.description}</span>
      </div>
      <div className="preview-category">
        {isPowerup ? '⚡ Power-up' : '⚠️ Bẫy'}
      </div>
    </div>
  );
}

interface InventoryFullIndicatorProps {
  show: boolean;
}

// Indicator shown when inventory is full
export function InventoryFullIndicator({ show }: InventoryFullIndicatorProps) {
  if (!show) return null;

  return (
    <div className="inventory-full-indicator">
      <span className="full-icon">🎒</span>
      <span className="full-text">Túi đồ đã đầy!</span>
    </div>
  );
}

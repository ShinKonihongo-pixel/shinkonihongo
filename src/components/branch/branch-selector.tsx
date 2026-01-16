// Branch selector dropdown component

import { useState, useRef, useEffect } from 'react';
import type { Branch } from '../../types/branch';

interface BranchSelectorProps {
  branches: Branch[];
  currentBranch: Branch | null;
  onSelect: (branch: Branch) => void;
  loading?: boolean;
}

export function BranchSelector({
  branches,
  currentBranch,
  onSelect,
  loading,
}: BranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeBranches = branches.filter(b => b.status === 'active');

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          background: '#fff',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          minWidth: '180px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🏢</span>
          <span style={{ fontWeight: 500 }}>
            {currentBranch ? currentBranch.name : 'Chọn chi nhánh'}
          </span>
        </div>
        <span style={{
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxHeight: '300px',
          overflow: 'auto',
        }}>
          {activeBranches.length === 0 ? (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: '#999',
              fontSize: '14px',
            }}>
              Không có chi nhánh nào
            </div>
          ) : (
            activeBranches.map((branch) => (
              <div
                key={branch.id}
                onClick={() => {
                  onSelect(branch);
                  setIsOpen(false);
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  background: currentBranch?.id === branch.id ? '#f5f0ff' : '#fff',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (currentBranch?.id !== branch.id) {
                    e.currentTarget.style.background = '#f9f9f9';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = currentBranch?.id === branch.id ? '#f5f0ff' : '#fff';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>
                      {branch.name}
                    </div>
                    {branch.address && (
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                        {branch.address}
                      </div>
                    )}
                  </div>
                  {currentBranch?.id === branch.id && (
                    <span style={{ color: '#667eea', fontSize: '16px' }}>✓</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar
interface BranchSelectorCompactProps {
  branches: Branch[];
  currentBranch: Branch | null;
  onSelect: (branch: Branch) => void;
}

export function BranchSelectorCompact({
  branches,
  currentBranch,
  onSelect,
}: BranchSelectorCompactProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeBranches = branches.filter(b => b.status === 'active');

  if (activeBranches.length <= 1) {
    // Don't show selector if only one branch
    return currentBranch ? (
      <div style={{
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 500,
      }}>
        🏢 {currentBranch.name}
      </div>
    ) : null;
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          border: 'none',
          background: 'rgba(255,255,255,0.1)',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: '13px',
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <span>🏢 {currentBranch?.name || 'Chọn chi nhánh'}</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          {activeBranches.map((branch) => (
            <div
              key={branch.id}
              onClick={() => {
                onSelect(branch);
                setIsOpen(false);
              }}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                color: '#333',
                borderBottom: '1px solid #eee',
                background: currentBranch?.id === branch.id ? '#f5f0ff' : '#fff',
                fontSize: '13px',
              }}
            >
              {branch.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

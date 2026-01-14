// Offline status indicator component

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  offlineCardCount: number;
}

export function OfflineIndicator({
  isOnline,
  isSyncing,
  offlineCardCount,
}: OfflineIndicatorProps) {
  // Show nothing if online and not syncing
  if (isOnline && !isSyncing) {
    return null;
  }

  return (
    <div className={`offline-indicator ${isOnline ? 'syncing' : 'offline'}`}>
      {!isOnline ? (
        <>
          <span className="offline-icon">📴</span>
          <span className="offline-text">
            Offline • {offlineCardCount} thẻ có sẵn
          </span>
        </>
      ) : isSyncing ? (
        <>
          <span className="offline-icon syncing">🔄</span>
          <span className="offline-text">Đang đồng bộ...</span>
        </>
      ) : null}
    </div>
  );
}
